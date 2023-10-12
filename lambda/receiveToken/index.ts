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
    let message: IVehicle = JSON.parse(Sns.Message);
    if(Input && Object.keys(Input).length > 0){
      message=Input;
    }
    console.log("🚀 ~ file: index.ts:18 ~ consthandler:Handler= ~ message:", message)
    const stateMachineArn = process.env.STATE_MACHINE_ARN;
    console.log(`ForSwitch -->`,message?.messageInfo?.origin);
    switch(message?.messageInfo?.origin){
      case 'vams2.0':
        console.log(`Entered Vams2.0`);
        const validate = await validateSchema('vehicles');
        if(!validate){
          throw 'Vehicles are not perfect schema';
        }
        message[`documentStatus`] = message?.messageInfo?.documentStatus || '';
        delete message['messageInfo'];
        if(Input?.documentStatus === 'New'){
        console.log(`Entered New`);
          await trigger.stateMachineForwardForNew(message,TaskToken)
        }
        if(Input?.documentStatus === 'Inbound'){
        console.log(`Entered Inbound`);
          await trigger.stateMachineForwardForInbound(message,TaskToken)
        }
        if(Input?.documentStatus === 'ReadyForActivation'){
        console.log(`Entered ReadyForActivation`);
          await trigger.stateMachineForwardForReadyForActivation(message,TaskToken)
        }
        if(Input?.documentStatus === 'Activation'){
        console.log(`Entered Activation`);
          await trigger.stateMachineForwardForActivation(message,TaskToken)
        }
        break;
      case 'vams1.0':
        if(message.messageInfo) message.messageInfo.origin = "vams2.0";
        await stepfunctions.startExecution({
          stateMachineArn: stateMachineArn!,
          input: JSON.stringify(message),
        }).promise()
        break;
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
