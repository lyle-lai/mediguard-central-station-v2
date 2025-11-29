import { useCallback } from 'react';
import { PatientData, VitalStatus, SystemSettings } from '../types';
import { admitPatientApi, fetchAllPatientsApi, dischargePatientApi, updatePatientConfigApi } from '../services/apiService';
import { ToastType } from '../components/Toast';

export const usePatientLogic = (
    settings: SystemSettings,
    setPatients: React.Dispatch<React.SetStateAction<PatientData[]>>,
    setIsAddPatientModalOpen: (open: boolean) => void,
    addToast: (msg: string, type?: ToastType) => void
) => {

    const handleSaveNewPatient = useCallback(async (data: Partial<PatientData>) => {
        if (settings.isDemoMode) {
            const newPatient: any = {
                id: `demo_p_${Date.now()}`, deviceId: data.deviceId, bedNumber: data.bedNumber,
                department: data.department, deviceType: data.deviceType, connectedDevices: [data.deviceType],
                name: data.name, age: data.age, gender: data.gender, admissionId: data.admissionId,
                status: VitalStatus.NORMAL, parameters: [], waveforms: [], alarmDuration: 0
            };
            setPatients(prev => [...prev, newPatient]);
            addToast('患者入科成功 (模拟)', 'success');
        } else {
            try {
                await admitPatientApi(data);
                addToast('患者入科成功', 'success');
                const updated = await fetchAllPatientsApi();
                setPatients(updated);
            } catch (e) {
                addToast('入科失败', 'error');
            }
        }
        setIsAddPatientModalOpen(false);
    }, [settings.isDemoMode, setPatients, addToast, setIsAddPatientModalOpen]);

    const handleRemovePatient = useCallback(async (id: string) => {
        if (settings.isDemoMode) {
            setPatients(prev => prev.filter(p => p.id !== id));
            addToast('设备已移除', 'info');
        } else {
            try {
                await dischargePatientApi(id);
                setPatients(prev => prev.filter(p => p.id !== id));
                addToast('设备已成功移除', 'success');
            } catch (e) {
                addToast('移除失败', 'error');
            }
        }
    }, [settings.isDemoMode, setPatients, addToast]);

    const handleSaveBedConfig = useCallback(async (pid: string, cfg: any) => {
        if (settings.isDemoMode) {
            setPatients(prev => prev.map(p => p.id === pid ? { ...p, displaySettings: cfg } : p));
            addToast('配置已保存', 'success');
        } else {
            try {
                await updatePatientConfigApi(pid, cfg);
                setPatients(prev => prev.map(p => p.id === pid ? { ...p, displaySettings: cfg } : p));
                addToast('配置已同步', 'success');
            } catch (e) {
                addToast('保存失败', 'error');
            }
        }
    }, [settings.isDemoMode, setPatients, addToast]);

    return {
        handleSaveNewPatient,
        handleRemovePatient,
        handleSaveBedConfig
    };
};