
import React, { useState, useMemo, useEffect } from 'react';
import { PatientData, SystemSettings, Department, VitalStatus } from '../../types';
import PatientCard from '../PatientCard';
import EmptyBedCard from '../EmptyBedCard';
import { Server, Wifi, AlertTriangle } from 'lucide-react';

interface DashboardViewProps {
    patients: PatientData[];
    settings: SystemSettings;
    selectedDepartment: Department;
    isBigScreen: boolean;
    sortByOccupancy: boolean;
    onSetSelectedPatient: (patient: PatientData) => void;
    onSetConfig: (patient: PatientData) => void;
    onAddPatient: (bedNum: string) => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({
    patients,
    settings,
    selectedDepartment,
    isBigScreen,
    sortByOccupancy,
    onSetSelectedPatient,
    onSetConfig,
    onAddPatient
}) => {
    const [currentPage, setCurrentPage] = useState(1);

    // Reset page when context changes
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedDepartment, settings.filterType, settings.layoutMode, sortByOccupancy]);

    // --- Grid & Slot Calculation Logic ---
    const currentDeptCapacity = settings.deptCapacity[selectedDepartment] || 16;
    const currentBedLabels = settings.bedLabels?.[selectedDepartment] || {};

    const rawSlots = useMemo(() => {
        const slots: { bedNum: string, bedLabel?: string, patient?: PatientData }[] = [];
        for (let i = 1; i <= currentDeptCapacity; i++) {
            const bedNum = `Bed-${String(i).padStart(2, '0')}`;
            const patient = patients.find(p => p.bedNumber === bedNum);
            const customLabel = currentBedLabels[bedNum];
            slots.push({ bedNum, bedLabel: customLabel, patient });
        }

        if (sortByOccupancy) {
            slots.sort((a, b) => {
                const hasA = !!a.patient;
                const hasB = !!b.patient;
                if (hasA && !hasB) return -1;
                if (!hasA && hasB) return 1;
                return a.bedNum.localeCompare(b.bedNum);
            });
        }
        return slots;
    }, [currentDeptCapacity, currentBedLabels, patients, sortByOccupancy, settings.deptCapacity, settings.bedLabels, selectedDepartment]);

    // --- Layout Config ---
    const layoutConfig = useMemo(() => {
        switch (settings.layoutMode) {
            case 'compact': return { cols: 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6', rows: 'grid-rows-4', pageSize: 24 };
            case 'large': return { cols: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3', rows: 'grid-rows-2', pageSize: 6 };
            case 'standard': default: return { cols: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4', rows: 'grid-rows-3', pageSize: 12 };
        }
    }, [settings.layoutMode]);

    // --- Pagination Logic ---
    const totalPages = Math.ceil(rawSlots.length / layoutConfig.pageSize) || 1;
    const alarmingPages = new Set<number>();
    const offScreenAlarmBeds: string[] = [];

    // Pre-calculate alarms to show indicators on pagination
    rawSlots.forEach((slot, index) => {
        const pageIndex = Math.floor(index / layoutConfig.pageSize) + 1;
        if (slot.patient && (slot.patient.status === VitalStatus.CRITICAL || slot.patient.status === VitalStatus.WARNING)) {
            alarmingPages.add(pageIndex);
            if (pageIndex !== currentPage) {
                offScreenAlarmBeds.push(slot.bedLabel || slot.bedNum);
            }
        }
    });

    const visibleSlots = isBigScreen
        ? rawSlots.slice((currentPage - 1) * layoutConfig.pageSize, currentPage * layoutConfig.pageSize)
        : rawSlots;

    return (
        <>
            <div className={`flex-1 ${isBigScreen ? 'p-2 overflow-hidden' : 'p-2 md:p-4 overflow-y-auto custom-scrollbar'}`}>
                <div className={`grid gap-2 transition-all duration-300 ${isBigScreen ? 'h-full w-full content-stretch' : 'pb-20'} ${layoutConfig.cols} ${isBigScreen ? layoutConfig.rows : ''}`}>
                    {visibleSlots.map((slot) => {
                        const { bedNum, bedLabel, patient } = slot;

                        if (patient) {
                            const matchesFilter = settings.filterType === 'ALL' || patient.connectedDevices.includes(settings.filterType);
                            if (!matchesFilter) return null;

                            const deptConfig = settings.deviceConfigs[patient.department];
                            const deviceConfig = settings.filterType !== 'ALL' ? deptConfig?.[settings.filterType] : deptConfig?.[patient.deviceType];

                            return (
                                <PatientCard
                                    key={patient.id}
                                    patient={patient}
                                    bedLabel={bedLabel}
                                    deviceConfig={deviceConfig}
                                    onClick={onSetSelectedPatient}
                                    onOpenConfig={onSetConfig}
                                    compact={settings.layoutMode === 'compact'}
                                    stretch={isBigScreen}
                                />
                            );
                        } else {
                            return settings.filterType === 'ALL' ? (
                                <EmptyBedCard
                                    key={`empty-${bedNum}`}
                                    bedNumber={bedNum}
                                    bedLabel={bedLabel}
                                    onClick={() => onAddPatient(bedNum)}
                                    compact={settings.layoutMode === 'compact'}
                                    stretch={isBigScreen}
                                />
                            ) : null;
                        }
                    })}
                </div>
            </div>

            {/* Big Screen Footer / Pagination */}
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
                                const hasAlarm = alarmingPages.has(p);
                                const isCurrent = currentPage === p;
                                return (
                                    <button
                                        key={p}
                                        onClick={() => setCurrentPage(Math.min(Math.max(1, p), totalPages))}
                                        className={`w-8 h-8 rounded flex items-center justify-center font-bold text-sm transition-all relative ${isCurrent ? 'bg-blue-600 text-white border border-blue-500' : 'bg-gray-900 text-gray-500 border border-gray-800 hover:bg-gray-800 hover:text-gray-300'} ${hasAlarm && !isCurrent ? 'border-red-600 bg-red-900/20 text-red-500 animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.5)]' : ''}`}
                                    >
                                        {p}
                                        {hasAlarm && !isCurrent && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-600 rounded-full border border-black"></span>}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default DashboardView;
