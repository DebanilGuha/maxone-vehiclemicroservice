import { Handler } from "aws-lambda";
import { getCollection, generateVehicleId, validateSchema, setForNewExecutiontoSNS } from "../assets";
import { Collection, UpdateResult } from "mongodb";

import { IVehicle } from "../../types/vehicle";
import * as mongodb from "mongodb";
const NEW='New'
export const handler: Handler = async (event: any) => {
  console.log("event 👉", event);
    delete event['_id'];
    let response:any;
    let championMessage: any;
  try {
      championMessage = response;
  } catch (err) {
      console.error('Json is incorrect');
      return 'Json incorrect';
  }
  
  // const vehicleCollection: mongodb.Collection<mongodb.Document> = (await getCollection('vehicles')) as unknown as mongodb.Collection<mongodb.Document>;
  const championCollection: mongodb.Collection<mongodb.Document> = (await getCollection('dummychampion'))as unknown as mongodb.Collection<mongodb.Document>;
  // const activationCollection: mongodb.Collection<mongodb.Document> = (await getCollection('dummyactivation'))as unknown as mongodb.Collection<mongodb.Document>;
  try {
      /**
       * Origin of Data should be from Champion Service
       */
      // if (championMessage?.messageInfo?.origin !== 'cs') {
      //     throw 'INFO : Origin invalid';
      // }
      //Champion Update----------------------------------------------------------
      let findChampion: any;
      championMessage[`documentStatus`] = championMessage?.messageInfo?.documentStatus;
      const championSNSData = championMessage;
      delete championSNSData['messageInfo'];
      try {
          findChampion = await championCollection.findOne({ champion_id: { $eq: championSNSData?.champion_id } });
          if (!findChampion) {
              await championCollection.insertOne(championSNSData);
          } else {
              await championCollection.updateOne(
                  { champion_id: championSNSData?.champion_id },
                  { $set: championSNSData },
              );
              console.warn(`Champion is updated`);
              
          }
      } catch (e) {
          console.error(e);
          throw `Activation record with given Champion id ${championMessage?.champion_id} is not found`;
      }
     

      
      delete championMessage['messageInfo'];

      

      /**
       * Changing Activation To ReadyForPickUp
       */
      const activationUpdate: Record<string, unknown> = {
          champion_id: championMessage?.champion_id,
          champion_uuid_id: championMessage?.champion_uuid_id,
          championName: championMessage?.championName,
          championPhoneNumber: championMessage?.championPhoneNumber,
          championEmailId: championMessage?.championEmailId,
      };

      // await activationCollection.updateOne(
      //     { activation_id: findActivation?.activation_id, vehicle_id: findActivation?.vehicle_id },
      //     {
      //         $set: {
      //             ...activationUpdate,
      //             lastUpdateTime: new Date().toISOString(),
      //             documentStatus: 'ReadyForPickUp',
      //         },
      //     },
      // );
      
      console.log('End of championCreateOrUpdate');
  } catch (e: any) {
      console.error(e);
      return e;
  }
  return 'Champion added';
};
