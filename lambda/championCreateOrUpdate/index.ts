import { Handler } from "aws-lambda";
import { getCollection, generateVehicleId, validateSchema, setForNewExecutiontoSNS, restructureResponseForSNS } from "../assets";
import { Collection, UpdateResult } from "mongodb";

import { IVehicle } from "../../types/vehicle";
import * as mongodb from "mongodb";
const NEW = 'New'
export const handler: Handler = async (event: any) => {
    console.log("event 👉", event);
    delete event['_id'];
    let championMessage: any;
    try {
        championMessage = event;
    } catch (err) {
        console.error('Json is incorrect');
        return 'Json incorrect';
    }

    // const vehicleCollection: mongodb.Collection<mongodb.Document> = (await getCollection('vehicles')) as unknown as mongodb.Collection<mongodb.Document>;
    const championCollection: mongodb.Collection<mongodb.Document> = (await getCollection('dummychampion')) as unknown as mongodb.Collection<mongodb.Document>;
    const activationCollection: mongodb.Collection<mongodb.Document> = (await getCollection('dummyactivation')) as unknown as mongodb.Collection<mongodb.Document>;
    try {
        
        //Champion Update----------------------------------------------------------
        let findChampion: any;
        let findActivation: any;
        // championMessage[`documentStatus`] = championMessage?.documentStatus;
        const championSNSData = championMessage;
        console.log("🚀 ~ file: index.ts:35 ~ consthandler:Handler= ~ championSNSData:", championSNSData)
        // delete championSNSData['messageInfo'];
        findChampion = await championCollection.findOne({ champion_id: { $eq: championSNSData?.champion_id } });
        console.log("🚀 ~ file: index.ts:38 ~ consthandler:Handler= ~ findChampion:", findChampion)
        if (!findChampion) {
            await championCollection.insertOne(championSNSData);
        } else {
            await championCollection.updateOne(
                { champion_id: championSNSData?.champion_id },
                { $set: championSNSData },
            );
            console.warn(`Champion is updated`);

        }




        delete championMessage['messageInfo'];

        try {
            findActivation = await activationCollection.findOne({
                $and: [
                    { prospect_id: championMessage?.prospect_id },
                    { vehicle_id: championMessage?.vehicle_id },
                    { documentStatus: { $ne: 'ActivationCancelled' } },
                ],
            });
            if (!findActivation) {
                console.error('Champion is not associated with correct Activation');
                throw 'Champion is not associated with correct Activation and activation not found';
            }
        } catch (e) {
            throw 'Activation record with given Regenerate response prospect id and vehicle id is not found';
        }

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
        console.log("🚀 ~ file: index.ts:75 ~ consthandler:Handler= ~ activationUpdate:", activationUpdate)

        await activationCollection.updateOne(
            { activation_id: findActivation?.activation_id, vehicle_id: findActivation?.vehicle_id },
            {
                $set: {
                    ...activationUpdate,
                    lastUpdateTime: new Date().toISOString(),
                    documentStatus: 'ReadyForPickUp',
                },
            },
        );

        console.log('End of championCreateOrUpdate');
        return {contractInitiation:true,...restructureResponseForSNS(championSNSData,'ContractInitiation')};
    } catch (e: any) {
        console.error(e);
        return {contractInitiation:false,...e};

    }
    return 'Champion added';
};
