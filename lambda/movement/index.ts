
import { Handler } from "aws-lambda";
import { getCollection, generateVehicleId, validateSchema, setForNewExecutiontoSNS } from "../assets";
import { Collection, UpdateResult } from "mongodb";

import { IVehicle } from "../../types/vehicle";
import * as mongodb from "mongodb";
import { MOVEMENT_TYPES } from "./constant";


export const handler: Handler = async (event: any) => {
    const checkArray: any = MOVEMENT_TYPES;
    const movementCollection: any = await getCollection('movements');
    const uniqueIdentifierCounterCollection: any = await getCollection('uniqueIdentifierCounter');
    const movementDocuments: any[] = await movementCollection
        .find({ documentStatus: { $in: checkArray } })
        .sort({ lastUpdateTime: 1 })
        .toArray();
    console.warn('Number of movement documents', movementDocuments?.length);
    const processMovementDocuments: any[] = [];
    for (const document of movementDocuments) {
        try {
            const inc: any = 1;
            const collection: any = await uniqueIdentifierCounterCollection.findOneAndUpdate(
                { _id: 'movement_id' },
                {
                    $inc: { count: inc },
                },
                { returnDocument: 'after' },
            );
            const incrementedValue: any = collection?.value?.count;
            await movementCollection.updateOne(
                {
                    _id: new mongodb.ObjectId(document?._id),
                },
                {
                    $set: {
                        lastUpdateTime: new Date().toISOString(),
                        movement_id: incrementedValue,
                    },
                },
            );
            document.movement_id = incrementedValue;
            processMovementDocuments.push(document);
        } catch (err: any) {
            console.error('Could not process document', document);
            console.error('Session Aborted :', err);
        }
    }
    console.table(processMovementDocuments);
    return { allDocument: { array: [...processMovementDocuments] } };
};