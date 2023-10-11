import { Vehicle } from './vehicle.model';

function convertToVehicleData(dataVehicle: any): Vehicle {
    try {
        const data: any = dataVehicle;

        const convertedData: Vehicle = {
            vehicle_id: String(data.vehicle_id || ''),
            vehicleType: String(data.vehicleType || ''),
            vehicleManufacturer: String(data.vehicleManufacturer || ''),
            vehicleTrim: String(data.vehicleTrim || ''),
            plateNumber: String(data.plateNumber || ''),
            platformInfo: String(data.platformInfo || ''),
            financierInfo: String(data.financierInfo || ''),
            vehicleLocation: String(data.vehicleLocation || ''),
            vehicleStatus: String(data.vehicleStatus || ''),
            odometerReading: typeof data.odometerReading === 'number' ? data.odometerReading : 0,
            hpDays: typeof data.hpDays === 'number' ? data.hpDays : undefined,
            vehicleModel: String(data.vehicleModel || ''),
            mileage: typeof data.mileage === 'number' ? data.mileage : 0,
            helmetNumber: typeof data.helmetNumber === 'number' ? data.helmetNumber : undefined,
            pricingTemplate: typeof data.pricingTemplate === 'string' ? data.pricingTemplate : undefined,
            createdTime: String(data.createdTime || ''),
            lastUpdateTime: String(data.lastUpdateTime || ''),
            documentStatus: String(data.documentStatus || ''),
            contractLink: typeof data.contractLink === 'string' ? data.contractLink : undefined,
            serviceType: String(data.serviceType || ''),
            drivingLicense: typeof data.drivingLicense === 'string' ? data.drivingLicense : undefined,
            healthInsurance: typeof data.healthInsurance === 'string' ? data.healthInsurance : undefined,
            chassisNumber: String(data.chassisNumber || ''),
            engineNumber: String(data.engineNumber || ''),
            vehicleColor: typeof data.vehicleColor === 'string' ? data.vehicleColor : undefined,
            OEM_vendorName: String(data.OEM_vendorName || ''),
            month: String(data.month || ''),
            year: String(data.year || ''),
            device_IMEI: String(data.device_IMEI || ''),
            recieverName: String(data.recieverName || ''),
            SIM_serialNo: String(data.SIM_serialNo || ''),
            VnubanNumber: typeof data.VnubanNumber === 'number' ? parseInt(data.VnubanNumber) : undefined,
            VIN: typeof data.VIN === 'string' ? data.VIN : undefined,
            ignitionNumber: typeof data.ignitionNumber === 'string' ? data.ignitionNumber : undefined,
            phoneNumber: String(data.phoneNumber || ''),
            Refurbished: typeof data.Refurbished === 'string' ? data.Refurbished : undefined,
            vehicleCity: String(data.vehicleCity || ''),
            vehicleCountry: String(data.vehicleCountry || ''),
        };

        return convertedData;
    } catch (error) {
        console.error('Failed to parse JSON message:', error);
        return {} as Vehicle;
    }
}

export { convertToVehicleData };
