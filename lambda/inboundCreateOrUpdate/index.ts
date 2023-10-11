import { Handler } from "aws-lambda";
import { getCollection, generateVehicleId, validateSchema, setForNewExecutiontoSNS } from "../assets";
import { Collection, UpdateResult } from "mongodb";

import { IVehicle } from "../../types/vehicle";
import * as mongo from "mongodb";

export const handler: Handler = async (event: any) => {
  try {
    console.log("event 👉", event);
    const {
      Execution: { Input },
    } = event;
    let response:IVehicle;
    
    const collectionVehicle: Collection<Document> = getCollection("vehicles");
    const Vehicle: mongo.WithId<IVehicle> | null = (await collectionVehicle.findOne({vehicle_id: Input.vehicle_id})) as mongo.WithId<IVehicle> | null;
    const options: mongo.FindOneAndUpdateOptions={ returnDocument: 'before' }
    console.log("🚀 ~ file: index.ts:19 ~ consthandler:Handler= ~ Vehicle:", Vehicle)
    if(!Vehicle){
      await collectionVehicle.insertOne(Input)
      response = Input
    }
    else{
      const returnedData : {value: UpdateResult}= (await collectionVehicle.findOneAndUpdate({vehicle_id: Input.vehicle_id},{$set:{...Input,documentStatus:'Inbound'}},options)) as unknown as {value: UpdateResult};
      console.log("🚀 ~ file: index.ts:26 ~ consthandler:Handler= ~ returnedData:", returnedData)
      response = returnedData as unknown as IVehicle;
    }
    console.log("🚀 ~ file: index.ts:28 ~ consthandler:Handler= ~ response:", response)
    response = await setForNewExecutiontoSNS(response,'Inbound');
    return response;
  } catch (error: any) {
    return {
      body: JSON.stringify({ message: Error }),
      statusCode: 500,
    };
  }
};
