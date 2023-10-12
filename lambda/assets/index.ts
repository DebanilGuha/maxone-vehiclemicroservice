import * as mongo from "mongodb";
const { MongoClient } = mongo;
import Ajv from "ajv";
import { IVehicle } from "../../types/vehicle";
import { UniqueIdentifier } from "../../types/uniqueIdentifier";
const ajv = new Ajv({ allErrors: true });

type CollectionName = string;

function getDB() {
  const uri: string = process.env.MONGODBURL as string;
  const client = new MongoClient(uri);
  const db = client.db("vams");
  return db;
}
export function getCollection(collection: string): mongo.Collection<Document> {
  return getDB().collection(collection);
}

export async function validateSchema(type: CollectionName) {
  try {
    const schemaCollection = getCollection("schemas");
    const schema: any = await schemaCollection.findOne({
      collectionName: type,
    });
    const validate: any = ajv.compile(schema.jsonSchema);
    if (!validate) throw validate.errors;
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
}

export const generateVehicleId = async (
  platformInfo: string,
  vehicleType: string,
  location: string,
  uniqueIdentifierCounterCollection: mongo.Collection<UniqueIdentifier>,
) => {
  const locationMapCollection: any = await getCollection('locations');
  const vehicleTypeCollection: any = await getCollection('vehicleTypes');
  const locationCode = await locationMapCollection.findOne({
      location: { $eq: location },
  });
  const typeCode = await vehicleTypeCollection.findOne({
      type: { $eq: vehicleType },
  });
  const vehicleCode = [platformInfo, locationCode?.code, typeCode?.code];
  const inc = 1;
  const collection:any =(await uniqueIdentifierCounterCollection.findOneAndUpdate(
    { _id: 'vehicle_id' },
    {
      $inc: { count: inc },
    },
    { returnDocument: 'after' }
  )) as unknown ;
  console.log("🚀 ~ file: index.ts:59 ~ collection:", collection)
  const value = collection?.count;
  console.log("🚀 ~ file: index.ts:60 ~ value:", value);
  vehicleCode.push(value.toString().padStart(5, '0'));
  return vehicleCode.join('-');
};
export const generateChampionId = async (
  platformInfo: string,
  location: string,
  uniqueIdentifierCounterCollection: mongo.Collection<UniqueIdentifier>,
): Promise<string> => {
  const locationMapCollection: any = await getCollection('locations');
  const locationCode = await locationMapCollection.findOne({
      location: { $eq: location },
  });
 
  const vehicleCode = [platformInfo?.toUpperCase(), locationCode?.code, 'CH'];
  const inc = 1;
  const collection:any =(await uniqueIdentifierCounterCollection.findOneAndUpdate(
    { _id: 'champion_id' },
    {
      $inc: { count: inc },
    },
    { returnDocument: 'after' }
  )) as unknown ;
  console.log("🚀 ~ file: index.ts:59 ~ collection:", collection)
  const value = collection?.count;
  console.log("🚀 ~ file: index.ts:60 ~ value:", value);
  vehicleCode.push(value.toString().padStart(5, '0'));
  return vehicleCode.join('-');
};


export function setForNewExecutiontoSNS(body: IVehicle,status:string) {
  body.messageInfo = {
      documentStatus:  status,
      origin: 'vams2.0'
  };
  return body;
}