import { Handler } from "aws-lambda";
import { getCollection, generateVehicleId, validateSchema, setForNewExecutiontoSNS } from "../assets";
import { Collection, UpdateResult } from "mongodb";
import * as mongodb from "mongodb";
import { processProspect, processVehicle } from "./processing";
import { Prospect, Vehicle } from "./models/vehicle.model";
import * as  AWS from 'aws-sdk';
import { IVehicle } from "../../types/vehicle";
const sns = new AWS.SNS();

const ACTIVATION = 'ACTIVATION';
const activationProcess = async (): Promise<any> => {
    const vehicleCollection: mongodb.Collection<mongodb.BSON.Document> = await getCollection('vehicles') as unknown as mongodb.Collection<mongodb.BSON.Document>;
    const prospectCollection: mongodb.Collection<mongodb.BSON.Document> = await getCollection('prospects') as unknown as mongodb.Collection<mongodb.BSON.Document>;
    const championCollection: mongodb.Collection<mongodb.BSON.Document> = await getCollection('champions') as unknown as mongodb.Collection<mongodb.BSON.Document>;
    const activationCollection: mongodb.Collection<mongodb.BSON.Document> = await getCollection('dummyactivation') as unknown as mongodb.Collection<mongodb.BSON.Document>;
    const uniqueIdentifierCounterCollection: mongodb.Collection<mongodb.BSON.Document> = await getCollection('uniqueIdentifierCounter') as unknown as mongodb.Collection<mongodb.BSON.Document>;
    let stopLoop = false;
    do {
        try {
            const inc = 1;
            const collection: any = await uniqueIdentifierCounterCollection.findOneAndUpdate(
                { _id: new mongodb.ObjectId('activation_id') },
                {
                    $inc: { count: inc },
                },
                { returnDocument: 'after' },
            );
            const incrementedValue: any = collection?.value?.count;
            // console.log(`NEW COLLECTION INCREMENT`, collection, 'Value ::-->', incrementedValue);

            const activationUpdate: any = await activationCollection.findOneAndUpdate(
                {
                    documentStatus: 'SubmittedForActivation',
                },
                {
                    $set: {
                        activation_id: incrementedValue.toString(),
                        lastUpdateTime: new Date().toISOString(),
                        activationTime: new Date().toISOString(),
                        documentStatus: 'ActivatedButNotCheckedOut',
                    },
                },
                { returnDocument: 'before' },
            );

            // console.log("Updating Activation : --> ",activationUpdate);break;
            const document: any = activationUpdate?.value;
            if (!document) {
                stopLoop = true;
                continue;
            }
            const findVehicle: Vehicle = (await vehicleCollection.findOne({
                vehicle_id: { $eq: document?.vehicle_id },
            })) as unknown as Vehicle;
            const findProspect: Prospect = (await prospectCollection.findOne({
                prospect_id: { $eq: document?.prospect_id },
            })) as unknown as Prospect;
            const findChampion: any = await championCollection.findOne({
                champion_id: { $eq: document?.champion_id },
            });

            if (findChampion?.championType === 'Graduate') {
                await activationCollection.updateOne({}, { $set: {} });
            }
            const isGraduateChampion = findChampion?.championType === 'Graduate';
            const changeDocumentStatus = isGraduateChampion ? 'ReadyForPickUp' : 'ActivatedButNotCheckedOut';
            //Vehicle Collection Modification
            //Q1 When graduate champion what to do with prospect ,
            if (
                checkValidations(findVehicle, findProspect, document)
            ) {
                    await processProspect(
                        findVehicle,
                        document,
                        prospectCollection,
                        changeDocumentStatus,
                        incrementedValue,
                        findProspect,
                    );
                

                console.log('Activation Completed Successfully');
                //Call cancel Parent Activation method
                //If parent activation id is not null then call this method
                
                await sendReminderEmail(findVehicle, document);
                console.log('Activation Completed for the lambda ');
                return 'Activation Completed for the lambda';
            } else {
                await activationCollection.updateOne(
                    {
                        _id: document?._id,
                    },
                    {
                        $set: {
                            activation_id: incrementedValue.toString(),
                            documentStatus: 'ActivationConflict',
                        },
                    },
                );
                await sendConflictEmail(findVehicle, findProspect, document);
                console.error('Activation-Conflict');
            }
        } catch (err) {
            console.error('Session Aborted :', err);
        } finally {
        }
    } while (stopLoop === false);
};

async function sendConflictEmail(vehicleData: any, prospectData: any, document: any) {
    const message = `
    Hello, An activation has failed please check.\n
    Reason for failure :Activation Failed , time of failure ${new Date(document?.lastUpdateTime).toUTCString()},
    Date of activation: \t${new Date(document?.lastUpdateTime).toUTCString()},
    VehicleId: \t${vehicleData?.vehicle_id || ''},
    ProspectId: \t${prospectData?.prospect_id || ''},
    Location: \t${prospectData?.prospectLocation || ''},
    Name of Prospect: \t${prospectData?.prospectName || ''},
    Prospect Address: \t${prospectData?.prospectAddress || ''},
    Prospect Phone number: \t${prospectData?.prospectPhoneNumber || ''},
    Activation officers: \t${document?.nameOfFleetOfficer || ''} 
    vehicle type: \t${prospectData?.vehicleOfInterest || ''}, 
    Plate number: \t${vehicleData?.plateNumber || ''}.
    `;
    const conflictParam: any = {
        Message: message,
        TopicArn: process.env.EXCEPTION_SNS,
        Subject: `Activation Conflict`,
    };
    await sns
        .publish(conflictParam)
        .promise()
        .then((data: any) => {
            console.log('Activation Conflict Message ID', data, 'has been sent');
            return;
        })
        .catch((err: any) => {
            console.error(err, err.stack);
            return;
        });
}

async function sendReminderEmail(vehicleData: any, document: any) {
    const message = `
    Hello ${document?.nameOfFleetOfficer || ''}, A vehicle with Plate number ${
        vehicleData?.plateNumber || ''
    } has been activated but not yet checked out.
     Kindly proceed to check it out immediately. Activation Team
    `;
    const conflictParam: any = {
        Message: message,
        TopicArn: process.env.REMINDEREMAIL_SNS,
        Subject: `Activation Successful-${vehicleData?.vehicle_id || ''}`,
    };
    await sns
        .publish(conflictParam)
        .promise()
        .then((data: any) => {
            console.log('Activation Success Email Message ID', data, 'has been sent');
            return;
        })
        .catch((err: any) => {
            console.error(err, err.stack);
            return;
        });
}

export function checkValidations(findVehicle: any, findProspect: any, activationDocument: any) {
    if (findVehicle?.pricingTemplate == '' || !findVehicle?.pricingTemplate) {
        console.warn('Pricing Template Missing From Activation');
        return false;
    } else if (!!!activationDocument?.vehicle_id) {
        console.warn('VehicleId Missing From Activation');
        return false;
    } else if (!!!activationDocument?.healthInsurance) {
        console.warn('HealthInsurance Missing From Activation');
        return false;
    } else if (!!!activationDocument?.drivingLicense) {
        console.warn('DrivingLicense Missing From Activation');
        return false;
    } else if (!!!activationDocument?.serviceType) {
        console.warn('ServiceType Missing From Activation');
        return false;
    }

    return true;
}


export const handler: Handler = async (event: any) => {
    try {
      console.log("event 👉", event);
      const {
        Execution: { Input },
      } = event;
      let response:IVehicle;
      response = Input;
      
     
      response = setForNewExecutiontoSNS(response,ACTIVATION);
      return response;
    } catch (error: any) {
      return {
        body: JSON.stringify({ message: Error }),
        statusCode: 500,
      };
    }
  };