import { APIGatewayProxyResult, Handler } from "aws-lambda";
import { getCollection, generateVehicleId, validateSchema, setForNewExecutiontoSNS } from "../assets";
import { Collection, UpdateResult } from "mongodb";

import { IVehicle } from "../../types/vehicle";
import * as mongo from "mongodb";
import { TokenStorage, UniqueIdentifier } from "../../types/uniqueIdentifier";
import * as AWS from 'aws-sdk';
const stepfunctions = new AWS.StepFunctions();

export const handler: Handler = async (event: any): Promise<APIGatewayProxyResult> => {
    let response: APIGatewayProxyResult = {} as APIGatewayProxyResult;
    try{
        console.log(event);
        const body = JSON.parse(event.body);
        console.log("🚀 ~ file: index.ts:13 ~ consthandler:Handler= ~ body:", body)
        const {Input, TaskToken} = body;
        console.log("🚀 ~ file: index.ts:15 ~ consthandler:Handler= ~ Input:", Input)
        const  tokenCollection = (await getCollection('tokenstorage')) as unknown as mongo.Collection<TokenStorage>;
        if(TaskToken){
            const change =  await tokenCollection.updateOne({
                _id:'activation'
            },{
                $set:{token: TaskToken}
            })
        }
        if(!Input){
            const dummyactivation = (await getCollection('dummyactivation'))  as unknown as mongo.Collection<Document>;
            const insertData = await dummyactivation.insertOne({...body});
            console.log("🚀 ~ file: index.ts:29 ~ consthandler:Handler= ~ insertData:", insertData)
            const { token } = (await tokenCollection.findOne({_id:'activation'})) as  mongo.WithId<TokenStorage>;
            console.log("🚀 ~ file: index.ts:31 ~ consthandler:Handler= ~ token:", token)
            if(insertData?.acknowledged){
                await stepfunctions.sendTaskSuccess({
                    output: JSON.stringify({movementExecution: true}),
                    taskToken: token
                }).promise();
            }
            response =  {
                statusCode:200,
                body:JSON.stringify(insertData)
            }
        }
        return response;
    }
    catch(err:any){
        console.error(err);
        return err;
    }
    
    
};