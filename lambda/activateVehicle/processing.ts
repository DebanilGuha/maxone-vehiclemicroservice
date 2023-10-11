import * as  AWS from 'aws-sdk';
import { Collection } from 'mongodb';
import { ActivationDocument } from './models/activation.model';
import { Prospect, Vehicle } from './models/vehicle.model';
const sns = new AWS.SNS({ region: process.env.AWS_REGION_CUSTOM });

async function processProspect(
    findVehicle: any,
    document: ActivationDocument,
    prospectCollection: Collection,
    changeDocumentStatus: string,
    incrementedValue: any,
    findProspect: Prospect,
) {
    const prospectUpdate: any = {
        assignedVehicleType: findVehicle?.vehicleType,
        assignedVehicle_vehicle_id: findVehicle?.vehicle_id,
        assignedVehiclePlateNo: findVehicle?.plateNumber,
        assignedVehicleTrim: findVehicle?.vehicleTrim,
        assignedHelmetNumber: document?.helmetNumber,
        contractPage: document?.contractPage,
        contractStatus: document?.contractStatus,
        drivingLicense: document?.drivingLicense,
        healthInsurance: document?.healthInsurance,
        serviceType: document?.serviceType,
        // financierInfo: document?.financierInfo,
        vehicleOptions: document?.vehicleOptions,
        platformInfo: document?.platformInfo,
        contractor_id: '',
        pricingTemplate: findVehicle?.pricingTemplate,
        hpDays: findVehicle?.hpDays,
        lastUpdateTime: new Date().toISOString(),
    };
    //Prospect Collection Modification
    await prospectCollection.updateOne(
        {
            prospect_id: document?.prospect_id,
        },
        {
            $set: {
                ...prospectUpdate,
                documentStatus: changeDocumentStatus,
                activation_id: incrementedValue.toString(),
                prospect_id: document?.prospect_id,
            },
        },
    );
    const prospectActivate: any = {
        ...findProspect,
        ...prospectUpdate,
        messageInfo: {
            documentStatus: 'ActivatedButNotCheckedOut',
            origin: 'vams2.0',
        },
        prospect_id: document?.prospect_id,
        messageType: 'activated',
    };
    delete prospectActivate['_id'];
    delete prospectActivate['documentStatus'];
    const prospectParam: any = {
        Message: JSON.stringify(prospectActivate),
        TopicArn: process.env.PROSPECT_SNS,
    };

    await sns
        .publish(prospectParam)
        .promise()
        .then((data: any) => {
            console.log('Message ID', data, 'has been sent');
        })
        .catch((err: any) => {
            console.error(err, err.stack);
        });
}

/**
 * Graduate Champion Processing
 * @param findVehicle Vehicle Data
 * @param document Document Data coming triggered from EventBridge during Activation
 * @param championCollection Collection of Champion Data
 * @param incrementedValue Incremented Value
 */
async function processChampion(
    isGraduateChampion: boolean,
    findVehicle: Vehicle,
    document: any,
    championCollection: Collection,
    incrementedValue: string,
) {
    //Prospect Collection Modification
    await championCollection.updateOne(
        {
            champion_id: document?.champion_id,
        },
        {
            $set: {
                documentStatus: isGraduateChampion ? 'ReadyForPickUp' : 'Activated',
                activation_id: incrementedValue.toString(),
            },
        },
    );
}

function checkGraduateAndNormalData(vehicleData: any, prospectData: any, championData: any) {
    if (!!prospectData && championData?.championType !== 'Graduate') {
        console.log('Normal Conditions met');
        if (
            (vehicleData?.documentStatus === 'ReadyForActivation' || vehicleData?.documentStatus === 'UpdatedInfo') &&
            prospectData?.documentStatus === 'NotActivated'
        ) {
            return true;
        } else {
            return false;
        }
    } else {
        console.log('Graduate Conditions met');

        if (
            (vehicleData?.documentStatus === 'ReadyForActivation' || vehicleData?.documentStatus === 'UpdatedInfo') &&
            championData?.championType === 'Graduate' &&
            championData?.documentStatus === 'ReadyForActivation'
        ) {
            return true;
        } else {
            return false;
        }
    }
}

async function processVehicle(
    changeDocumentStatus: string,
    document: any,
    vehicleCollection: any,
    findVehicle: any,
    incrementedValue: any,
) {
    const vehicleUpdate: any = {
        vehicleStatus: changeDocumentStatus,
        contractPage: document?.contractPage,
        contractStatus: document?.contractStatus,
        drivingLicense: document?.drivingLicense,
        healthInsurance: document?.healthInsurance,
        helmetNumber: document?.helmetNumber,
        serviceType: document?.serviceType,
        vehicleOptions: document?.vehicleOptions,
        platformInfo: document?.platformInfo,
        prospectLocation: document?.prospectLocation,
        vehicleState: 'Activated',
    };
    await vehicleCollection.updateOne(
        { vehicle_id: findVehicle.vehicle_id },
        {
            $set: {
                documentStatus: changeDocumentStatus,
                ...vehicleUpdate,
                prospect_id: document?.prospect_id,
                lastActivation_id: incrementedValue.toString(),
                activationTime: new Date().toISOString(),
                lastUpdateTime: new Date().toISOString(),
            },
        },
    );

    const newVehicle: any = {
        ...findVehicle,
        ...vehicleUpdate,
        messageInfo: {
            documentStatus: changeDocumentStatus,
            origin: 'vams2.0',
        },
        prospect_id: document?.prospect_id,
        lastUpdateTime: new Date().toISOString(),
        messageType: 'activated',
    };
    delete newVehicle['_id'];
    delete newVehicle['documentStatus'];
    const vehicleParam: any = {
        Message: JSON.stringify(newVehicle),
        TopicArn: process.env.VEHICLE_SNS || 'arn:aws:sns:eu-west-2:048464312507:Vehicle',
    };
    await sns
        .publish(vehicleParam)
        .promise()
        .then((data: any) => {
            console.log('Message ID', data, 'has been sent');
        })
        .catch((err: any) => {
            console.error(err, err.stack);
        });
}

export { processChampion, processProspect, checkGraduateAndNormalData, processVehicle };
