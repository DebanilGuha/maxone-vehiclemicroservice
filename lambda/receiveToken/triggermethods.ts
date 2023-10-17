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
    async stateMachineForwardForPayment(body: Champion, TaskToken: string) {
        try {
            const vehicleCollection = await getCollection('vehicles');
            const prospectCollection = await getCollection('prospects');
            const vehicleData: mongodb.WithId<IVehicle> = (await vehicleCollection.findOne({vehicle_id: body?.vehicle_id})) as unknown as mongodb.WithId<IVehicle>;
            const payment = {
                "champion_id": body?.champion_id,
                "champion_uuid_id": body?.champion_uuid_id,
                "vehicle_id": body?.vehicle_id,
                "lastUpdateTime": "Sun Oct 15 2023 20:07:54 GMT+0000 (Coordinated Universal Time)",
                "paymentStatus": "Complete",
                "paymentInfo": "Received 2000.00 as Advance Payment",
                "messageInfo": {
                    "documentStatus": "PaymentReceived",
                    "origin": "vams2.0"
                }
            };
            await stepfunctions.sendTaskSuccess({
                output: JSON.stringify(payment),
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
                "champion_uuid_id": body?.champion_uuid_id,
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