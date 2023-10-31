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
        console.log("🚀 ~ file: index.ts:18 ~ consthandler:Handler= ~ TaskToken:", TaskToken)
        if(TaskToken){
            await addTokenToStorage(Input?.vehicle_id,TaskToken,'tokenactivation');
        }
        if(!Input){
            const dummyactivation = (getCollection('dummyactivation'))  as unknown as mongo.Collection<Document>;
            const insertData = await dummyactivation.insertOne({...body});
            const token = !TaskToken ? await getTokenFromStorage(body?.vehicle_id,'tokenactivation') : TaskToken;
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


 async function addTokenToStorage (vehicle_id:string,TaskToken:string,tokenname:string){
    const vehicleCollection = (getCollection('vehicles')) ;
        const json : any={}
        json[tokenname] = TaskToken
        await vehicleCollection.updateOne({
            vehicle_id:vehicle_id
        },{
            $set:json
        })
}

async function getTokenFromStorage(vehicle_id:string,tokenname:string){
    const vehicleCollection = (getCollection('vehicles')) ;
    const vehicle = (await vehicleCollection.findOne({ vehicle_id:vehicle_id})) as any;
        console.log("🚀 ~ file: index.ts:31 ~ consthandler:Handler= ~ vehicle:", vehicle);
        if(!vehicle){
            throw 'Vehicle is not present';
        }
        return vehicle[tokenname];
}