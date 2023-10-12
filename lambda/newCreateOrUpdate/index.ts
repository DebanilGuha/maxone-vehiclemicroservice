import { Handler } from "aws-lambda";
import { getCollection, generateVehicleId, validateSchema, setForNewExecutiontoSNS } from "../assets";
import { Collection, UpdateResult } from "mongodb";

import { IVehicle } from "../../types/vehicle";
import * as mongo from "mongodb";
const NEW='New'
export const handler: Handler = async (event: any) => {
  try {
    console.log("event 👉", event);
    delete event['_id'];
    let response:IVehicle;
    
    const collectionVehicle: Collection<Document> = getCollection("vehicles");
    const Vehicle: mongo.WithId<IVehicle> | null = (await collectionVehicle.findOne({vehicle_id: event.vehicle_id})) as mongo.WithId<IVehicle> | null;
    const options: mongo.FindOneAndUpdateOptions={ returnDocument: 'after' }
    
    if(Vehicle){
      const returnedData : {value: UpdateResult}= (await collectionVehicle.findOneAndUpdate({vehicle_id: event.vehicle_id},{$set:{...event,documentStatus:NEW}},options)) as unknown as {value: UpdateResult};
      response = returnedData as unknown as IVehicle;
    }
    else{
      await collectionVehicle.insertOne(event);
      response = event
    }

    
    response = setForNewExecutiontoSNS(response,NEW);
    return response;
  } catch (error: any) {
    console.error("Error",error);
    return {
      body: JSON.stringify({ message: error }),
      statusCode: 500,
    };
  }
};
