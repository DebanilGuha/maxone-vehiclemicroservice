import { getCollection, generateVehicleId, validateSchema, setForNewExecutiontoSNS } from "../../assets";
import { Collection, UpdateResult } from "mongodb";

import { IVehicle } from "../../types/vehicle";
import * as mongo from "mongodb";
import { UniqueIdentifier } from "../../types/uniqueIdentifier";
import { ValidationVehicleObj } from "../../assets/validations";
import { utilObj } from "../../assets/utils";
import * as AWS from 'aws-sdk';

const stepfunctions = new AWS.StepFunctions();

const READYFORACTIVATION='ReadyForActivation';

class VehicleMicroservice {
    async dynamicCreateOrUpdate(Input: IVehicle){
        try {
            switch(Input?.documentStatus){
                case 'New':
                    if(!ValidationVehicleObj.checkValidationForInboundToNew(Input)){
                        throw 'Can move forward to move towards New'
                    }
                break;
                case 'ReadyForActivation':
                    if(!ValidationVehicleObj.checkValidationForNewToReadyForActivation(Input)){
                        throw 'Can move forward to move towards ReadyForActivation'
                    }
                break;
            }
            
            console.log("🚀 ~ file: index.ts:14 ~ consthandler:Handler= ~ Input:", Input);
            let response:IVehicle;
            const uniqueIdentifierCounterCollection = (getCollection('uniqueIdentifierCounter')) as unknown as mongo.Collection<UniqueIdentifier>;
            const collectionVehicle: Collection<Document> = getCollection("vehicles");
            const Vehicle: mongo.WithId<IVehicle> | null = (await collectionVehicle.findOne({plateNumber: Input.plateNumber})) as mongo.WithId<IVehicle> | null;
            const options: mongo.FindOneAndUpdateOptions={ returnDocument: 'before' }
            console.log("🚀 ~ file: index.ts:19 ~ consthandler:Handler= ~ Vehicle:", Vehicle)
            if(!Vehicle){
              if (!Input?.vehicle_id) {
                Input.vehicle_id = await generateVehicleId(Input.platformInfo, Input.vehicleType, Input.vehicleLocation, uniqueIdentifierCounterCollection)
            }
            const vehicleInsert = Input as any;
              await collectionVehicle.insertOne(vehicleInsert)
              response = Input
            }
            else{
              const returnedData : {value: UpdateResult}= (await collectionVehicle.findOneAndUpdate({plateNumber: Input?.plateNumber},{$set:{...Input,documentStatus:'Inbound'}},options)) as unknown as {value: UpdateResult};
              console.log("🚀 ~ file: index.ts:26 ~ consthandler:Handler= ~ returnedData:", returnedData);
              response = returnedData as unknown as IVehicle;
            }
            console.log("🚀 ~ file: index.ts:28 ~ consthandler:Handler= ~ response:", response);
            response = await setForNewExecutiontoSNS(response,'Inbound');
            return response;
          } catch (error: any) {
            await this.sendFailureTask(error,Input);
            throw error;
          }
    }

    private async sendFailureTask(error:any,vehicleData:IVehicle):Promise<void>{
        const TaskToken = await utilObj.getTokenFromStorageByVehicleId(vehicleData?.vehicle_id,'Token');
        console.log("🚀 ~ file: microservices.ts:62 ~ VehicleMicroservice ~ sendFailureTask ~ TaskToken:", TaskToken)
        const errorData = {
            taskToken: TaskToken, 
            error: '400', 
            cause: error, 
          };

          const data = await stepfunctions.sendTaskFailure(errorData).promise();
          console.log('TaskFailure sent:', data);
    }

}

export const VehicleMicroserviceObj = new VehicleMicroservice();