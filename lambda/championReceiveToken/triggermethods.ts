import * as AWS from 'aws-sdk';
import * as mongodb from 'mongodb'
import { IVehicle } from '../../types/vehicle';
import { generateChampionId, generateVehicleId, getCollection } from '../assets';
import { UniqueIdentifier } from '../../types/uniqueIdentifier';
import { Prospect } from '../activateVehicle/models/vehicle.model';
import { encryptTimeTo4ElementString } from '../assets/utils';
const stepfunctions = new AWS.StepFunctions();
export class StateMachineTriggers {
    uniqueIdentifierCounterCollection: mongodb.Collection<UniqueIdentifier>;
    constructor() {

    }

    async stateMachineForwardForChampion(body: IVehicle, TaskToken: string) {
        try {
            const prospectCollection = await getCollection('prospects');
            const uniqueIdentifierCounterCollection = (await getCollection('uniqueIdentifierCounter')) as unknown as mongodb.Collection<UniqueIdentifier>;
            
            const prospect: mongodb.WithId<Prospect> = (await prospectCollection.findOne({documentStatus:'NotActivated',prospect_id: body?.prospect_id})) as unknown as mongodb.WithId<Prospect>;
            console.log("🚀 ~ file: triggermethods.ts:21 ~ StateMachineTriggers ~ stateMachineForwardForChampion ~ prospect:", prospect)
            const champion_id =await generateChampionId(body?.platformInfo,body?.vehicleLocation,uniqueIdentifierCounterCollection);
            console.log("🚀 ~ file: triggermethods.ts:22 ~ StateMachineTriggers ~ stateMachineForwardForChampion ~ champion_id:", champion_id)
            
            const toAddForChampion: any = {
                "champion_uuid_id": encryptTimeTo4ElementString() || '',
                "champion_id": champion_id || '',
                "championName": "Oladeji Oluwafemi",
                "championPhoneNumber": "+2348121718141",
                "prospect_id": prospect?.prospect_id,
                "vehicle_id": body?.vehicle_id,
                "championEmailId": "test@maxdrive.ai",
                "lastUpdateTime": "2023-10-11T19:05:16.719Z",
                "documentStatus": "Activated",
            };
            // await championCollection.insertOne(toAddForChampion); 
            toAddForChampion.documentStatus = 'ChampionGenerated';
            await stepfunctions.sendTaskSuccess({
                output: JSON.stringify(toAddForChampion),
                taskToken: TaskToken
            }).promise();
            console.log('Champion is generated quitely');

        } catch (err) {
            throw err;
        }
    }
    
}

export const trigger = new StateMachineTriggers();