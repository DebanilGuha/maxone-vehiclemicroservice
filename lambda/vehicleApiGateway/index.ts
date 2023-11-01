import { APIGatewayProxyResult, Handler } from "aws-lambda";
import { getCollection, generateVehicleId, validateSchema, setForNewExecutiontoSNS } from "../../assets";
import { Collection, UpdateResult } from "mongodb";

import { IVehicle } from "../../types/vehicle";
import * as mongo from "mongodb";
import { UniqueIdentifier } from "../../types/uniqueIdentifier";
import { utilObj } from "../../assets/utils";
import * as AWS from 'aws-sdk';
import { TaskToken } from "aws-sdk/clients/stepfunctions";


const stepfunctions = new AWS.StepFunctions();

export const handler: Handler = async (event: any) => {
  console.log("🚀 ~ file: index.ts:15 ~ consthandler:Handler= ~ event:", event);
  try{
    const body = JSON.parse(event?.body || '{}') as IVehicle;
    console.log("🚀 ~ file: index.ts:19 ~ consthandler:Handler= ~ body:", body)
    let response = {} as APIGatewayProxyResult;
    const stateMachineArn = process.env.STATE_MACHINE_ARN as string;
    console.log("🚀 ~ file: index.ts:22 ~ consthandler:Handler= ~ body?.documentStatus:", body?.documentStatus);

    if((body?.documentStatus)?.trim() === 'Inbound'){
      const stepfunctionExecution = await stepfunctions.startExecution(
        {
          stateMachineArn: stateMachineArn!, 
          input: JSON.stringify(body),   
        }
      ).promise();
      response = {
        statusCode:200,
        body:JSON.stringify(stepfunctionExecution)
      }
    }else{
      const TaskToken = (await utilObj.getTokenFromStorage(body?.plateNumber,`Token`)) as unknown as string;
      console.log("🚀 ~ file: index.ts:38 ~ consthandler:Handler= ~ TaskToken:", TaskToken)
      const taskInput: AWS.StepFunctions.SendTaskSuccessInput = {
        output: JSON.stringify(body),
        taskToken: TaskToken
      };
      await stepfunctions.sendTaskSuccess(taskInput).promise();
    }
    
    return response;

  }catch(error){
    console.error(error);
    return {
      body: JSON.stringify({ message: error }),
      statusCode: 500,
    };
  }
  
  
};