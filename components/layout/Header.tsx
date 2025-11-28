
import React from 'react';
import { AppView, Department, SystemSettings, User, DeviceType, DeviceTypeDesc, AlarmCategory, DepartmentDesc, PatientData } from '../../types';
import { Building2, ChevronDown, Filter, Check, Monitor, Grid, Minimize, AlertTriangle, Activity, UserCircle, ArrowDownUp, MonitorPlay, Volume2, VolumeX, Bell } from 'lucide-react';

interface HeaderProps {
  isBigScreen: boolean;
  settings: SystemSettings;
  setSettings: React.Dispatch<React.SetStateAction<SystemSettings>>;
  selectedDepartment: Department;
  setSelectedDepartment: (d: Department) => void;
  isDeptMenuOpen: boolean;
  setIsDeptMenuOpen: (o: boolean) => void;
  canSwitchDepartment: boolean;
  currentUser: User;
  currentView: AppView;
  setCurrentView: (v: AppView) => void;
  isFilterMenuOpen: boolean;
  setIsFilterMenuOpen: (o: boolean) => void;
  activeAlarm?: PatientData['activeAlarm'] & { bedNumber: string, id: string };
  activeAlarmsCount: number;
  handleAcknowledgeAlarm: (id: string) => void;
  sortByOccupancy: boolean;
  setSortByOccupancy: (s: boolean) => void;
  currentTime: Date;
  setIsBigScreen: (b: boolean) => void;
  userRoleMap: Record<string, string>;
  patients: PatientData[];
}

const Header: React.FC<HeaderProps> = ({
  isBigScreen,
  settings,
  setSettings,
  selectedDepartment,
  setSelectedDepartment,
  isDeptMenuOpen,
  setIsDeptMenuOpen,
  canSwitchDepartment,
  currentUser,
  currentView,
  setCurrentView,
  isFilterMenuOpen,
  setIsFilterMenuOpen,
  activeAlarm,
  activeAlarmsCount,
  handleAcknowledgeAlarm,
  sortByOccupancy,
  setSortByOccupancy,
  currentTime,
  setIsBigScreen,
  userRoleMap,
  patients
}) => {
  
  const getFilterLabel = (type: DeviceType | 'ALL') => {
      switch(type) {
          case DeviceType.MONITOR: return 'ICU监护仪';
          case DeviceType.VENTILATOR: return '呼吸机';
          case DeviceType.ANESTHESIA: return '麻醉机';
          default: return '全部设备';
      }
  };

  return (
    <header className={`
        border-b flex items-center justify-between px-6 shrink-0 transition-all duration-300 gap-4
        ${isBigScreen ? 'h-20 bg-black' : 'h-14 bg-med-card'}
        ${activeAlarmsCount > 0 && isBigScreen ? 'border-red-900 shadow-[0_0_20px_rgba(220,38,38,0.2)]' : 'border-gray-800'}
    `}>
        {/* Left Section */}
        <div className="flex-1 flex items-center justify-start gap-4 min-w-0">
            <h1 className={`${isBigScreen ? 'text-2xl text-blue-500' : 'text-lg text-gray-100'} font-bold tracking-wide hidden md:block transition-all whitespace-nowrap`}>
                MediGuard <span className="text-gray-500">CMS</span>
            </h1>
            
            {settings.isDemoMode ? (
                <div className="px-2 py-0.5 rounded bg-yellow-900/30 border border-yellow-700 text-[10px] text-yellow-500 font-bold uppercase tracking-wider ml-2 whitespace-nowrap hidden sm:block">Demo Mode</div>
            ) : (
                <div className="px-2 py-0.5 rounded bg-blue-900/30 border border-blue-700 text-[10px] text-blue-400 font-bold uppercase tracking-wider ml-2 whitespace-nowrap hidden sm:block">Live</div>
            )}

            <div className="h-4 w-px bg-gray-700 hidden md:block ml-2"></div>
            
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-all whitespace-nowrap ${isBigScreen ? 'bg-gray-900 border-blue-900 scale-125 origin-left ml-4' : 'bg-gray-800 border-gray-700 shadow-inner'}`}>
                <div className={`w-2 h-2 rounded-full ${settings.isDemoMode ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
                <span className={`font-bold ${isBigScreen ? 'text-blue-100' : 'text-gray-300 text-sm'}`}>{DepartmentDesc[selectedDepartment]}</span>
            </div>

            {!isBigScreen && currentView === AppView.DASHBOARD && (
                <>
                <div className="h-4 w-px bg-gray-700 hidden lg:block ml-2"></div>
                <div className="hidden lg:flex items-center gap-2">
                    {/* Filter Dropdown */}
                    <div className="relative">
                        <button onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)} className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-md text-xs font-bold text-gray-300 hover:text-white hover:border-gray-600 transition min-w-[130px] justify-between z-10">
                            <div className="flex items-center gap-2"><Filter size={12} className="text-blue-500" /><span>{getFilterLabel(settings.filterType)}</span></div>
                            <ChevronDown size={12} className="text-gray-500" />
                        </button>
                        {isFilterMenuOpen && (
                            <>
                                <div className="fixed inset-0 z-40 cursor-default" onClick={() => setIsFilterMenuOpen(false)}></div>
                                <div className="absolute top-full left-0 mt-1 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                    <div className="p-2 space-y-1">
                                        {[{ label: '全部设备', value: 'ALL' }, { label: 'ICU监护仪', value: DeviceType.MONITOR }, { label: '呼吸机', value: DeviceType.VENTILATOR }, { label: '麻醉机', value: DeviceType.ANESTHESIA }].map((opt) => (
                                            <button key={opt.value} onClick={() => { setSettings(s => ({...s, filterType: opt.value as any})); setIsFilterMenuOpen(false); }} className={`w-full text-left px-3 py-2 rounded text-xs font-bold flex items-center justify-between transition ${settings.filterType === opt.value ? 'bg-blue-900/30 text-blue-400' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                                                {opt.label} {settings.filterType === opt.value && <Check size={12}/>}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                    <div className="hidden lg:flex bg-gray-900 rounded-md p-0.5 border border-gray-700 ml-2 h-[30px] items-center relative z-20">
                        <button onClick={() => setSettings(s => ({...s, layoutMode: 'large'}))} className={`cursor-pointer p-1.5 h-full rounded-sm flex items-center justify-center transition ${settings.layoutMode === 'large' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-800'}`}><Monitor size={14} /></button>
                        <button onClick={() => setSettings(s => ({...s, layoutMode: 'standard'}))} className={`cursor-pointer p-1.5 h-full rounded-sm flex items-center justify-center transition ${settings.layoutMode === 'standard' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-800'}`}><Grid size={14} /></button>
                        <button onClick={() => setSettings(s => ({...s, layoutMode: 'compact'}))} className={`cursor-pointer p-1.5 h-full rounded-sm flex items-center justify-center transition ${settings.layoutMode === 'compact' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-800'}`}><Grid size={14} className="scale-50" /></button>
                    </div>
                </div>
                </>
            )}
        </div>

        {/* Center Section - Alarm Banner */}
        {(activeAlarmsCount > 0 && isBigScreen) ? (
            <div className="shrink-0 z-50 flex items-center gap-3 px-6 py-2 bg-red-600 rounded-lg animate-pulse shadow-[0_0_20px_rgba(220,38,38,0.8)] border-2 border-red-400 mx-2">
                <Bell size={24} fill="white" className="text-white" />
                <span className="text-2xl font-bold text-white tracking-widest whitespace-nowrap">{activeAlarmsCount} 报警</span>
            </div>
        ) : activeAlarm && !isBigScreen ? (
            <div className="shrink-0 z-50 flex items-center justify-center mx-4">
                <button 
                    onClick={() => handleAcknowledgeAlarm(activeAlarm.id)}
                    className={`flex items-center gap-3 px-6 py-2 rounded-lg shadow-lg border-2 transition transform hover:scale-105
                        ${activeAlarm.isAcknowledged 
                            ? 'bg-gray-800 border-gray-600 text-gray-400' 
                            : activeAlarm.category === AlarmCategory.TECHNICAL 
                                ? 'bg-cyan-900 border-cyan-500 text-cyan-100 animate-pulse' 
                                : 'bg-red-600 border-red-400 text-white animate-pulse'
                        }`}
                    title={activeAlarm.isAcknowledged ? "报警已确认 (静音)" : "点击确认报警 (消音)"}
                >
                    {activeAlarm.isAcknowledged ? <Activity size={20}/> : <AlertTriangle size={20} />}
                    <span className="font-bold text-lg whitespace-nowrap">
                        {activeAlarm.bedNumber} : {activeAlarm.message}
                    </span>
                    {activeAlarm.isAcknowledged && <span className="text-xs bg-black/20 px-1 rounded">ACK</span>}
                </button>
            </div>
        ) : null}

        {/* Right Section */}
        <div className="flex-1 flex items-center justify-end gap-6 min-w-0">
            
            {!isBigScreen && (
                <div className="hidden xl:flex items-center gap-2 text-sm text-gray-400 bg-gray-900 py-1 px-3 rounded-full border border-gray-800">
                    <UserCircle size={14} />
                    <span className="font-bold text-gray-300">{currentUser.name}</span>
                    <span className="text-xs bg-gray-800 px-1 rounded">{currentUser.role}</span>
                </div>
            )}
            
            <button 
                onClick={() => setSettings(s => ({ ...s, audioEnabled: !s.audioEnabled }))}
                className={`p-2 rounded-full border transition ${settings.audioEnabled ? 'bg-gray-800 text-blue-400 border-gray-700' : 'bg-red-900/20 text-red-400 border-red-800'}`}
                title={settings.audioEnabled ? "系统静音 (Mute All)" : "开启声音"}
            >
                {settings.audioEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>

            <button onClick={() => setSortByOccupancy(!sortByOccupancy)} className={`flex items-center gap-2 px-3 py-1.5 rounded border transition ${sortByOccupancy ? 'bg-blue-900/30 border-blue-800 text-blue-400' : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'}`} title={sortByOccupancy ? "当前: 有人床位优先" : "当前: 按床号排序"}>
                <ArrowDownUp size={18} /> <span className="hidden lg:inline text-xs font-bold">{sortByOccupancy ? "有人优先" : "床号排序"}</span>
            </button>

            <div className={`text-right font-mono hidden sm:block transition-all ${isBigScreen ? 'text-gray-100' : 'text-gray-300'}`}>
                <div className={`${isBigScreen ? 'text-4xl' : 'text-sm'} font-bold`}>{currentTime.toLocaleTimeString()}</div>
                {isBigScreen && <div className="text-sm text-gray-500 mt-1">{currentTime.toLocaleDateString()}</div>}
            </div>

            {!isBigScreen ? (
                <button onClick={() => { setIsBigScreen(true); setCurrentView(AppView.DASHBOARD); }} className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-blue-700 text-gray-300 hover:text-white rounded transition border border-gray-700" title="进入大屏墙模式">
                    <MonitorPlay size={18} /> <span className="hidden lg:inline text-xs font-bold">大屏模式</span>
                </button>
            ) : (
                <button onClick={() => setIsBigScreen(false)} className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 text-gray-500 hover:text-white rounded transition border border-gray-800" title="退出大屏模式 (ESC)">
                    <Minimize size={18} /> <span className="hidden lg:inline text-xs font-bold">退出 (ESC)</span>
                </button>
            )}
        </div>
    </header>
  );
};

export default Header;
