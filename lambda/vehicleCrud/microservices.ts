import { getCollection, generateVehicleId, validateSchema, setForNewExecutiontoSNS } from "../../assets";
import { Collection, UpdateResult } from "mongodb";

import { IVehicle } from "../../types/vehicle";
import * as mongo from "mongodb";
import { UniqueIdentifier } from "../../types/uniqueIdentifier";
import { ValidationVehicleObj } from "../../assets/validations";
import { utilObj } from "../../assets/utils";



const READYFORACTIVATION='ReadyForActivation';

class VehicleMicroservice {
    async dynamicCreateOrUpdate(Input: IVehicle,token?:string){
        console.log("🚀 ~ file: microservices.ts:15 ~ VehicleMicroservice ~ dynamicCreateOrUpdate ~ Input:", Input)
        try {
          switch(Input?.documentStatus){
            case 'New':
                if(!ValidationVehicleObj.checkValidationForInboundToNew(Input)){
                    console.error('Validation issue ! Cannot move forward towards New');
                    Input['isError']= "YES";
                    return Input;
                }
                Input['isError'] = "NO";
            break;
            case 'ReadyForActivation':
                if(!ValidationVehicleObj.checkValidationForNewToReadyForActivation(Input)){
                  console.error('Validation issue ! Cannot move forward towards ReadyForActivation');
                  Input['isError']= "YES";
                  return Input;
                }
                Input['isError'] = "NO";
            break;
            default:
              Input['isError'] = "NO";
              break;
        }
            
            let response:IVehicle;
            const uniqueIdentifierCounterCollection = (getCollection('uniqueIdentifierCounter')) as unknown as mongo.Collection<UniqueIdentifier>;
            const collectionVehicle: Collection<IVehicle> = getCollection("vehicles") as unknown as Collection<IVehicle>;
            const Vehicle: mongo.WithId<IVehicle> | null = (await collectionVehicle.findOne({plateNumber: Input.plateNumber})) as mongo.WithId<IVehicle> | null;
            const options: mongo.FindOneAndUpdateOptions={ returnDocument: 'after' }
            console.log("🚀 ~ file: index.ts:19 ~ consthandler:Handler= ~ Vehicle:", Vehicle)
            if(!Vehicle){
              if (!Input?.vehicle_id) {
                Input.vehicle_id = await generateVehicleId(Input.platformInfo, Input.vehicleType, Input.vehicleLocation, uniqueIdentifierCounterCollection)
            }
            const vehicleInsert: mongo.OptionalId<IVehicle> = Input as unknown as  mongo.OptionalId<IVehicle>;
              await collectionVehicle.insertOne(vehicleInsert);
              response = Input
            }
            else{
              const returnedData : {value: UpdateResult}= (await collectionVehicle.findOneAndUpdate({plateNumber: Input?.plateNumber},{$set:{...Input,documentStatus:Input?.documentStatus}},options)) as unknown as {value: UpdateResult};
              console.log("🚀 ~ file: index.ts:26 ~ consthandler:Handler= ~ returnedData:", returnedData);
              response = returnedData as unknown as IVehicle;
            }
            
            console.log("🚀 ~ file: index.ts:55 ~ consthandler:Handler= ~ response:", response, 'Input ',Input);
            delete response['_id'];
            return response;
          } catch (error: any) {
            console.error(error);
            throw error;
          }
    }


}

export const VehicleMicroserviceObj = new VehicleMicroservice();