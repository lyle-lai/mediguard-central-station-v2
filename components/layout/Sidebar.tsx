
import React from 'react';
import { AppView, Department, SystemSettings, User, DepartmentDesc, UserRole } from '../../types';
import { Building2, ChevronDown, LayoutGrid, Users, Bell, Settings, LogOut, Shield } from 'lucide-react';

interface SidebarProps {
    currentUser: User;
    currentView: AppView;
    setCurrentView: (view: AppView) => void;
    selectedDepartment: Department;
    setSelectedDepartment: (dept: Department) => void;
    isDeptMenuOpen: boolean;
    setIsDeptMenuOpen: (open: boolean) => void;
    handleLogout: () => void;
    settings: SystemSettings;
    activeAlarmsCount: number;
}

const Sidebar: React.FC<SidebarProps> = ({
    currentUser,
    currentView,
    setCurrentView,
    selectedDepartment,
    setSelectedDepartment,
    isDeptMenuOpen,
    setIsDeptMenuOpen,
    handleLogout,
    settings,
    activeAlarmsCount
}) => {
    // Logic to check if user can switch department
    const canSwitchDepartment = currentUser.departments && currentUser.departments.length > 1;

    return (
        <aside className="w-16 flex flex-col items-center bg-med-card border-r border-gray-800 py-4 z-40 shrink-0 relative transition-all duration-300">
            <div className="mb-8 relative group mt-4">

                <button
                    onClick={() => canSwitchDepartment && setIsDeptMenuOpen(!isDeptMenuOpen)}
                    className={`p-2 rounded-lg shadow-lg transition relative 
                ${canSwitchDepartment
                            ? 'bg-blue-600 shadow-blue-500/20 hover:bg-blue-500 cursor-pointer'
                            : 'bg-gray-800 border border-gray-700 cursor-default'}`}
                    title={`当前科室: ${DepartmentDesc[selectedDepartment] || selectedDepartment}`}
                >
                    <Building2 className={canSwitchDepartment ? "text-white" : "text-gray-400"} size={24} />
                    {canSwitchDepartment && (
                        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                            <ChevronDown size={8} className="text-blue-600" />
                        </div>
                    )}
                </button>

                {canSwitchDepartment && isDeptMenuOpen && (
                    <div className="absolute left-16 ml-2 top-0 w-56 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
                        <div className="p-3 bg-gray-950 text-xs font-bold text-gray-400 uppercase border-b border-gray-800 tracking-wider">切换监护科室</div>
                        {(currentUser.departments || []).map(dept => (
                            <button
                                key={dept.code}
                                onClick={() => {
                                    setSelectedDepartment(dept.code);
                                    setIsDeptMenuOpen(false);
                                    setCurrentView(AppView.DASHBOARD);
                                }}
                                className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-800 transition border-l-4 ${selectedDepartment === dept.code ? 'bg-blue-900/20 text-blue-400 font-bold border-blue-500' : 'text-gray-300 border-transparent'}`}
                            >
                                <div className="flex justify-between">
                                    <span>{dept.name}</span>
                                    <span className="text-xs bg-gray-800 px-1.5 py-0.5 rounded text-gray-500">
                                        {dept.capacity ?? settings.deptCapacity[dept.code]}床
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
                {isDeptMenuOpen && <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsDeptMenuOpen(false)}></div>}
            </div>

            <nav className="flex flex-col gap-6 w-full">
                <button onClick={() => setCurrentView(AppView.DASHBOARD)} className={`h-12 w-full flex justify-center items-center transition relative ${currentView === AppView.DASHBOARD ? 'text-blue-400 bg-blue-400/10' : 'text-gray-500 hover:text-gray-300'}`} title="监护概览">
                    {currentView === AppView.DASHBOARD && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-400"></div>}
                    <LayoutGrid size={24} />
                </button>

                <button onClick={() => setCurrentView(AppView.PATIENTS)} className={`h-12 w-full flex justify-center items-center transition relative ${currentView === AppView.PATIENTS ? 'text-blue-400 bg-blue-400/10' : 'text-gray-500 hover:text-gray-300'}`} title="患者管理">
                    {currentView === AppView.PATIENTS && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-400"></div>}
                    <Users size={24} />
                </button>

                <button onClick={() => setCurrentView(AppView.ALARMS)} className={`h-12 w-full flex justify-center items-center transition relative ${currentView === AppView.ALARMS ? 'text-blue-400 bg-blue-400/10' : 'text-gray-500 hover:text-gray-300'}`} title="报警记录">
                    {currentView === AppView.ALARMS && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-400"></div>}
                    <div className="relative">
                        <Bell size={24} className={activeAlarmsCount > 0 && currentView !== AppView.ALARMS ? 'text-red-500 animate-pulse' : ''} />
                        {activeAlarmsCount > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>}
                    </div>
                </button>

                <button onClick={() => setCurrentView(AppView.SETTINGS)} className={`h-12 w-full flex justify-center items-center transition relative ${currentView === AppView.SETTINGS ? 'text-blue-400 bg-blue-400/10' : 'text-gray-500 hover:text-gray-300'}`} title="系统设置">
                    {currentView === AppView.SETTINGS && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-400"></div>}
                    <Settings size={24} />
                </button>

                {currentUser.role === UserRole.ADMIN && (
                    <button onClick={() => setCurrentView(AppView.ADMIN)} className={`h-12 w-full flex justify-center items-center transition relative ${currentView === AppView.ADMIN ? 'text-purple-400 bg-purple-400/10' : 'text-gray-500 hover:text-gray-300'}`} title="后台管理">
                        {currentView === AppView.ADMIN && <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-400"></div>}
                        <Shield size={24} />
                    </button>
                )}
            </nav>

            <div className="mt-auto mb-4 w-full flex justify-center">
                <button onClick={handleLogout} className="h-12 w-full flex justify-center items-center text-gray-500 hover:text-red-400 hover:bg-red-900/10 transition" title="退出登录">
                    <LogOut size={20} />
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
