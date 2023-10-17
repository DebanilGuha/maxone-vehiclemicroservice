export interface Vehicle {
    vehicle_id: string;
    vehicleType: string;
    vehicleManufacturer: string;
    vehicleTrim: string;
    plateNumber: string;
    platformInfo: string;
    financierInfo: string;
    vehicleLocation: string;
    vehicleStatus: string;
    odometerReading: number;
    hpDays?: number;
    vehicleModel: string;
    mileage: number;
    helmetNumber?: number;
    pricingTemplate?: string;
    createdTime: string;
    lastUpdateTime: string;
    documentStatus?: string;
    contractLink?: string;
    serviceType: string;
    drivingLicense?: string;
    healthInsurance?: string;
    chassisNumber: string;
    engineNumber: string;
    vehicleColor?: string;
    OEM_vendorName: string;
    month: string;
    year: string;
    device_IMEI: string;
    recieverName: string;
    SIM_serialNo: string;
    VnubanNumber?: number;
    VIN?: string;
    ignitionNumber?: string;
    phoneNumber: string;
    Refurbished?: string;
    vehicleCity: string;
    vehicleCountry: string;
    lastMovementInfo?: Generic;
    messageType?: string;
    messageInfo?: Generic;
    _id?: string;
}

export interface Prospect {
    documentStatus: string;
    assignedVehicle_vehicle_id: string;
    assignedVehiclePlateNo: string;
    assignedVehicleTrim: string;
    assignedVehicleType: string;
    contractLink: string;
    createdTime: string;
    dateAdded: string;
    driverExperience: string;
    drivingLicence: string;
    financierInfo: string;
    guarantorAddress: string;
    guarantorName: string;
    guarantorPhoneNumber: string;
    healthInsurance: string;
    lastUpdateTime: string;
    platformInfo: string;
    prospectAddress: string;
    prospect_id: string;
    prospectLocation: string;
    prospectName: string;
    prospectPhoneNumber: string;
    vehicleOfInterest: string;
    vehicleOptions: string;
    assignedHelmetNumber: number;
    contractPage: string;
    contractStatus: string;
    drivingLicense: string;
    serviceType: string;
    contractor_id: string;
    pricingTemplate: string;
    hpDays: number;
    messageType: string;
}

export interface LocationData {
    _id?: string;
    location: string;
    code: string;
}

export interface Generic {
    [x: string]: any;
}
