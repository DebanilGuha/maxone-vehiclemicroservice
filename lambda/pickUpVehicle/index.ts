import { Prospect, Vehicle } from './models/vehicle.model';
import { Activation, Champion } from './models/activation.model';
import { Handler } from "aws-lambda";
import { getCollection, generateVehicleId, validateSchema, setForNewExecutiontoSNS, restructureResponseForSNS } from "../assets";
import { Collection, UpdateResult } from "mongodb";

import { IVehicle } from "../../types/vehicle";
import * as mongodb from "mongodb";
import { checkGraduateAndNormalData } from './processing';


const pickUpProcess = async (movementDocument: any) => {
    const vehicleCollection: mongodb.Collection<mongodb.Document> = (getCollection('vehicles')) as unknown as mongodb.Collection<mongodb.Document>;
    const prospectCollection: mongodb.Collection<mongodb.Document> = (getCollection('prospects')) as unknown as mongodb.Collection<mongodb.Document>;
    const movementCollection: mongodb.Collection<mongodb.Document> = (getCollection('movements')) as unknown as mongodb.Collection<mongodb.Document>;
    const championCollection: mongodb.Collection<mongodb.Document> = (getCollection('dummychampion')) as unknown as mongodb.Collection<mongodb.Document>;
    const activationCollection: mongodb.Collection<mongodb.Document> = (getCollection('dummyactivation')) as unknown as mongodb.Collection<mongodb.Document>;
    const options: mongodb.FindOneAndUpdateOptions={ returnDocument: 'after' };
    console.log(JSON.stringify(movementDocument, null, '\t'));
    try {
        const findActivation: Activation = (await activationCollection.findOne({
            $and: [
                { activation_id: movementDocument?.pickUpInfo?.activation_id },
                { documentStatus: 'ReadyForPickUp' },
            ],
        })) as unknown as Activation;
        if (!findActivation) {
            throw 'activation not available';
        }
        const findVehicle: Vehicle = (await vehicleCollection.findOne({
            vehicle_id: { $eq: findActivation?.vehicle_id },
        })) as unknown as Vehicle;
        const findProspect: Prospect | null = findActivation?.prospect_id
            ? ((await prospectCollection.findOne({
                  prospect_id: { $eq: findActivation?.prospect_id },
              })) as unknown as Prospect)
            : null;

        const findChampion: Champion = (await championCollection.findOne({
            champion_id: { $eq: findActivation?.champion_id },
        })) as unknown as Champion;
        //Vehicle Collection Modification
        let checkMaintainenceStatus;
        if (movementDocument?.pickUpInfo?.maintenanceOverride === 'MaintenanceComplete') {
            checkMaintainenceStatus = true;
        } else {
            checkMaintainenceStatus =
                !!findVehicle?.lastMovementInfo?.maintenanceStatus === false ||
                (!!findVehicle?.lastMovementInfo?.maintenanceStatus &&
                    findVehicle?.lastMovementInfo?.maintenanceStatus === 'Complete');
        }
        const paymentToDo = await checkPaymentStatus(findActivation, findVehicle);

        console.log({
            vehicle: JSON.stringify(findVehicle, null, '\t'),
            prospect: JSON.stringify(findProspect, null, '\t'),
            activation: JSON.stringify(findActivation, null, '\t'),
        });

        if (
            checkGraduateAndNormalData(
                findVehicle,
                findProspect,
                findChampion,
                findActivation,
                paymentToDo,
                checkMaintainenceStatus,
            )
        ) {
            
            const vehicleUpdate = {
                prospect_id: findActivation?.prospect_id,
                contract_id: findActivation?.contract_id,
                lastUpdateTime: new Date().toISOString(),
                champion_uuid_id: findActivation?.champion_uuid_id,
                championName: findActivation?.championName,
                championPhoneNumber: findActivation?.championPhoneNumber,
                championEmailId: findActivation?.championEmailId,
                healthInsurance: findActivation?.healthInsurance,
                drivingLicense: findActivation?.drivingLicense,
                prospectLocation: findActivation?.prospectLocation,
            };
            const getVehicleData: IVehicle = (await vehicleCollection.findOneAndUpdate(
                { vehicle_id: findVehicle.vehicle_id },
                {
                    $set: {
                        vehicleStatus: 'Active',
                        documentStatus: 'PickUpComplete',
                        ...vehicleUpdate,
                        lastMovementInfo: Object.assign(movementDocument, {
                            documentStatus: 'PickUpComplete',
                            lastUpdateTime: new Date().toISOString(),
                        }),
                    },
                },
                options
            )) as unknown as IVehicle ;
            const newVehicle: Vehicle = {
                ...findVehicle,
                vehicleStatus: 'Active',
                messageInfo: {
                    documentStatus: 'PickUpComplete',
                    origin: 'vams2.0',
                },
                ...vehicleUpdate,
                messageType: 'pickup',
            };
            delete newVehicle['_id'];
            delete newVehicle['documentStatus'];
            const vehicleParam = {
                Message: JSON.stringify(newVehicle),
                TopicArn: process.env.VEHICLE_SNS,
            };
            const prospectUpdate = {
                lastUpdateTime: new Date().toISOString(),
            };
            //Prospect Collection Modification
            await prospectCollection.updateOne(
                {
                    prospect_id: findActivation?.prospect_id,
                },
                {
                    $set: {
                        ...prospectUpdate,
                        documentStatus: 'PickUpComplete',
                    },
                },
            );
            

            await movementCollection.updateOne(
                {
                    movement_id: movementDocument?.movement_id,
                },
                {
                    $set: {
                        lastUpdateTime: new Date().toISOString(),
                        documentStatus: 'PickUpComplete',
                    },
                },
            );
            await activationCollection.updateOne(
                {
                    _id: findActivation?._id,
                },
                {
                    $set: {
                        lastUpdateTime: new Date().toISOString(),
                        documentStatus: 'PickUpComplete',
                    },
                },
            );
            console.log('Pick-Up Completed Successfully');
            return restructureResponseForSNS(getVehicleData,'PickUpComplete');
        } else {
            await movementCollection.updateOne(
                {
                    movement_id: movementDocument?.movement_id,
                },
                {
                    $set: {
                        documentStatus: 'pickupException',
                    },
                },
            );
            console.error(`Pick-Up Conflict`);
            return 'Error';
        }
    } catch (err) {
        console.error('Session Aborted :', err);
        return 'Error';
    } finally {
    }
    // }
};

function convertToTitleCase(str: string) {
    return str.toLowerCase().replace(/\b\w/g, function (match: any) {
        return match.toUpperCase();
    });
}

async function checkPaymentStatus(activationData: any, vehicleData: any) {
    //ToDO :Replace Country Location
    const countries = (process.env.COUNTRIESNOPAYMENT || '').split(',');
    if (countries.includes(convertToTitleCase(vehicleData?.vehicleCountry))) {
        return 'Complete';
    }
    const twoWheelerThreeWheeler = ['Motorcycle', 'Tricycle', 'eMotorcycle', 'eTricycle'];
    if (twoWheelerThreeWheeler?.includes(vehicleData?.vehicleType)) {
        if (activationData?.paymentStatus !== 'Complete') {
            return 'InComplete';
        }
    }

    return 'Complete';
}


export const handler: Handler = async (event: any) => {
    try {
      console.log("event 👉", event);
      delete event['_id'];
      let response;
      
     response = await pickUpProcess(event);
      
      response = restructureResponseForSNS(response,'PickUpComplete');
      return response;
    } catch (error: any) {
      console.error("Error",error);
      return {
        body: JSON.stringify({ message: error }),
        statusCode: 500,
      };
    }
  };