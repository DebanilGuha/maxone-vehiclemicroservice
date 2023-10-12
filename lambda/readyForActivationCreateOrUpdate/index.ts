import { Handler } from "aws-lambda";
import { getCollection, generateVehicleId, validateSchema, setForNewExecutiontoSNS } from "../assets";
import { Collection, UpdateResult } from "mongodb";

import { IVehicle } from "../../types/vehicle";
import * as mongo from "mongodb";
const READYFORACTIVATION='ReadyForActivation'
export const handler: Handler = async (event: any) => {
  try {
    console.log("event 👉", event);
    delete event['_id'];
    let response:IVehicle;
    
    const collectionVehicle: Collection<Document> = getCollection("vehicles");
    const Vehicle: mongo.WithId<IVehicle> | null = (await collectionVehicle.findOne({vehicle_id: event.vehicle_id})) as mongo.WithId<IVehicle> | null;
    console.log("🚀 ~ file: index.ts:17 ~ consthandler:Handler= ~ Vehicle:", JSON.stringify(Vehicle,null,'\t'));
    const options: mongo.FindOneAndUpdateOptions={ returnDocument: 'after' }
    if(!Vehicle){
      await collectionVehicle.insertOne(event)
      console.log("🚀 ~ file: index.ts:23 ~ consthandler:Handler= ~ added inserted event:", event)
      response = event
    }
    else{
      const returnedData : {value: UpdateResult}= (await collectionVehicle.findOneAndUpdate({vehicle_id: event.vehicle_id},{$set:{...event,documentStatus:READYFORACTIVATION}},options)) as unknown as {value: UpdateResult};
      console.log("🚀 ~ file: index.ts:23 ~ consthandler:Handler= ~ returnedData:", returnedData)
      response = returnedData as unknown as IVehicle;
    }
    response = setForNewExecutiontoSNS(response,READYFORACTIVATION);
    console.log("🚀 ~ file: index.ts:26 ~ consthandler:Handler= ~ response:", response)
    return response;
  } catch (error: any) {
    console.error(error);
    return {
      body: JSON.stringify({ message: error }),
      statusCode: 500,
    };
  }
};
