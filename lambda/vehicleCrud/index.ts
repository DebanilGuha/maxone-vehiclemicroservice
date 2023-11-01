import { Handler } from "aws-lambda";
import { getCollection, generateVehicleId, validateSchema, setForNewExecutiontoSNS } from "../../assets";
import { Collection, UpdateResult } from "mongodb";

import { IVehicle } from "../../types/vehicle";
import * as mongo from "mongodb";
import { UniqueIdentifier } from "../../types/uniqueIdentifier";
import { VehicleMicroserviceObj } from "./microservices";

export const handler: Handler = async (event: any) => {
  try{
    const {
      Execution: { Input },
    } = event;
    console.log("🚀 ~ file: index.ts:15 ~ consthandler:Handler= ~ event:", event)
  
      return await VehicleMicroserviceObj.dynamicCreateOrUpdate(Input);
    
    

  }catch(error){
    return {
      body: JSON.stringify({ message: error }),
      statusCode: 500,
    };
  }
  
  
};
