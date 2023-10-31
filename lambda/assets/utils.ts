import * as mongodb from 'mongodb'
import { TokenStorage } from '../../types/uniqueIdentifier';
import { getCollection } from '.';

function numberToBase64String(number: number, desiredLength: number): string {
    // Convert the number to its Base64 representation
    const base64Str = btoa(number.toString());
  
    // Remove the padding '=' characters from the end
    const trimmedBase64Str = base64Str.replace(/=+$/, '');
  
    // Ensure the string is at least the desired length
    if (trimmedBase64Str.length >= desiredLength) {
      return trimmedBase64Str.slice(0, desiredLength);
    }
  
    // If the string is shorter, pad it with 'A's to reach the desired length
    const padding = 'A'.repeat(desiredLength - trimmedBase64Str.length);
    return trimmedBase64Str + padding;
  }

  export function encryptTimeTo4ElementString(): string {
    const currentDate = new Date();
    const hours = currentDate.getHours();
    const minutes = currentDate.getMinutes();
    const seconds = currentDate.getSeconds();
    const milliseconds = currentDate.getMilliseconds();
  
    const timeComponents = [hours, minutes, seconds, milliseconds];
  
    const timeComponentsStr = timeComponents.map((component) => {
        const encrypted = numberToBase64String(component,5);
      return encrypted.padStart(2, '0');
    });
  
    const encryptedString = timeComponentsStr.join('-');
  
    return encryptedString;
  }

  class Utils{

    vehicleCollection: mongodb.Collection<TokenStorage>;
    constructor() {
       this.initializeCollection();
    }
    private async initializeCollection(){
        this.vehicleCollection = (getCollection('vehicles')) as unknown as mongodb.Collection<TokenStorage>;
    }
    async  addTokenToStorage (platenumber:string,TaskToken:string,tokenname:string){
      if(TaskToken){
          const json : any={}
          json[tokenname] = TaskToken
          const change =  await this.vehicleCollection.updateOne({
              plateNumber:platenumber
          },{
              $set:json
          })
      }
  }
  
  async  getTokenFromStorage(platenumber:string,tokenname:string){
      const vehicle = (await this.vehicleCollection.findOne({ plateNumber:platenumber})) as  mongodb.WithId<TokenStorage>;
          console.log("🚀 ~ file: index.ts:31 ~ consthandler:Handler= ~ vehicle:", vehicle);
          return vehicle[tokenname];
  }
  async  getTokenFromStorageByVehicleId(vehicle_id:string,tokenname:string){
      const vehicle = (await this.vehicleCollection.findOne({ vehicle_id:vehicle_id})) as  mongodb.WithId<TokenStorage>;
          console.log("🚀 ~ file: index.ts:31 ~ consthandler:Handler= ~ vehicle:", vehicle);
          return vehicle[tokenname];
  }
  }
  
  export const utilObj = new Utils();