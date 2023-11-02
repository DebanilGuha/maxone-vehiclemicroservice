import { Handler } from "aws-lambda";
import { IVehicle } from "../../types/vehicle";
import * as mongo from "mongodb";
import { UniqueIdentifier } from "../../types/uniqueIdentifier";
import { utilObj } from "../../assets/utils";


export const handler: Handler = async (event: any) => {
  console.log("🚀 ~ file: index.ts:15 ~ consthandler:Handler= ~ event:", event);
  try {
    const {
      Records: [{ Sns }],
    } = event;
    const snsData = JSON.parse(Sns.Message);
    const {Input,TaskToken} = snsData;
    
      await utilObj.addTokenToStorage(Input?.plateNumber,TaskToken,`Token`);
    
    return {
      body: JSON.stringify(Input),
      statusCode: 200,
    }

  } catch (error) {
    console.error(error);
    return {
      body: JSON.stringify({ message: error }),
      statusCode: 500,
    };
  }


};