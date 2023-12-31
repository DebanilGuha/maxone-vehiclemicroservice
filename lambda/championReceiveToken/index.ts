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
    let message: any = JSON.parse(Sns.Message);
    await trigger.stateMachineForwardForChampion(message) 
    callback(null,{status:'CompletedTask'});
    return event;
  } catch (error: any) {
    console.error(error);
    return {
      body: JSON.stringify({ message: error }),
      statusCode: 500,
    };
  }
};
