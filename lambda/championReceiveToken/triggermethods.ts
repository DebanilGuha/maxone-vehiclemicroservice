import * as AWS from 'aws-sdk';
import * as mongodb from 'mongodb'
import { IVehicle } from '../../types/vehicle';
import { generateChampionId, generateVehicleId, getCollection } from '../assets';
import { UniqueIdentifier } from '../../types/uniqueIdentifier';
import { Prospect } from '../activateVehicle/models/vehicle.model';
const stepfunctions = new AWS.StepFunctions();
export class StateMachineTriggers {
    uniqueIdentifierCounterCollection: mongodb.Collection<UniqueIdentifier>;
    constructor() {

    }

    async stateMachineForwardForChampion(body: IVehicle, TaskToken: string) {
        try {
            const prospectCollection = await getCollection('prospect');
            const uniqueIdentifierCounterCollection = (await getCollection('uniqueIdentifierCounter')) as unknown as mongodb.Collection<UniqueIdentifier>;
            
            const prospect: mongodb.WithId<Prospect> = (await prospectCollection.findOne({documentStatus:'NotActivated',prospect_id: 'MAX-LO-00601'})) as unknown as mongodb.WithId<Prospect>;
            const toAddForChampion: any = {
                "champion_uuid_id": "8eeacd85-8798-4aa9-b796-167y738hg2s4",
                "champion_id": generateChampionId(body?.platformInfo,body?.vehicleLocation,uniqueIdentifierCounterCollection) || '',
                "championName": "Oladeji Oluwafemi",
                "championPhoneNumber": "+2348121718141",
                "prospect_id": prospect?.prospect_id,
                "vehicle_id": body?.vehicle_id,
                "championEmailId": "test@maxdrive.ai",
                "lastUpdateTime": "2023-10-11T19:05:16.719Z",
                "messageInfo": {
                    "documentStatus": "Activated",
                    "origin": "cs"
                }
            };
            const championCollection =  await getCollection('dummychampion');
            await championCollection.insertOne(toAddForChampion); 
            body.documentStatus = 'ChampionGenerated';
            await stepfunctions.sendTaskSuccess({
                output: JSON.stringify(body),
                taskToken: TaskToken
            }).promise();

        } catch (err) {
            throw err;
        }
    }
    
}

export const trigger = new StateMachineTriggers();