
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PatientData, AppView, SystemSettings, VitalStatus, DepartmentCode, User, Department, UserRole, DeviceDisplayConfig, AlarmThresholdItem, DepartmentDTO, DeviceType, DeviceTypeDesc, WaveformConfig, ParameterConfig, DepartmentPreferences } from './types';
import { DEFAULT_DEVICE_CONFIGS, DEFAULT_DEPT_CAPACITY, DEFAULT_ALARM_THRESHOLDS, DEFAULT_BED_LABELS } from './constants';
import { admitPatientApi, dischargePatientApi, updatePatientConfigApi, updateDepartmentCapacity, updateDeviceWaveformsApi, updateDeviceParametersApi, updateDepartmentAlarms, fetchGlobalConfig, fetchAllPatientsApi, createDepartmentApi, deleteDepartmentApi, fetchDepartmentsApi, updateDepartmentPreferencesApi } from './services/apiService';
import { forceTriggerAlarm } from './services/iotSimulator';
import { useRealtimeData } from './hooks/useRealtimeData';

// Components
import PatientCard from './components/PatientCard';
import EmptyBedCard from './components/EmptyBedCard';
import PatientDetail from './components/PatientDetail';
import SettingsView from './components/SettingsView';
import PatientListView from './components/PatientListView';
import AlarmHistoryView from './components/AlarmHistoryView';
import AdminDashboard from './components/admin/AdminDashboard';
import AddPatientModal from './components/AddPatientModal';
import BedConfigModal from './components/BedConfigModal';
import LoginPage from './components/LoginPage';
import { ToastContainer, ToastMessage, ToastType } from './components/Toast';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import { Server, Wifi, AlertTriangle } from 'lucide-react';

const App: React.FC = () => {
    // --- Session Persistence Logic ---
    const [currentUser, setCurrentUser] = useState<User | null>(() => {
        try {
            const savedUser = localStorage.getItem('mediguard_user');
            return savedUser ? JSON.parse(savedUser) : null;
        } catch (e) { return null; }
    });

    const [settings, setSettings] = useState<SystemSettings>(() => {
        const defaults: SystemSettings = {
            isDemoMode: true,
            layoutMode: 'standard',
            filterType: 'ALL',
            audioEnabled: false,
            simulationSpeed: 2,
            deviceConfigs: DEFAULT_DEVICE_CONFIGS,
            deptCapacity: DEFAULT_DEPT_CAPACITY,
            alarmThresholds: DEFAULT_ALARM_THRESHOLDS,
            bedLabels: DEFAULT_BED_LABELS,
            nightMode: false
        };
        try {
            const savedSettings = localStorage.getItem('mediguard_settings');
            if (savedSettings) {
                return { ...defaults, ...JSON.parse(savedSettings) };
            }
        } catch (e) { }
        return defaults;
    });

    const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [selectedDepartment, setSelectedDepartment] = useState<Department>(DepartmentCode.ICU);
    const [isDeptMenuOpen, setIsDeptMenuOpen] = useState(false);
    const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
    const [isAddPatientModalOpen, setIsAddPatientModalOpen] = useState(false);
    const [selectedEmptyBed, setSelectedEmptyBed] = useState<string>('');
    const [selectedPatient, setSelectedPatient] = useState<PatientData | null>(null);
    const [configPatient, setConfigPatient] = useState<PatientData | null>(null);
    const [isBigScreen, setIsBigScreen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortByOccupancy, setSortByOccupancy] = useState(false);
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    // For Admin Dashboard
    const [departmentList, setDepartmentList] = useState<DepartmentDTO[]>([]);

    // --- Auto-Save Settings (Local for fallback/demo) ---
    useEffect(() => {
        localStorage.setItem('mediguard_settings', JSON.stringify(settings));
    }, [settings]);

    // Restore selected department from user's list on load
    useEffect(() => {
        if (currentUser && currentUser.departments?.length > 0) {
            // Ensure selected department is valid for this user
            const hasAccess = currentUser.departments.some(d => d.code === selectedDepartment);
            if (!hasAccess) {
                setSelectedDepartment(currentUser.departments[0].code);
            }
        }
    }, [currentUser]);

    // --- Custom Hook for Data ---
    const { patients, setPatients, alarmHistory, setAlarmHistory } = useRealtimeData(settings, currentUser, setSettings);

    // --- Derived State ---
    const departmentPatients = patients.filter(p => p.department === selectedDepartment);
    const bedListStr = departmentPatients.map(p => p.bedNumber).sort().join(',');
    const occupiedBeds = useMemo(() => departmentPatients.map(p => p.bedNumber), [bedListStr]);
    const activeAlarm = departmentPatients.find(p => p.status === VitalStatus.CRITICAL) || departmentPatients.find(p => p.status === VitalStatus.WARNING);
    const activeAlarmsCount = departmentPatients.filter(p => p.status === VitalStatus.CRITICAL || p.status === VitalStatus.WARNING).length;

    // --- Toast Helpers ---
    const addToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    // --- Global Effects ---
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsBigScreen(false); };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, []);

    useEffect(() => { setCurrentPage(1); }, [selectedDepartment, settings.filterType, settings.layoutMode, sortByOccupancy]);
    useEffect(() => { const timer = setInterval(() => setCurrentTime(new Date()), 1000); return () => clearInterval(timer); }, []);

    // Init Departments List (for Admin & Switching)
    useEffect(() => {
        if (!settings.isDemoMode && currentUser) {
            // Use the new API for fetching department list
            fetchDepartmentsApi().then(data => {
                setDepartmentList(data);
            }).catch(console.error);
        } else {
            // Demo Mode Initialization
            const depts: DepartmentDTO[] = Object.keys(settings.deptCapacity).map(code => ({
                id: code,
                code: code,
                name: (DepartmentCode as any)[code] || code,
                capacity: settings.deptCapacity[code]
            }));
            setDepartmentList(depts);
        }
    }, [settings.isDemoMode, currentUser]);


    // FETCH CONFIG ON DEPARTMENT CHANGE (Real Mode)
    useEffect(() => {
        if (!settings.isDemoMode && currentUser) {
            fetchGlobalConfig(selectedDepartment).then((config: any) => {
                console.log("Fetched Dept Config:", config);
                setSettings(prev => {
                    const newCapacity = config.deptCapacity?.[selectedDepartment] ?? config.capacity ?? prev.deptCapacity[selectedDepartment];
                    const newBedLabels = config.bedLabels?.[selectedDepartment] ?? config.bedLabels ?? prev.bedLabels[selectedDepartment];
                    const newDeviceConfig = config.deviceConfigs?.[selectedDepartment] ?? config.deviceConfig ?? prev.deviceConfigs[selectedDepartment];
                    const newThresholds = config.alarmThresholds?.[selectedDepartment] ?? config.alarmThresholds ?? prev.alarmThresholds[selectedDepartment];

                    // Apply Department Preferences if they exist
                    const prefs: Partial<DepartmentPreferences> = config.preferences || {};

                    return {
                        ...prev,
                        deptCapacity: { ...prev.deptCapacity, [selectedDepartment]: newCapacity },
                        bedLabels: { ...prev.bedLabels, [selectedDepartment]: newBedLabels },
                        deviceConfigs: { ...prev.deviceConfigs, [selectedDepartment]: newDeviceConfig },
                        alarmThresholds: { ...prev.alarmThresholds, [selectedDepartment]: newThresholds },
                        // Apply Prefs (with defaults)
                        isDemoMode: prefs.isDemoMode ?? prev.isDemoMode,
                        simulationSpeed: prefs.simulationSpeed ?? prev.simulationSpeed,
                        nightMode: prefs.nightMode ?? prev.nightMode,
                        audioEnabled: prefs.audioEnabled ?? prev.audioEnabled
                    };
                });
            }).catch(e => console.error("Failed to fetch dept config", e));
        }
    }, [selectedDepartment, settings.isDemoMode, currentUser]);

    // --- Handlers ---
    const handleLogin = (user: User, isDemo: boolean) => {
        // Validate user has at least one department
        if (!user.departments || user.departments.length === 0) {
            addToast('登录失败：该账号未分配科室，请联系管理员', 'error');
            return;
        }

        // Persist User Session
        localStorage.setItem('mediguard_user', JSON.stringify(user));
        setCurrentUser(user);

        // Sync Settings with Login Mode
        setSettings(prev => ({ ...prev, isDemoMode: isDemo }));

        const defaultDept = user.departments[0].code;
        setSelectedDepartment(defaultDept);
        addToast(`欢迎回来, ${user.name}`, 'success');
    };

    const handleLogout = () => {
        localStorage.removeItem('mediguard_user');
        localStorage.removeItem('token');
        setCurrentUser(null);
        setIsBigScreen(false);
        setCurrentView(AppView.DASHBOARD);
    };

    const handleTriggerAlarm = () => {
        if (!settings.isDemoMode) { alert("请先开启演示模式 (Demo Mode)"); return; }
        setPatients(prev => forceTriggerAlarm(prev, selectedDepartment));
        addToast('已触发测试报警', 'warning');
    };

    const handleAcknowledgeAlarm = (patientId: string) => {
        setPatients(prev => prev.map(p => {
            if (p.id === patientId && p.activeAlarm) return { ...p, activeAlarm: { ...p.activeAlarm, isAcknowledged: true } };
            return p;
        }));
        addToast('报警已确认 (静音)', 'success');
    };

    // --- Granular Update Handlers ---

    const handleSavePreferences = async (newPrefs: Partial<DepartmentPreferences>) => {
        // Optimistic Update
        setSettings(prev => ({ ...prev, ...newPrefs }));

        // Construct full object for API
        const fullPrefs: DepartmentPreferences = {
            isDemoMode: newPrefs.isDemoMode ?? settings.isDemoMode,
            simulationSpeed: newPrefs.simulationSpeed ?? settings.simulationSpeed,
            nightMode: newPrefs.nightMode ?? settings.nightMode,
            audioEnabled: newPrefs.audioEnabled ?? settings.audioEnabled
        };

        // Always try to save preference to backend if we are logged in, 
        // regardless of whether we are currently in demo mode or switching to it.
        // This ensures the backend remembers the "Demo Mode" state when we reload.
        if (currentUser) {
            try {
                await updateDepartmentPreferencesApi(selectedDepartment, fullPrefs);
                addToast('科室偏好已保存', 'success');
            } catch (e) {
                console.error("Failed to save prefs to backend (likely offline or demo user)", e);
                // We don't show an error toast here if it's just a demo user connection error to avoid UX noise,
                // but we logged it.
            }
        } else {
            // Fallback for purely local usage without login context (rare)
            addToast('科室偏好已更新', 'success');
        }
    };

    const handleToggleAudio = () => {
        handleSavePreferences({ audioEnabled: !settings.audioEnabled });
    };

    const handleSaveCapacity = async (newCapacity: number, newBedLabels: Record<string, string>) => {
        // Optimistic
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
    };

    // Granular Update: Only update waveforms
    const handleSaveDeviceWaveforms = async (deviceType: DeviceType, waveforms: WaveformConfig[]) => {
        // Optimistic Update
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
    };

    // Granular Update: Only update parameters
    const handleSaveDeviceParameters = async (deviceType: DeviceType, parameters: ParameterConfig[]) => {
        // Optimistic Update
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
    };

    const handleSaveAlarmThresholds = async (newThresholds: AlarmThresholdItem[]) => {
        // Optimistic
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
    };

    const handleLocalSettingsUpdate = (newSettings: SystemSettings) => {
        setSettings(newSettings);
    };

    // --- Admin Dashboard Handlers ---

    const handleAddDepartment = async (code: string, name: string, capacity: number) => {
        const safeCode = code.trim().toUpperCase();

        // 1. Optimistic Update
        const optimisticDept: DepartmentDTO = { id: safeCode, code: safeCode, name, capacity };

        setDepartmentList(prev => {
            if (prev.find(d => d.code === safeCode)) return prev;
            return [...prev, optimisticDept];
        });

        // Initialize local settings
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
                // 2. Call Create API
                await createDepartmentApi(safeCode, name, capacity);

                // 3. Force Capacity Update API
                await updateDepartmentCapacity(safeCode, capacity, {});

                // 4. Re-fetch Authoritative List
                const freshList = await fetchDepartmentsApi();
                setDepartmentList(freshList);

                // 5. Sync Settings Map
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
    };

    const handleDeleteDepartment = async (code: string) => {
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
    };

    const handleUpdateAdminCapacity = async (code: string, capacity: number) => {
        if (settings.isDemoMode) {
            setSettings(prev => ({
                ...prev,
                deptCapacity: { ...prev.deptCapacity, [code]: capacity }
            }));
            addToast('容量已更新 (模拟)', 'success');
        } else {
            try {
                await updateDepartmentCapacity(code, capacity, settings.bedLabels[code] || {});
                addToast('容量已同步', 'success');
            } catch (e) {
                addToast('更新失败', 'error');
            }
        }
        setDepartmentList(prev => prev.map(d => d.code === code ? { ...d, capacity } : d));
    };


    // --- Patient Management Handlers ---

    const handleSaveNewPatient = async (data: Partial<PatientData>) => {
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
    };

    const handleRemovePatient = async (id: string) => {
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
    };

    const handleSaveBedConfig = async (pid: string, cfg: any) => {
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
    };

    // --- Render Logic ---
    const getDeptPrefix = (dept: string) => {
        return 'Bed';
    };

    const currentDeptCapacity = settings.deptCapacity[selectedDepartment] || 16;
    const deptPrefix = getDeptPrefix(selectedDepartment);
    const currentBedLabels = settings.bedLabels?.[selectedDepartment] || {};

    let rawSlots: { bedNum: string, bedLabel?: string, patient?: PatientData }[] = [];
    for (let i = 1; i <= currentDeptCapacity; i++) {
        const bedNum = `${deptPrefix}-${String(i).padStart(2, '0')}`;
        const patient = patients.find(p => p.bedNumber === bedNum);
        const customLabel = currentBedLabels[bedNum];
        rawSlots.push({ bedNum, bedLabel: customLabel, patient });
    }

    if (sortByOccupancy) {
        rawSlots.sort((a, b) => {
            const hasA = !!a.patient; const hasB = !!b.patient;
            if (hasA && !hasB) return -1; if (!hasA && hasB) return 1;
            return a.bedNum.localeCompare(b.bedNum);
        });
    }

    const getLayoutConfig = () => {
        switch (settings.layoutMode) {
            case 'compact': return { cols: 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6', rows: 'grid-rows-4', pageSize: 24 };
            case 'large': return { cols: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3', rows: 'grid-rows-2', pageSize: 6 };
            case 'standard': default: return { cols: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4', rows: 'grid-rows-3', pageSize: 12 };
        }
    };

    const layoutConfig = getLayoutConfig();
    const totalPages = Math.ceil(rawSlots.length / layoutConfig.pageSize) || 1;
    const alarmingPages = new Set<number>();
    const offScreenAlarmBeds: string[] = [];

    const fullGridItems = rawSlots.map((slot, index) => {
        const { bedNum, bedLabel, patient } = slot;
        const pageIndex = Math.floor(index / layoutConfig.pageSize) + 1;

        if (patient && (patient.status === VitalStatus.CRITICAL || patient.status === VitalStatus.WARNING)) {
            alarmingPages.add(pageIndex);
            if (pageIndex !== currentPage) offScreenAlarmBeds.push(bedLabel || bedNum);
        }

        if (patient) {
            const matchesFilter = settings.filterType === 'ALL' || patient.connectedDevices.includes(settings.filterType);
            if (!matchesFilter) return null;

            const deptConfig = settings.deviceConfigs[patient.department];
            const deviceConfig = settings.filterType !== 'ALL' ? deptConfig?.[settings.filterType] : deptConfig?.[patient.deviceType];

            return <PatientCard key={patient.id} patient={patient} bedLabel={bedLabel} deviceConfig={deviceConfig} onClick={setSelectedPatient} onOpenConfig={setConfigPatient} compact={settings.layoutMode === 'compact'} stretch={isBigScreen} />;
        } else {
            return settings.filterType === 'ALL' ? <EmptyBedCard key={`empty-${bedNum}`} bedNumber={bedNum} bedLabel={bedLabel} onClick={() => { setSelectedEmptyBed(bedNum); setIsAddPatientModalOpen(true); }} compact={settings.layoutMode === 'compact'} stretch={isBigScreen} /> : null;
        }
    }).filter(Boolean);

    const visibleGridItems = isBigScreen ? fullGridItems.slice((currentPage - 1) * layoutConfig.pageSize, currentPage * layoutConfig.pageSize) : fullGridItems;

    if (!currentUser) return <LoginPage onLogin={handleLogin} />;

    const userRoleMap: Record<string, string> = { [UserRole.ADMIN]: '系统管理员', [UserRole.DOCTOR]: '医师', [UserRole.NURSE]: '护士' };
    const canSwitchDepartment = currentUser.departments && currentUser.departments.length > 1;

    return (
        <div className="flex h-screen bg-med-bg text-gray-200 overflow-hidden font-sans">
            <ToastContainer toasts={toasts} onRemove={removeToast} />
            {!isBigScreen && (
                <Sidebar currentUser={currentUser} currentView={currentView} setCurrentView={setCurrentView} selectedDepartment={selectedDepartment} setSelectedDepartment={setSelectedDepartment} isDeptMenuOpen={isDeptMenuOpen} setIsDeptMenuOpen={setIsDeptMenuOpen} handleLogout={handleLogout} settings={settings} activeAlarmsCount={activeAlarmsCount} />
            )}
            <main className={`flex-1 flex flex-col min-w-0 relative z-0 transition-all duration-300`}>
                <Header
                    isBigScreen={isBigScreen}
                    settings={settings}
                    setSettings={setSettings}
                    selectedDepartment={selectedDepartment}
                    setSelectedDepartment={setSelectedDepartment}
                    isDeptMenuOpen={isDeptMenuOpen}
                    setIsDeptMenuOpen={setIsDeptMenuOpen}
                    canSwitchDepartment={canSwitchDepartment}
                    currentUser={currentUser}
                    currentView={currentView}
                    setCurrentView={setCurrentView}
                    isFilterMenuOpen={isFilterMenuOpen}
                    setIsFilterMenuOpen={setIsFilterMenuOpen}
                    activeAlarm={activeAlarm ? { ...activeAlarm.activeAlarm!, bedNumber: activeAlarm.bedNumber, id: activeAlarm.id } : undefined}
                    activeAlarmsCount={activeAlarmsCount}
                    handleAcknowledgeAlarm={handleAcknowledgeAlarm}
                    sortByOccupancy={sortByOccupancy}
                    setSortByOccupancy={setSortByOccupancy}
                    currentTime={currentTime}
                    setIsBigScreen={setIsBigScreen}
                    userRoleMap={userRoleMap}
                    patients={patients}
                    onToggleAudio={handleToggleAudio}
                />

                <div className={`flex-1 flex flex-col relative ${isBigScreen ? 'bg-black overflow-hidden' : 'overflow-hidden'}`}>
                    {currentView === AppView.DASHBOARD && (
                        <>
                            <div className={`flex-1 ${isBigScreen ? 'p-2 overflow-hidden' : 'p-2 md:p-4 overflow-y-auto custom-scrollbar'}`}>
                                <div className={`grid gap-2 transition-all duration-300 ${isBigScreen ? 'h-full w-full content-stretch' : 'pb-20'} ${layoutConfig.cols} ${isBigScreen ? layoutConfig.rows : ''}`}>
                                    {visibleGridItems}
                                </div>
                            </div>
                            {isBigScreen && (
                                <div className="h-10 bg-[#08090a] border-t border-gray-800 flex items-center justify-between px-4 shrink-0 text-xs text-gray-500 font-mono">
                                    <div className="flex items-center gap-4 min-w-[300px]">
                                        <span className="flex items-center gap-1.5 text-green-600"><Wifi size={14} /> 在线</span>
                                        <span className="flex items-center gap-1.5 text-blue-600"><Server size={14} /> CMS-SERVER-01</span>
                                        {offScreenAlarmBeds.length > 0 && (
                                            <div className="flex items-center gap-2 text-red-500 animate-pulse ml-4 font-bold overflow-hidden">
                                                <AlertTriangle size={14} />
                                                <span className="whitespace-nowrap">⚠️ 其他页报警: {offScreenAlarmBeds.slice(0, 3).join(', ')} {offScreenAlarmBeds.length > 3 ? `等${offScreenAlarmBeds.length}床` : ''}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => {
                                                const hasAlarm = alarmingPages.has(p); const isCurrent = currentPage === p;
                                                return (
                                                    <button key={p} onClick={() => setCurrentPage(Math.min(Math.max(1, p), totalPages))} className={`w-8 h-8 rounded flex items-center justify-center font-bold text-sm transition-all relative ${isCurrent ? 'bg-blue-600 text-white border border-blue-500' : 'bg-gray-900 text-gray-500 border border-gray-800 hover:bg-gray-800 hover:text-gray-300'} ${hasAlarm && !isCurrent ? 'border-red-600 bg-red-900/20 text-red-500 animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.5)]' : ''}`}>
                                                        {p} {hasAlarm && !isCurrent && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-600 rounded-full border border-black"></span>}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                    {!isBigScreen && (
                        <>
                            {currentView === AppView.PATIENTS && <PatientListView patients={departmentPatients} onAddPatient={() => { setSelectedEmptyBed(''); setIsAddPatientModalOpen(true); }} onRemovePatient={handleRemovePatient} />}
                            {currentView === AppView.ALARMS && <AlarmHistoryView alarms={alarmHistory.filter(a => a.department === selectedDepartment)} onClear={() => setAlarmHistory(prev => prev.filter(a => a.department !== selectedDepartment))} />}
                            {currentView === AppView.SETTINGS && (
                                <SettingsView
                                    settings={settings}
                                    onUpdate={handleLocalSettingsUpdate}
                                    onSaveCapacity={handleSaveCapacity}
                                    onSaveDeviceConfig={handleSaveDeviceWaveforms}
                                    onSaveWaveforms={handleSaveDeviceWaveforms}
                                    onSaveParameters={handleSaveDeviceParameters}
                                    onSaveAlarms={handleSaveAlarmThresholds}
                                    onSavePreferences={handleSavePreferences} // Pass the handler for department preferences
                                    onTriggerAlarm={handleTriggerAlarm}
                                    currentUser={currentUser}
                                    currentDepartment={selectedDepartment}
                                />
                            )}
                            {currentView === AppView.ADMIN && currentUser.role === UserRole.ADMIN && (
                                <AdminDashboard
                                    departments={departmentList}
                                    deptCapacities={settings.deptCapacity}
                                    onAddDepartment={handleAddDepartment}
                                    onUpdateDepartment={handleUpdateAdminCapacity}
                                    onDeleteDepartment={handleDeleteDepartment}
                                />
                            )}
                        </>
                    )}
                </div>
            </main>
            {selectedPatient && <PatientDetail patient={patients.find(p => p.id === selectedPatient.id) || selectedPatient} deviceConfig={settings.deviceConfigs[selectedPatient.department]} onClose={() => setSelectedPatient(null)} />}
            {configPatient && <BedConfigModal patient={patients.find(p => p.id === configPatient.id) || configPatient} onClose={() => setConfigPatient(null)} onSave={handleSaveBedConfig} />}
            <AddPatientModal isOpen={isAddPatientModalOpen} onClose={() => setIsAddPatientModalOpen(false)} onSubmit={handleSaveNewPatient} currentDepartment={selectedDepartment} initialBedNumber={selectedEmptyBed} occupiedBeds={occupiedBeds} capacity={currentDeptCapacity} />
        </div>
    );
};

export default App;
