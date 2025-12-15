import { useState, useEffect, useCallback } from 'react';
import { DepartmentDTO, SystemSettings, DepartmentCode } from '../types';
import { fetchDepartmentsApi, createDepartmentApi, updateDepartmentCapacity, deleteDepartmentApi } from '../services/apiService';
import { DEFAULT_DEVICE_CONFIGS, DEFAULT_ALARM_THRESHOLDS } from '../constants';
import { ToastType } from '../components/Toast';

export const useAdminLogic = (
    settings: SystemSettings,
    setSettings: React.Dispatch<React.SetStateAction<SystemSettings>>,
    currentUser: any,
    addToast: (msg: string, type?: ToastType) => void
) => {
    const [departmentList, setDepartmentList] = useState<DepartmentDTO[]>([]);

    useEffect(() => {
        if (!settings.isDemoMode && currentUser) {
            fetchDepartmentsApi().then(data => {
                setDepartmentList(data);
            }).catch(console.error);
        } else {
            const depts: DepartmentDTO[] = Object.keys(settings.deptCapacity).map(code => ({
                id: code,
                code: code,
                name: (DepartmentCode as any)[code] || code,
                capacity: settings.deptCapacity[code]
            }));
            setDepartmentList(depts);
        }
    }, [settings.isDemoMode, currentUser]); // settings.deptCapacity not included to avoid loop

    const handleAddDepartment = useCallback(async (code: string, name: string, capacity: number) => {
        const safeCode = code.trim().toUpperCase();
        const optimisticDept: DepartmentDTO = { id: safeCode, code: safeCode, name, capacity };

        setDepartmentList(prev => {
            if (prev.find(d => d.code === safeCode)) return prev;
            return [...prev, optimisticDept];
        });

        setSettings(prev => ({
            ...prev,
            deptCapacity: { ...prev.deptCapacity, [safeCode]: capacity },
            deviceConfigs: { ...prev.deviceConfigs, [safeCode]: JSON.parse(JSON.stringify(DEFAULT_DEVICE_CONFIGS.ICU)) },
            alarmThresholds: { ...prev.alarmThresholds, [safeCode]: JSON.parse(JSON.stringify(DEFAULT_ALARM_THRESHOLDS.ICU)) },
            bedLabels: { ...prev.bedLabels, [safeCode]: {} }
        }));

        if (settings.isDemoMode) {
            addToast(`科室 ${name} 已创建 (模拟)`, 'success');
        } else {
            try {
                await createDepartmentApi(safeCode, name, capacity);
                await updateDepartmentCapacity(safeCode, capacity, {});
                const freshList = await fetchDepartmentsApi();
                setDepartmentList(freshList);
                setSettings(prev => {
                    const updatedCaps = { ...prev.deptCapacity };
                    freshList.forEach(d => {
                        if (d.capacity) updatedCaps[d.code] = d.capacity;
                    });
                    return { ...prev, deptCapacity: updatedCaps };
                });
                addToast(`科室 ${name} 创建成功`, 'success');
            } catch (e) {
                console.error(e);
                addToast('创建科室失败，请检查网络', 'error');
                setDepartmentList(prev => prev.filter(d => d.code !== safeCode));
            }
        }
    }, [settings.isDemoMode, setSettings, addToast]);

    const handleDeleteDepartment = useCallback(async (code: string) => {
        if (settings.isDemoMode) {
            const newCapacity = { ...settings.deptCapacity };
            delete newCapacity[code];
            setSettings(prev => ({ ...prev, deptCapacity: newCapacity }));
            setDepartmentList(prev => prev.filter(d => d.code !== code));
            addToast(`科室 ${code} 已删除 (模拟)`, 'success');
        } else {
            try {
                await deleteDepartmentApi(code);
                setDepartmentList(prev => prev.filter(d => d.code !== code));
                addToast(`科室 ${code} 删除成功`, 'success');
            } catch (e) {
                addToast('删除科室失败', 'error');
            }
        }
    }, [settings.isDemoMode, settings.deptCapacity, setSettings, addToast]);

    const handleUpdateAdminCapacity = useCallback(async (code: string, capacity: number) => {
        setSettings(prev => ({
            ...prev,
            deptCapacity: { ...prev.deptCapacity, [code]: capacity }
        }));
        setDepartmentList(prev => prev.map(d => d.code === code ? { ...d, capacity } : d));

        if (settings.isDemoMode) {
            addToast('容量已更新 (模拟)', 'success');
        } else {
            try {
                await updateDepartmentCapacity(code, capacity, settings.bedLabels[code] || {});
                addToast('容量已同步', 'success');
            } catch (e) {
                addToast('更新失败', 'error');
            }
        }
    }, [settings.isDemoMode, settings.bedLabels, setSettings, addToast]);

    return {
        departmentList,
        setDepartmentList,
        handleAddDepartment,
        handleDeleteDepartment,
        handleUpdateAdminCapacity
    };
};