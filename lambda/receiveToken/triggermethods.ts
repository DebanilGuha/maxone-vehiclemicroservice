import * as AWS from 'aws-sdk';
import * as mongodb from 'mongodb'
import { IVehicle } from '../../types/vehicle';
import { generateContractId, generateVehicleId, getCollection } from '../assets';
import { TokenStorage, UniqueIdentifier } from '../../types/uniqueIdentifier';
import { Prospect } from '../activateVehicle/models/vehicle.model';
import { Champion } from '../../types/champion';
import { utilObj } from '../assets/utils';
const stepfunctions = new AWS.StepFunctions();
export class StateMachineTriggers {
    uniqueIdentifierCounterCollection: mongodb.Collection<UniqueIdentifier>;
    vehicleCollection: mongodb.Collection<TokenStorage>;
    constructor() {
       this.initializeCollection();
    }
    private async initializeCollection(){
        this.vehicleCollection = (getCollection('vehicles')) as unknown as mongodb.Collection<TokenStorage>;
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
            const prospectCollection = getCollection('prospects');
            const vehicleData: mongodb.WithId<IVehicle> = (await this.vehicleCollection.findOne({vehicle_id: body?.vehicle_id})) as unknown as mongodb.WithId<IVehicle>;
            const payment = {
                "champion_id": body?.champion_id,
                "champion_uuid_id": body?.champion_uuid_id,
                "vehicle_id": body?.vehicle_id,
                "lastUpdateTime": "Sun Oct 15 2023 20:07:54 GMT+0000 (Coordinated Universal Time)",
                "paymentStatus": "Complete",
                "paymentInfo": "Received 2000.00 as Advance Payment",
                "messageInfo": {
                    "documentStatus": "PaymentReceived",
                    "origin": "lams2.0"
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
           const prospectCollection = getCollection('prospects');
           const uniqueIdentifierCounterCollection = (getCollection('uniqueIdentifierCounter')) as unknown as mongodb.Collection<UniqueIdentifier>;
           const vehicleData: mongodb.WithId<IVehicle> = (await this.vehicleCollection.findOne({vehicle_id: body?.vehicle_id})) as unknown as mongodb.WithId<IVehicle>;
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
            TaskToken = !TaskToken ? await utilObj.getTokenFromStorage(body?.plateNumber,'token') : TaskToken;
            console.log("this.checkValidationForInboundToNew(body):", this.checkValidationForInboundToNew(body))
            if(this.checkValidationForInboundToNew(body)){
                body.documentStatus = 'New';
                await stepfunctions.sendTaskSuccess({
                    output: JSON.stringify(body),
                    taskToken: TaskToken
                }).promise();
            }else{
                await utilObj.addTokenToStorage(body?.plateNumber,TaskToken,'token');
            }
            

        } catch (err) {
            throw err;
        }
    }

    async stateMachineForwardForNew(body: IVehicle, TaskToken: string) {
        try {
            console.log(" this.checkValidationForNewToReadyForActivation(body):", this.checkValidationForNewToReadyForActivation(body))
            if (this.checkValidationForNewToReadyForActivation(body)) {
                TaskToken = !TaskToken ? await utilObj.getTokenFromStorage(body?.plateNumber,'tokennew') : TaskToken;
                body.documentStatus = 'ReadyForActivation';
                await stepfunctions.sendTaskSuccess({
                    output: JSON.stringify(body),
                    taskToken: TaskToken
                }).promise();
                console.log('New Added');
            }else{
                await utilObj.addTokenToStorage(body?.plateNumber,TaskToken,'tokennew');
            }
            throw 'Not Complying to New';

        } catch (err) {
            throw err;
        }
    }

    async stateMachineForwardForChampion(body: IVehicle, TaskToken: string) {
        await utilObj.addTokenToStorage(body?.plateNumber,TaskToken,'tokenchampion');
    }
    async stateMachineForwardForContract(body: IVehicle, TaskToken: string) {
        await utilObj.addTokenToStorage(body?.plateNumber,TaskToken,'tokencontract');
    }
    async stateMachineForwardForPaymentComplete(body: Champion, TaskToken: string) {
        try {
            
            body.documentStatus = 'PaymentComplete';
            await stepfunctions.sendTaskSuccess({
                output: JSON.stringify(body),
                taskToken: TaskToken
            }).promise();

        } catch (err) {
            throw err;
        }
    }

    private checkValidationForInboundToNew(body: IVehicle) {
        console.log("body?.serviceType:", !!body?.serviceType)
        if (!body?.serviceType) {
            console.log("body?.serviceType  Entered:", !!body?.serviceType)
            return false;
        }
        console.log(" body?.financierInfo Outside:", !!body?.financierInfo);

        if (!body?.financierInfo) {
            console.log(" body?.financierInfo  Entered:", !!body?.financierInfo);
            return false;
        }
        console.log("body?.platformInfo Outside:", !!body?.platformInfo);

        if (!body?.platformInfo) {
            console.log("body?.platformInfo  Entered:", !!body?.platformInfo);
            return false;
        }
        console.log("body?.device_IMEI Outside:", !!body?.device_IMEI)

        if (!body?.device_IMEI) {
            console.log("body?.device_IMEI  Entered:", !!body?.device_IMEI)
            return false;
        }
        console.log("body?.SIM_serialNo Outside:", !!body?.SIM_serialNo);
        if (!body?.SIM_serialNo) {
            console.log("body?.SIM_serialNo  Entered:", !!body?.SIM_serialNo);
            return false;
        }
        console.log("body?.phoneNumber Outside:", !!body?.phoneNumber);
        if (!body?.phoneNumber) {
            console.log("body?.phoneNumber  Entered:", !!body?.phoneNumber);
            return false;
        }
        
        return true;
    }

    private checkValidationForNewToReadyForActivation(body: IVehicle) {
        if (!body?.pricingTemplate) {
            console.log("body?.pricingTemplate:", !!body?.pricingTemplate);
            return false;
        }
        return true;
    }

    
}

export const trigger = new StateMachineTriggers();