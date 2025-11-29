import { useCallback } from 'react';
import { SystemSettings, Department, DepartmentPreferences, DeviceType, WaveformConfig, ParameterConfig, AlarmThresholdItem, User, DeviceTypeDesc } from '../types';
import { updateDepartmentPreferencesApi, updateDepartmentCapacity, updateDeviceWaveformsApi, updateDeviceParametersApi, updateDepartmentAlarms } from '../services/apiService';
import { ToastType } from '../components/Toast';

export const useSettingsLogic = (
    settings: SystemSettings,
    setSettings: React.Dispatch<React.SetStateAction<SystemSettings>>,
    selectedDepartment: Department,
    currentUser: User | null,
    addToast: (msg: string, type?: ToastType) => void
) => {

    const handleSavePreferences = useCallback(async (newPrefs: Partial<DepartmentPreferences>) => {
        setSettings(prev => ({ ...prev, ...newPrefs }));

        const fullPrefs: DepartmentPreferences = {
            isDemoMode: newPrefs.isDemoMode ?? settings.isDemoMode,
            simulationSpeed: newPrefs.simulationSpeed ?? settings.simulationSpeed,
            nightMode: newPrefs.nightMode ?? settings.nightMode,
            audioEnabled: newPrefs.audioEnabled ?? settings.audioEnabled
        };

        if (currentUser) {
            try {
                await updateDepartmentPreferencesApi(selectedDepartment, fullPrefs);
                addToast('科室偏好已保存', 'success');
            } catch (e) {
                console.error("Failed to save prefs to backend", e);
            }
        } else {
            addToast('科室偏好已更新', 'success');
        }
    }, [settings, setSettings, selectedDepartment, currentUser, addToast]);

    const handleToggleAudio = useCallback(() => {
        handleSavePreferences({ audioEnabled: !settings.audioEnabled });
    }, [handleSavePreferences, settings.audioEnabled]);

    const handleSaveCapacity = useCallback(async (newCapacity: number, newBedLabels: Record<string, string>) => {
        setSettings(prev => ({
            ...prev,
            deptCapacity: { ...prev.deptCapacity, [selectedDepartment]: newCapacity },
            bedLabels: { ...prev.bedLabels, [selectedDepartment]: newBedLabels }
        }));

        if (!settings.isDemoMode) {
            try {
                await updateDepartmentCapacity(selectedDepartment, newCapacity, newBedLabels);
                addToast('床位容量配置已同步', 'success');
            } catch (e) {
                addToast('配置同步失败', 'error');
            }
        } else {
            addToast('床位设置已更新 (演示)', 'success');
        }
    }, [settings.isDemoMode, selectedDepartment, setSettings, addToast]);

    const handleSaveDeviceWaveforms = useCallback(async (deviceType: DeviceType, waveforms: WaveformConfig[]) => {
        setSettings(prev => ({
            ...prev,
            deviceConfigs: {
                ...prev.deviceConfigs,
                [selectedDepartment]: {
                    ...prev.deviceConfigs[selectedDepartment],
                    [deviceType]: {
                        ...prev.deviceConfigs[selectedDepartment][deviceType],
                        waveforms: waveforms
                    }
                }
            }
        }));

        if (!settings.isDemoMode) {
            try {
                await updateDeviceWaveformsApi(selectedDepartment, deviceType, waveforms);
                addToast(`${DeviceTypeDesc[deviceType]} 波形配置已同步`, 'success');
            } catch (e) {
                addToast(`${DeviceTypeDesc[deviceType]} 波形保存失败`, 'error');
            }
        } else {
            addToast(`${DeviceTypeDesc[deviceType]} 波形配置已更新 (演示)`, 'success');
        }
    }, [settings.isDemoMode, selectedDepartment, setSettings, addToast]);

    const handleSaveDeviceParameters = useCallback(async (deviceType: DeviceType, parameters: ParameterConfig[]) => {
        setSettings(prev => ({
            ...prev,
            deviceConfigs: {
                ...prev.deviceConfigs,
                [selectedDepartment]: {
                    ...prev.deviceConfigs[selectedDepartment],
                    [deviceType]: {
                        ...prev.deviceConfigs[selectedDepartment][deviceType],
                        parameters: parameters
                    }
                }
            }
        }));

        if (!settings.isDemoMode) {
            try {
                await updateDeviceParametersApi(selectedDepartment, deviceType, parameters);
                addToast(`${DeviceTypeDesc[deviceType]} 参数配置已同步`, 'success');
            } catch (e) {
                addToast(`${DeviceTypeDesc[deviceType]} 参数保存失败`, 'error');
            }
        } else {
            addToast(`${DeviceTypeDesc[deviceType]} 参数配置已更新 (演示)`, 'success');
        }
    }, [settings.isDemoMode, selectedDepartment, setSettings, addToast]);

    const handleSaveAlarmThresholds = useCallback(async (newThresholds: AlarmThresholdItem[]) => {
        setSettings(prev => ({
            ...prev,
            alarmThresholds: { ...prev.alarmThresholds, [selectedDepartment]: newThresholds }
        }));

        if (!settings.isDemoMode) {
            try {
                await updateDepartmentAlarms(selectedDepartment, newThresholds);
                addToast('告警阈值策略已同步', 'success');
            } catch (e) {
                addToast('保存失败', 'error');
            }
        } else {
            addToast('告警策略已更新 (演示)', 'success');
        }
    }, [settings.isDemoMode, selectedDepartment, setSettings, addToast]);

    return {
        handleSavePreferences,
        handleToggleAudio,
        handleSaveCapacity,
        handleSaveDeviceWaveforms,
        handleSaveDeviceParameters,
        handleSaveAlarmThresholds
    };
};