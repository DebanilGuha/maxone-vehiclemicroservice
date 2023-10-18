export interface IVehicle {
    vehicle_id: string;
    plateNumber: string;
    device_IMEI: string;
    financierInfo: string;
    lastUpdateTime: Date;
    createdTime: Date;
    mileage: number;
    month: string;
    documentStatus?: string;
    odometerReading: number;
    vehicle_uuid_id: string;
    contract_uuid_id: string;
    v1_contract_id: string;
    chassisNumber: string;
    v1_status: string;
    vehicleCity: string;
    vehicleCountry: string;
    OEM_vendorName: string;
    date_of_vehicle_delivery: string;
    engineNumber: string;
    ignitionNumber: string;
    license_expiration_date: string;
    recieverName: string;
    vehicleColor: string;
    SIM_serialNo: string;
    phoneNumber: string;
    platformInfo: string;
    vehicleLocation: string;
    vehicleManufacturer: string;
    vehicleModel: string;
    vehicleTrim: string;
    vehicleType: string;
    year: string;
    vehicleStatus: string;
    messageInfo?: MessageInfo;
    messageType: string;
    prospect_id?:string;
    pricingTemplate: string;
    serviceType: string;
}

export interface MessageInfo {
    documentStatus: string;
    origin: string;
}
