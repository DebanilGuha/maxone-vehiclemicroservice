import { Callback, Context, Handler } from "aws-lambda";
import { getCollection, generateVehicleId, validateSchema } from "../assets";
import { Collection } from "mongodb";
import * as AWS from 'aws-sdk';
import {trigger} from "./triggermethods";
import { IVehicle } from "../../types/vehicle";

const stepfunctions = new AWS.StepFunctions();

export const handler: Handler = async (event: any,context: Context, callback: Callback) => {
  try {
    console.log("event 👉", event);
    const {Records: [{Sns}]} = event;
    console.log("SNS",Sns);
    const {Input, TaskToken} = JSON.parse(Sns.Message);
    let message: any = JSON.parse(Sns.Message);

    if(message?.championGeneration == true){
      
    }
    console.log("🚀 ~ file: index.ts:14 ~ consthandler:Handler= ~ TaskToken:", TaskToken)
    
    
    callback(null,{status:'CompletedTask'});
    return event;
  } catch (error: any) {
    console.error(error);
    return {
      body: JSON.stringify({ message: Error }),
      statusCode: 500,
    };
  }
};
