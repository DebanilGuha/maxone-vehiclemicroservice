import * as AWS from 'aws-sdk';
import * as mongodb from 'mongodb'
import { IVehicle } from '../../types/vehicle';
import { generateContractId, generateVehicleId, getCollection } from '../assets';
import { UniqueIdentifier } from '../../types/uniqueIdentifier';
import { Prospect } from '../activateVehicle/models/vehicle.model';
import { Champion } from '../../types/champion';
const stepfunctions = new AWS.StepFunctions();
export class StateMachineTriggers {
    uniqueIdentifierCounterCollection: mongodb.Collection<UniqueIdentifier>;
    constructor() {

    }
    async stateMachineForwardForNew(body: IVehicle, TaskToken: string) {
        try {
            if (!this.checkValidationForInbound(body)) {
                throw 'Not Complying to New';
            }
            body.documentStatus = 'ReadyForActivation';
            await stepfunctions.sendTaskSuccess({
                output: JSON.stringify(body),
                taskToken: TaskToken
            }).promise();
            console.log('New Added');

        } catch (err) {
            throw err;
        }
    }


    async stateMachineForwardForReadyForActivation(body: IVehicle, TaskToken: string) {
        try {
            const prospectCollection = await getCollection('prospects');
            const prospect: mongodb.WithId<Prospect> = (await prospectCollection.findOne({documentStatus:'NotActivated',prospect_id: body?.prospect_id})) as unknown as mongodb.WithId<Prospect>;
            const toAddForActivation:any = {
                "champion_id": null,
                "champion_uuid_id": null,
                "contractPage": "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",
                "contractPic": "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",
                "contractStatus": "Pending",
                "documentStatus": "SubmittedForActivation",
                "drivingLicense": "false",
                "financierInfo": "Yamaha",
                "healthInsurance": "true",
                "helmetNumber": 3362,
                "lastUpdateTime": "2023-01-23T13:46:31.529Z",
                "nameOfFleetOfficer": "daniel.onyebuchi",
                "parent_activation_id": null,
                "platformInfo": "Max",
                "prospectLocation": body?.vehicleCity || '',
                "prospect_id": prospect?.prospect_id,
                "serviceType": "MAX X Ibadan",
                "vehicleLocation": body.vehicleLocation,
                "vehicleOptions": "MAX Commercial",
                "vehicle_id": body.vehicle_id
            };
            const activationCollection =  await getCollection('dummyactivation');
            await activationCollection.insertOne(toAddForActivation); 
            body.documentStatus = 'Activation';
            await stepfunctions.sendTaskSuccess({
                output: JSON.stringify(body),
                taskToken: TaskToken
            }).promise();

        } catch (err) {
            throw err;
        }
    }

    async stateMachineForwardForActivation(body: IVehicle, TaskToken: string) {
        try {
           
            await stepfunctions.sendTaskSuccess({
                output: JSON.stringify(body),
                taskToken: TaskToken
            }).promise();

        } catch (err) {
            throw err;
        }
    }
    async stateMachineForwardForContractInitiation(body: Champion, TaskToken: string) {
        try {
           const vehicleCollection = await getCollection('vehicles');
           const prospectCollection = await getCollection('prospects');
           const uniqueIdentifierCounterCollection = (await getCollection('uniqueIdentifierCounter')) as unknown as mongodb.Collection<UniqueIdentifier>;
           const vehicleData: mongodb.WithId<IVehicle> = (await vehicleCollection.findOne({vehicle_id: body?.vehicle_id})) as unknown as mongodb.WithId<IVehicle>;
           const constract_id =await generateContractId(vehicleData?.platformInfo,vehicleData?.vehicleLocation,uniqueIdentifierCounterCollection);
            const contract = {
                "contract_id": constract_id,
                "champion_id": body?.champion_id,
                "vehicle_id": body?.vehicle_id,
                "lastUpdateTime": body?.lastUpdateTime,
                "customer_reference": "4afbbb94-a6cd-4a49-8e69-d74bbd4b7791",
                "email": body?.championEmailId,
                "mobile_number": body?.championPhoneNumber,
                "name": body?.championName,
                "preferredBanks": [
                    "232"
                ],
                "messageInfo": {
                    "documentStatus": "ContractInitiated",
                    "origin": "lams2.0"
                }
            }
            await stepfunctions.sendTaskSuccess({
                output: JSON.stringify(contract),
                taskToken: TaskToken
            }).promise();

        } catch (err) {
            throw err;
        }
    }


    async stateMachineForwardForInbound(body: IVehicle, TaskToken: string) {
        try {
            
            body.documentStatus = 'New';
            await stepfunctions.sendTaskSuccess({
                output: JSON.stringify(body),
                taskToken: TaskToken
            }).promise();

        } catch (err) {
            throw err;
        }
    }

    private checkValidationForInbound(body: IVehicle) {
        if (!body?.vehicleType) {
            return false;
        }
        return true;
    }
}

export const trigger = new StateMachineTriggers();