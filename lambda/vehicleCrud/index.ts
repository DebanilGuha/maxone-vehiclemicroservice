import { Handler } from "aws-lambda";
import { getCollection, generateVehicleId, validateSchema, setForNewExecutiontoSNS } from "../../assets";
import { Collection, UpdateResult } from "mongodb";

import { IVehicle } from "../../types/vehicle";
import * as mongo from "mongodb";
import { UniqueIdentifier } from "../../types/uniqueIdentifier";
import { VehicleMicroserviceObj } from "./microservices";
import { utilObj } from "../../assets/utils";

export const handler: Handler = async (event: any) => {
  console.log("🚀 ~ file: index.ts:15 ~ consthandler:Handler= ~ event:", event);
  let tosenddata = {} as IVehicle;
  let token = '' as string;
  if(event?.Execution?.Input){
    const {Execution: { Input }} = event;
    tosenddata = Input;
  }else{
    tosenddata = event;
  }
  try{
      return await VehicleMicroserviceObj.dynamicCreateOrUpdate(tosenddata);
  }catch(error){
    console.error(error);
    return {
      statusCode:500,
      body: JSON.stringify(error)
    }
  }
  
  
};
