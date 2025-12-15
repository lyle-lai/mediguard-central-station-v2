import React, { useState, useEffect } from 'react';
import { PatientData, AlarmRecord, SystemSettings, VitalStatus, AlarmCategory, DeviceRealtimeDataDTO, User, DepartmentCode } from '../types';
import { generateInitialData, simulateNextTick, generateInitialAlarms, captureAlarmSnapshot } from '../services/iotSimulator';
import { fetchAllPatientsApi, fetchAlarmHistoryApi, fetchGlobalConfig } from '../services/apiService';
import { connectWebSocket, disconnectWebSocket } from '../services/websocketService';
import { MAX_WAVEFORM_POINTS, DEFAULT_DEVICE_CONFIGS, UPDATE_INTERVAL_MS } from '../constants';

// 兼容性更好的 UUID 生成函数
const generateUUID = (): string => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Fallback: 简单的 UUID v4 实现
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

export const useRealtimeData = (
    settings: SystemSettings,
    currentUser: User | null,
    setSettings: React.Dispatch<React.SetStateAction<SystemSettings>>
) => {
    const [patients, setPatients] = useState<PatientData[]>([]);
    const [alarmHistory, setAlarmHistory] = useState<AlarmRecord[]>([]);

    // 1. Demo Mode Data Generation
    useEffect(() => {
        if (settings.isDemoMode) {
            if (patients.length === 0) {
                const initPatients = generateInitialData();
                setPatients(initPatients);
                setAlarmHistory(generateInitialAlarms(initPatients));
            }
            disconnectWebSocket();
        } else {
            setPatients([]);
            setAlarmHistory([]);
        }
    }, [settings.isDemoMode]);

    // 1b. Safety Check for Demo History
    useEffect(() => {
        if (settings.isDemoMode && patients.length > 0 && alarmHistory.length === 0) {
            setAlarmHistory(generateInitialAlarms(patients));
        }
    }, [patients.length, settings.isDemoMode]);

    // 2. Simulation Loop (Demo Mode)
    useEffect(() => {
        if (!settings.isDemoMode || settings.simulationSpeed === 0 || !currentUser) return;

        const intervalId = setInterval(() => {
            setPatients(prev => simulateNextTick(
                prev,
                settings.simulationSpeed,
                settings.deviceConfigs, // Passing map
                settings.alarmThresholds // Passing map
            ));
        }, UPDATE_INTERVAL_MS);

        return () => clearInterval(intervalId);
    }, [settings.isDemoMode, settings.simulationSpeed, settings.deviceConfigs, settings.alarmThresholds, currentUser]);

    // 3. Alarm Detection Logic (Common for both modes to update History)
    useEffect(() => {
        if (!settings.isDemoMode || patients.length === 0) return;

        setAlarmHistory(prevHist => {
            const now = Date.now();
            const newAlarms: AlarmRecord[] = [];

            patients.forEach(p => {
                if (p.activeAlarm && (p.status === VitalStatus.CRITICAL || p.status === VitalStatus.WARNING)) {
                    const isDuplicate = prevHist.some(h =>
                        h.patientId === p.id &&
                        h.category === p.activeAlarm?.category &&
                        h.message === p.activeAlarm?.message &&
                        (now - h.timestamp.getTime() < 10000)
                    );

                    if (!isDuplicate) {
                        newAlarms.push({
                            id: generateUUID(),
                            timestamp: new Date(),
                            patientId: p.id,
                            patientName: p.name,
                            bedNumber: p.bedNumber,
                            department: p.department,
                            deviceType: p.deviceType,
                            type: p.status,
                            category: p.activeAlarm.category,
                            message: p.activeAlarm.message,
                            acknowledged: false,
                            snapshot: captureAlarmSnapshot(p)
                        });
                    }
                }
            });

            if (newAlarms.length > 0) {
                return [...newAlarms, ...prevHist].slice(0, 100);
            }
            return prevHist;
        });
    }, [patients, settings.isDemoMode]);

    // 4. Real API & WebSocket Integration
    useEffect(() => {
        if (settings.isDemoMode || !currentUser) return;

        const loadRealData = async () => {
            try {
                const currentDeptCode = (currentUser.departments && currentUser.departments.length > 0)
                    ? currentUser.departments[0].code
                    : DepartmentCode.ICU;

                const [realPatients, realAlarms, globalConfig] = await Promise.all([
                    fetchAllPatientsApi(),
                    fetchAlarmHistoryApi(currentDeptCode),
                    fetchGlobalConfig(currentDeptCode)
                ]);

                const configToUse = globalConfig.deviceConfigs || settings.deviceConfigs;

                setSettings(prev => ({
                    ...prev,
                    deptCapacity: globalConfig.deptCapacity || prev.deptCapacity,
                    deviceConfigs: configToUse,
                }));

                const initializedPatients = realPatients.map(p => {
                    // Use department-specific config for initial buffer setup
                    const deptConfig = configToUse[p.department] || DEFAULT_DEVICE_CONFIGS[p.department];
                    const devConfig = deptConfig[p.deviceType];

                    return {
                        ...p,
                        waveforms: p.waveforms.length > 0 ? p.waveforms : (devConfig?.waveforms || []).map(c => ({
                            id: c.id,
                            label: c.label,
                            color: c.color,
                            data: new Array(MAX_WAVEFORM_POINTS - 1).fill(50)
                        })),
                        parameters: p.parameters.length > 0 ? p.parameters : (devConfig?.parameters || []).map(c => ({
                            id: c.id,
                            label: c.label,
                            unit: c.unit,
                            value: '--'
                        }))
                    };
                });
                setPatients(initializedPatients);
                setAlarmHistory(realAlarms || []);
            } catch (e) {
                console.error("Failed to fetch real data:", e);
            }
        };

        loadRealData();

        connectWebSocket((updates: any[]) => {
            const dtos = updates as DeviceRealtimeDataDTO[];

            setPatients(prev => {
                if (prev.length === 0) return prev;
                const updateMap = new Map(dtos.map(u => [u.deviceId, u]));

                return prev.map(p => {
                    const u = updateMap.get(p.deviceId);
                    if (!u) return p;

                    const newWaves = p.waveforms.map(wave => {
                        if (u.waveforms && u.waveforms[wave.id]) {
                            const points = u.waveforms[wave.id];
                            // Safety: Ensure points is an array
                            if (!Array.isArray(points)) return wave;

                            const newData = wave.data.slice(points.length);
                            newData.push(...points);

                            // Safety: Hard limit on length to prevent OOM
                            if (newData.length > MAX_WAVEFORM_POINTS) {
                                return { ...wave, data: newData.slice(newData.length - MAX_WAVEFORM_POINTS) };
                            }
                            return { ...wave, data: newData };
                        }
                        return wave;
                    });

                    let newParams = p.parameters;
                    if (u.parameters) {
                        newParams = p.parameters.map(param => {
                            if (u.parameters && u.parameters[param.id] !== undefined) {
                                return { ...param, value: u.parameters[param.id] };
                            }
                            return param;
                        });
                    }

                    let activeAlarm = undefined;
                    let newStatus = VitalStatus.NORMAL;

                    if (u.activeAlarms && u.activeAlarms.length > 0) {
                        const alarm = u.activeAlarms[0];
                        newStatus = alarm.level;
                        activeAlarm = {
                            message: alarm.msg,
                            category: AlarmCategory.PHYSIOLOGICAL,
                            timestamp: new Date()
                        };
                    }

                    return {
                        ...p,
                        status: newStatus,
                        activeAlarm,
                        parameters: newParams,
                        waveforms: newWaves
                    };
                });
            });
        });

        return () => disconnectWebSocket();
    }, [settings.isDemoMode, currentUser]);

    return { patients, setPatients, alarmHistory, setAlarmHistory };
};