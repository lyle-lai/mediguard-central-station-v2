
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PatientData, AppView, SystemSettings, VitalStatus, DepartmentCode, User, Department, UserRole, DepartmentPreferences } from './types';
import { DEFAULT_DEVICE_CONFIGS, DEFAULT_DEPT_CAPACITY, DEFAULT_ALARM_THRESHOLDS, DEFAULT_BED_LABELS } from './constants';
import { fetchGlobalConfig } from './services/apiService';
import { forceTriggerAlarm } from './services/iotSimulator';
import { useRealtimeData } from './hooks/useRealtimeData';
import { useSettingsLogic } from './hooks/useSettingsLogic';
import { useAdminLogic } from './hooks/useAdminLogic';
import { usePatientLogic } from './hooks/usePatientLogic';

// Components
import DashboardView from './components/dashboard/DashboardView.tsx';
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
    const [sortByOccupancy, setSortByOccupancy] = useState(false);
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    // --- Auto-Save Settings ---
    useEffect(() => {
        localStorage.setItem('mediguard_settings', JSON.stringify(settings));
    }, [settings]);

    // Restore selected department from user's list on load
    useEffect(() => {
        if (currentUser && currentUser.departments?.length > 0) {
            const hasAccess = currentUser.departments.some(d => d.code === selectedDepartment);
            if (!hasAccess) {
                setSelectedDepartment(currentUser.departments[0].code);
            }
        }
    }, [currentUser]);

    // --- Toast Helpers ---
    const addToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    // --- Custom Hooks ---
    const { patients, setPatients, alarmHistory, setAlarmHistory } = useRealtimeData(settings, currentUser, setSettings);

    const settingsActions = useSettingsLogic(settings, setSettings, selectedDepartment, currentUser, addToast);
    const adminActions = useAdminLogic(settings, setSettings, currentUser, addToast);
    const patientActions = usePatientLogic(settings, setPatients, setIsAddPatientModalOpen, addToast);

    // --- Derived State ---
    const departmentPatients = patients.filter(p => p.department === selectedDepartment);
    // Memoize occupied beds for the modal
    const occupiedBeds = useMemo(() => departmentPatients.map(p => p.bedNumber), [departmentPatients]);

    const activeAlarm = departmentPatients.find(p => p.status === VitalStatus.CRITICAL) || departmentPatients.find(p => p.status === VitalStatus.WARNING);
    const activeAlarmsCount = departmentPatients.filter(p => p.status === VitalStatus.CRITICAL || p.status === VitalStatus.WARNING).length;

    // --- Global Effects ---
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsBigScreen(false); };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, []);

    useEffect(() => { const timer = setInterval(() => setCurrentTime(new Date()), 1000); return () => clearInterval(timer); }, []);

    // FETCH CONFIG ON DEPARTMENT CHANGE (Real Mode)
    useEffect(() => {
        if (!settings.isDemoMode && currentUser) {
            fetchGlobalConfig(selectedDepartment).then((config: any) => {
                setSettings(prev => {
                    const newCapacity = config.deptCapacity?.[selectedDepartment] ?? config.capacity ?? prev.deptCapacity[selectedDepartment];
                    const newBedLabels = config.bedLabels?.[selectedDepartment] ?? config.bedLabels ?? prev.bedLabels[selectedDepartment];
                    const newDeviceConfig = config.deviceConfigs?.[selectedDepartment] ?? config.deviceConfig ?? prev.deviceConfigs[selectedDepartment];
                    const newThresholds = config.alarmThresholds?.[selectedDepartment] ?? config.alarmThresholds ?? prev.alarmThresholds[selectedDepartment];
                    const prefs: Partial<DepartmentPreferences> = config.preferences || {};

                    return {
                        ...prev,
                        deptCapacity: { ...prev.deptCapacity, [selectedDepartment]: newCapacity },
                        bedLabels: { ...prev.bedLabels, [selectedDepartment]: newBedLabels },
                        deviceConfigs: { ...prev.deviceConfigs, [selectedDepartment]: newDeviceConfig },
                        alarmThresholds: { ...prev.alarmThresholds, [selectedDepartment]: newThresholds },
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
        if (!user.departments || user.departments.length === 0) {
            addToast('登录失败：该账号未分配科室，请联系管理员', 'error');
            return;
        }
        localStorage.setItem('mediguard_user', JSON.stringify(user));
        setCurrentUser(user);
        setSettings(prev => ({ ...prev, isDemoMode: isDemo }));
        setSelectedDepartment(user.departments[0].code);
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

    if (!currentUser) return <LoginPage onLogin={handleLogin} />;

    const userRoleMap: Record<string, string> = { [UserRole.ADMIN]: '系统管理员', [UserRole.DOCTOR]: '医师', [UserRole.NURSE]: '护士' };
    const canSwitchDepartment = currentUser.departments && currentUser.departments.length > 1;
    const currentDeptCapacity = settings.deptCapacity[selectedDepartment] || 16;

    return (
        <div className="flex h-screen bg-med-bg text-gray-200 overflow-hidden font-sans">
            <ToastContainer toasts={toasts} onRemove={removeToast} />

            {!isBigScreen && (
                <Sidebar
                    currentUser={currentUser}
                    currentView={currentView}
                    setCurrentView={setCurrentView}
                    selectedDepartment={selectedDepartment}
                    setSelectedDepartment={setSelectedDepartment}
                    isDeptMenuOpen={isDeptMenuOpen}
                    setIsDeptMenuOpen={setIsDeptMenuOpen}
                    handleLogout={handleLogout}
                    settings={settings}
                    activeAlarmsCount={activeAlarmsCount}
                />
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
                    onToggleAudio={settingsActions.handleToggleAudio}
                />

                <div className={`flex-1 flex flex-col relative ${isBigScreen ? 'bg-black overflow-hidden' : 'overflow-hidden'}`}>
                    {currentView === AppView.DASHBOARD && (
                        <DashboardView
                            patients={departmentPatients}
                            settings={settings}
                            selectedDepartment={selectedDepartment}
                            isBigScreen={isBigScreen}
                            sortByOccupancy={sortByOccupancy}
                            onSetSelectedPatient={setSelectedPatient}
                            onSetConfig={setConfigPatient}
                            onAddPatient={(bedNum) => { setSelectedEmptyBed(bedNum); setIsAddPatientModalOpen(true); }}
                        />
                    )}

                    {!isBigScreen && (
                        <>
                            {currentView === AppView.PATIENTS && (
                                <PatientListView
                                    patients={departmentPatients}
                                    onAddPatient={() => { setSelectedEmptyBed(''); setIsAddPatientModalOpen(true); }}
                                    onRemovePatient={patientActions.handleRemovePatient}
                                />
                            )}

                            {currentView === AppView.ALARMS && (
                                <AlarmHistoryView
                                    alarms={alarmHistory.filter(a => a.department === selectedDepartment)}
                                    onClear={() => setAlarmHistory(prev => prev.filter(a => a.department !== selectedDepartment))}
                                />
                            )}

                            {currentView === AppView.SETTINGS && (
                                <SettingsView
                                    settings={settings}
                                    onUpdate={(s) => setSettings(s)}
                                    onSaveCapacity={settingsActions.handleSaveCapacity}
                                    onSaveDeviceConfig={() => { }}
                                    onSaveWaveforms={settingsActions.handleSaveDeviceWaveforms}
                                    onSaveParameters={settingsActions.handleSaveDeviceParameters}
                                    onSaveAlarms={settingsActions.handleSaveAlarmThresholds}
                                    onSavePreferences={settingsActions.handleSavePreferences}
                                    onTriggerAlarm={handleTriggerAlarm}
                                    currentUser={currentUser}
                                    currentDepartment={selectedDepartment}
                                />
                            )}

                            {currentView === AppView.ADMIN && currentUser.role === UserRole.ADMIN && (
                                <AdminDashboard
                                    departments={adminActions.departmentList}
                                    deptCapacities={settings.deptCapacity}
                                    onAddDepartment={adminActions.handleAddDepartment}
                                    onUpdateDepartment={adminActions.handleUpdateAdminCapacity}
                                    onDeleteDepartment={adminActions.handleDeleteDepartment}
                                />
                            )}
                        </>
                    )}
                </div>
            </main>

            {/* Global Modals */}
            {selectedPatient && (
                <PatientDetail
                    patient={patients.find(p => p.id === selectedPatient.id) || selectedPatient}
                    deviceConfig={settings.deviceConfigs[selectedPatient.department]}
                    onClose={() => setSelectedPatient(null)}
                />
            )}

            {configPatient && (
                <BedConfigModal
                    patient={patients.find(p => p.id === configPatient.id) || configPatient}
                    onClose={() => setConfigPatient(null)}
                    onSave={patientActions.handleSaveBedConfig}
                />
            )}

            <AddPatientModal
                isOpen={isAddPatientModalOpen}
                onClose={() => setIsAddPatientModalOpen(false)}
                onSubmit={patientActions.handleSaveNewPatient}
                currentDepartment={selectedDepartment}
                initialBedNumber={selectedEmptyBed}
                occupiedBeds={occupiedBeds}
                capacity={currentDeptCapacity}
                settings={settings}
            />
        </div>
    );
};

export default App;
