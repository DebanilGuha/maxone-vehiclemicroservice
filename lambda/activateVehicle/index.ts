import { Handler } from "aws-lambda";
import { getCollection, generateVehicleId, validateSchema } from "../assets";
import { Collection, UpdateResult } from "mongodb";
import * as mongodb from "mongodb";
import { processProspect, processVehicle } from "./processing";
import { Prospect, Vehicle } from "./models/vehicle.model";
import * as  AWS from 'aws-sdk';
import { IVehicle } from "../../types/vehicle";
import { UniqueIdentifier } from "../../types/uniqueIdentifier";
const sns = new AWS.SNS();

const ACTIVATION = 'ACTIVATION';
const activationProcess = async (): Promise<any> => {
    const vehicleCollection: mongodb.Collection<mongodb.Document> = getCollection('vehicles') as unknown as mongodb.Collection<mongodb.Document>;
    const prospectCollection: mongodb.Collection<mongodb.Document> = getCollection('prospects') as unknown as mongodb.Collection<mongodb.Document>;
    const championCollection: mongodb.Collection<mongodb.Document> = getCollection('champions') as unknown as mongodb.Collection<mongodb.Document>;
    const activationCollection: mongodb.Collection<mongodb.Document> = getCollection('dummyactivation') as unknown as mongodb.Collection<mongodb.Document>;
    const uniqueIdentifierCounterCollection: mongodb.Collection<mongodb.Document> = getCollection('uniqueIdentifierCounter') as unknown as mongodb.Collection<mongodb.Document>;
    let stopLoop = false;
    do {
        try {
            const inc = 1;
            const query: any= {
                _id: 'activation_id',
              } as mongodb.Filter<UniqueIdentifier>;
              const update: mongodb.UpdateFilter<UniqueIdentifier> = {
                $inc: { count: inc },
              };
              
              const options: mongodb.FindOneAndUpdateOptions = {
                returnDocument: 'after',
              };
            const collection = await uniqueIdentifierCounterCollection.findOneAndUpdate(
                query,
                update,
                options
              ) ;
            const incrementedValue: any = collection?.count;
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

            console.log("Updating Activation : --> ",activationUpdate);
            const document: any = activationUpdate;
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
                await processVehicle(
                    'ActivatedButNotCheckedOut', 
                    document, 
                    vehicleCollection, 
                    findVehicle, 
                    incrementedValue
                    );


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
                
                console.log('Activation Completed for the lambda ');
                console.log("🚀 ~ file: index.ts:65 ~ activationProcess ~ findVehicle:", findVehicle);
                return {findVehicle,activationData:'Activation Completed for the lambda'};
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
   
}

export function checkValidations(findVehicle: any, findProspect: any, activationDocument: any) {
     if (!!!activationDocument?.vehicle_id) {
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
     const {vehicle,activationData} = await activationProcess();
      let response:object;
      response = activationData === "Activation Completed for the lambda" ? {championGeneration: true,...event} : {championGeneration: false,...vehicle};
     
     
      return response;
    } catch (error: any) {
        console.error(error);
      return {
        body: JSON.stringify({ message: Error }),
        statusCode: 500,
      };
    }
  };