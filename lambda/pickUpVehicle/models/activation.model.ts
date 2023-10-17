import { Generic } from './vehicle.model';

export interface Activation {
    activation_id: string;
    champion_id: string;
    champion_uuid_id: string;
    contractPage: string;
    contractStatus: string;
    documentStatus?: string;
    drivingLicense: string;
    financierInfo: string;
    healthInsurance: string;
    helmetNumber: number;
    lastUpdateTime: string;
    nameOfFleetOfficer: string;
    parent_activation_id: null;
    platformInfo: string;
    prospect_id: string;
    serviceType: string;
    vehicleOptions: string;
    vehicle_id: string;
    prospectLocation: string;
    vehicleLocation: string;
    contractPic: string;
    contract_id?: string;
    championName?: string;
    championEmailId?: string;
    championPhoneNumber?: string;
    _id?: Generic;
}

export interface Champion {
    _id: Generic;
    champion_uuid_id: string;
    champion_id: string;
    championName: string;
    championPhoneNumber: string;
    prospect_id: string;
    vehicle_id: string;
    championType: 'Graduate' | 'Regular' | null;
    championEmailId: string;
    lastUpdateTime: Date;
    documentStatus: string;
}
