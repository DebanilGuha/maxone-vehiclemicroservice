import { IVehicle } from "../types/vehicle";

class ValidationVehicle {
    checkValidationForInboundToNew(body: IVehicle) {
        console.log("body?.serviceType:", !!body?.serviceType)
        if (!body?.serviceType) {
            console.log("body?.serviceType  Entered:", !!body?.serviceType)
            return false;
        }
        console.log(" body?.financierInfo Outside:", !!body?.financierInfo);

        if (!body?.financierInfo) {
            console.log(" body?.financierInfo  Entered:", !!body?.financierInfo);
            return false;
        }
        console.log("body?.platformInfo Outside:", !!body?.platformInfo);

        if (!body?.platformInfo) {
            console.log("body?.platformInfo  Entered:", !!body?.platformInfo);
            return false;
        }
        console.log("body?.device_IMEI Outside:", !!body?.device_IMEI)

        if (!body?.device_IMEI) {
            console.log("body?.device_IMEI  Entered:", !!body?.device_IMEI)
            return false;
        }
        console.log("body?.SIM_serialNo Outside:", !!body?.SIM_serialNo);
        if (!body?.SIM_serialNo) {
            console.log("body?.SIM_serialNo  Entered:", !!body?.SIM_serialNo);
            return false;
        }
        console.log("body?.phoneNumber Outside:", !!body?.phoneNumber);
        if (!body?.phoneNumber) {
            console.log("body?.phoneNumber  Entered:", !!body?.phoneNumber);
            return false;
        }
        
        return true;
    }

    checkValidationForNewToReadyForActivation(body: IVehicle) {
        if (!body?.pricingTemplate) {
            console.log("body?.pricingTemplate:", !!body?.pricingTemplate);
            return false;
        }
        return true;
    }

}

export const ValidationVehicleObj = new ValidationVehicle();