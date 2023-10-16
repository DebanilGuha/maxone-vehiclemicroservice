import { Handler } from "aws-lambda";
import { getCollection, generateVehicleId, validateSchema, setForNewExecutiontoSNS } from "../assets";
import { Collection, UpdateResult } from "mongodb";

import { IVehicle } from "../../types/vehicle";
import * as mongodb from "mongodb";


export const handler: Handler = async function (event: any) {
    try {
        let message: any = event;
        // message = JSON.parse(message);
        console.table(message);
        console.log(JSON.stringify(message, null, '\t'));
        if (message?.messageInfo?.origin !== 'lams2.0') {
            throw 'INFO : Origin invalid';
        }
        const contract: any = message;
        console.log("🚀 ~ file: index.ts:19 ~ contract:", contract)
        if (contract?.messageInfo?.documentStatus === 'ContractInitiated') {
            await updateActivation(contract);
        } else if (
            contract?.messageInfo?.documentStatus === 'ContractActivated' ||
            contract?.messageInfo?.documentStatus === 'V1ContractCreated'
        ) {
            await updateVehicle(contract);
        } else {
            throw `Invalid Document Status`;
        }
        return event;
    } catch (err) {
        console.error(err);
    }

    return true;
};

const updateVehicle = async (message: any) => {
    const vehicleCollection: any = await getCollection('vehicles');
    let findVehicle: any;

    try {
        findVehicle = await vehicleCollection.findOne({
            $and: [{ champion_id: { $eq: message?.champion_id } }, { vehicle_id: { $eq: message?.vehicle_id } }],
        });
        if (!findVehicle) {
            throw `Vehicle for this contract not found`;
        }
        if (findVehicle?.documentStatus !== 'PickUpComplete') {
            throw `Invalid Vehicle Status`;
        }
        const updatingVehicle: any = {
            contractStatus: 'ContractActivated',
        };
        if (message?.messageInfo?.documentStatus === 'V1ContractCreated') {
            updatingVehicle['v1_contract_id'] = message?.contract_id;
        }
        await vehicleCollection.updateOne(
            { vehicle_id: message?.vehicle_id },
            {
                $set: updatingVehicle,
            },
        );

        const updateVehicle: any = {
            ...findVehicle,
            messageInfo: {
                documentStatus: 'ContractActivated',
                origin: 'vams2.0',
            },
            lastUpdateTime: new Date().toISOString(),
            messageType: 'contract_info_updated',
        };
        
        console.log('End of updateVehicle in contractCreateOrUpdate');
    } catch (e: any) {
        console.error({ ErrorMessage: 'Could not complete find operation', Error: e });
    }
};

const updateActivation = async (message: any) => {
    const activationCollection: any = await getCollection("dummyactivation");
  let findActivation;
  try {
    findActivation = await activationCollection.findOne(
      {
        $and: [
          {
            $or: [
              { champion_id: { $eq: message?.champion_id } },
              { vehicle_id: { $eq: message?.vehicle_id } }
            ],
          },
          { documentStatus: { $eq: 'ReadyForPickUp' } }
        ]
      }
    );
  } catch (e) {
    throw "Could not complete find operation";
  }

  if (!findActivation) {
    throw "No activation record found";
  }
  const contractUpdate: any = {
    contractStatus: "ContractInitiated",
  };
  if(message?.contract_id){
    contractUpdate['contract_id'] = message?.contract_id;
  }
  if(message?.messageInfo?.documentStatus === 'PaymentReceived'){
    contractUpdate['paymentStatus'] = message?.paymentStatus;
    contractUpdate['paymentInfo'] = message?.paymentInfo;
  }
  console.warn("Contract to Update",contractUpdate);
    await activationCollection.updateOne({
      activation_id: findActivation?.activation_id,
      vehicle_id: message?.vehicle_id
    }, {
      $set: contractUpdate
    });
};