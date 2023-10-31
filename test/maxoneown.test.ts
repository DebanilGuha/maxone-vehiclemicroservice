import { MongoClient } from 'mongodb';
import {trigger} from '../lambda/receiveToken/triggermethods';
import * as dotenv from 'dotenv';
import { getCollection } from '../lambda/assets';
import { utilObj } from '../lambda/assets/utils';
dotenv.config(); // replace with the correct path to your code

describe('getTokenFromStorage', () => {
  let vehicleCollection: any;

  beforeAll(async () => {
    
    vehicleCollection = getCollection('vehicle');
    console.log("🚀 ~ file: maxoneown.test.ts:10 ~ beforeAll ~ getCollection:", getCollection)
  },3000);

  afterAll(async () => {
    await vehicleCollection.drop();
    await vehicleCollection.client.close();
  },3000);

  it('should return the token value when found in storage', async () => {
    

    const result = await utilObj.getTokenFromStorage('AGG474QM', 'token');
    
  },3000);

 
});

