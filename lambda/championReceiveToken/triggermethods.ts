import * as AWS from 'aws-sdk';
import * as mongodb from 'mongodb'
import { IVehicle } from '../../types/vehicle';
import { generateChampionId, generateVehicleId, getCollection } from '../assets';
import { UniqueIdentifier } from '../../types/uniqueIdentifier';
import { Prospect } from '../activateVehicle/models/vehicle.model';
import { encryptTimeTo4ElementString, utilObj } from '../assets/utils';
import { Champion } from '../../types/champion';
const stepfunctions = new AWS.StepFunctions();
export class StateMachineTriggers {
    uniqueIdentifierCounterCollection: mongodb.Collection<UniqueIdentifier>;
    constructor() {

    }

    async stateMachineForwardForChampion(body: Champion) {
        try {
            
            const toAddForChampion: any = {
                "champion_uuid_id": encryptTimeTo4ElementString() || '',
                "champion_id": body?.champion_id || '',
                "championName": "Oladeji Oluwafemi",
                "championPhoneNumber": "+2348121718141",
                "prospect_id": body?.prospect_id,
                "vehicle_id": body?.vehicle_id,
                "championEmailId": "test@maxdrive.ai",
                "lastUpdateTime": "2023-10-11T19:05:16.719Z",
                "documentStatus": "Activated",
            };
            const TaskToken = await utilObj.getTokenFromStorageByVehicleId(body?.vehicle_id,'tokenchampion');
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