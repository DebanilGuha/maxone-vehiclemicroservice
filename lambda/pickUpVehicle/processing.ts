import { Activation, Champion } from './models/activation.model';
import { Generic, Prospect, Vehicle } from './models/vehicle.model';

function checkGraduateAndNormalData(
    vehicleData: Vehicle,
    prospectData: Prospect | null,
    championData: Champion,
    activationData: Activation,
    paymentToDo: string,
    checkMaintainenceStatus: boolean,
) {
    // if (!!!prospectData || championData?.championType === 'Graduate') {
    //     console.warn({
    //         vehicleCondition: vehicleData?.documentStatus === 'ReadyForPickUp',
    //         championCondition: championData?.documentStatus === 'ReadyForPickUp',
    //         contractCondition: activationData?.contractStatus === 'ContractInitiated',
    //         paymentCondition: paymentToDo === 'Complete',
    //         maintenanceCondition: checkMaintainenceStatus,
    //         result: 'Graduate Champion',
    //     });
    //     if (
    //         vehicleData?.documentStatus === 'ReadyForPickUp' &&
    //         championData?.documentStatus === 'ReadyForPickUp' &&
    //         activationData?.contractStatus === 'ContractInitiated' &&
    //         paymentToDo === 'Complete' &&
    //         checkMaintainenceStatus
    //     ) {
    //         return true;
    //     }
    // } else {
        console.warn({
            vehicleCondition: vehicleData?.documentStatus === 'ReadyForPickUp',
            prospectCondition: prospectData?.documentStatus === 'ActivatedButNotCheckedOut',
            contractCondition: activationData?.contractStatus === 'ContractInitiated',
            paymentCondition: paymentToDo === 'Complete',
            maintenanceCondition: checkMaintainenceStatus,
        });
        if (
            vehicleData?.documentStatus === 'ReadyForPickUp' &&
            prospectData?.documentStatus === 'ActivatedButNotCheckedOut' &&
            activationData?.contractStatus === 'ContractInitiated' &&
            paymentToDo === 'Complete' &&
            checkMaintainenceStatus
        ) {
            return true;
        } else {
            return false;
        }
    // }
}

export { checkGraduateAndNormalData };
