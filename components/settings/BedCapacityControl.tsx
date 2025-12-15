
import React, { useState, useEffect, useMemo } from 'react';
import { SystemSettings, Department } from '../../types';
import { Building2, AlertTriangle, Save, Edit2 } from 'lucide-react';

interface BedCapacityControlProps {
    settings: SystemSettings;
    onSaveCapacity: (capacity: number, bedLabels: Record<string, string>) => void;
    currentDepartment: Department;
}

const BedCapacityControl: React.FC<BedCapacityControlProps> = ({ settings, onSaveCapacity, currentDepartment }) => {
    const [pendingCapacity, setPendingCapacity] = useState(settings.deptCapacity[currentDepartment] || 16);
    const [isConfirmingCapacity, setIsConfirmingCapacity] = useState(false);

    // Bed Label Editing State
    const [editingBedNum, setEditingBedNum] = useState<string | null>(null);
    const [tempBedLabel, setTempBedLabel] = useState('');

    // Sync state if external settings change
    useEffect(() => {
        const currentCapacity = settings.deptCapacity[currentDepartment];
        setPendingCapacity(currentCapacity || 16);
        setIsConfirmingCapacity(false);
    }, [currentDepartment, settings.deptCapacity[currentDepartment]]);

    const handleApplyCapacityChange = () => {
        // Check if actually changed
        const currentCap = settings.deptCapacity[currentDepartment];
        if (pendingCapacity === currentCap) return;

        if (!isConfirmingCapacity) { setIsConfirmingCapacity(true); return; }

        const currentLabels = settings.bedLabels[currentDepartment] || {};
        onSaveCapacity(pendingCapacity, currentLabels);
        setIsConfirmingCapacity(false);
    };

    const handleStartEditBed = (bedNum: string, currentLabel: string) => {
        setEditingBedNum(bedNum);
        setTempBedLabel(currentLabel || bedNum);
    };

    const handleSaveBedLabel = () => {
        if (!editingBedNum) return;

        const currentLabels = JSON.parse(JSON.stringify(settings.bedLabels[currentDepartment] || {}));

        if (tempBedLabel && tempBedLabel !== editingBedNum) {
            currentLabels[editingBedNum] = tempBedLabel;
        } else {
            delete currentLabels[editingBedNum];
        }

        // Save via the same interface (since they are related bed configs)
        onSaveCapacity(pendingCapacity, currentLabels);
        setEditingBedNum(null);
    };

    const hasUnsavedChanges = pendingCapacity !== settings.deptCapacity[currentDepartment];
    const deptPrefix = 'Bed';

    // Generate Bed Grid for Visualization - 使用 useMemo 确保实时更新
    const bedGrid = useMemo(() => {
        const grid = [];
        for (let i = 1; i <= pendingCapacity; i++) {
            const bedNum = `${deptPrefix}-${String(i).padStart(2, '0')}`;
            const customLabel = settings.bedLabels?.[currentDepartment]?.[bedNum];
            grid.push({ bedNum, label: customLabel || bedNum });
        }
        return grid;
    }, [pendingCapacity, settings.bedLabels, currentDepartment]);

    return (
        <div className="bg-med-card border border-gray-700 rounded-xl p-6 shadow-lg flex flex-col gap-6 mb-8">
            <h3 className="text-xl font-semibold text-gray-100 border-b border-gray-700 pb-2 flex items-center gap-2">
                <Building2 size={20} className="text-blue-400" /> 科室与床位管理
            </h3>

            <div className="flex flex-col lg:flex-row gap-8 items-start">
                {/* Left: Capacity Slider */}
                <div className="w-full lg:w-1/3 bg-gray-800/50 p-6 rounded-lg border border-gray-700 relative">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-lg font-bold text-gray-200">{currentDepartment}</span>
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-500">容量:</span>
                            <span className={`text-xl px-3 py-1 rounded font-mono font-bold border text-center block min-w-[80px] transition-colors ${hasUnsavedChanges ? 'bg-yellow-900/30 text-yellow-400 border-yellow-700' : 'bg-gray-900 text-blue-400 border-gray-700'}`}>
                                {pendingCapacity} 床
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 mb-6">
                        <input type="range" min="4" max="60" step="1" value={pendingCapacity} onChange={(e) => { setPendingCapacity(parseInt(e.target.value)); setIsConfirmingCapacity(false); }} className="flex-1 h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400" />
                        <input type="number" min="4" max="60" value={pendingCapacity} onChange={(e) => { setPendingCapacity(Math.min(60, Math.max(4, parseInt(e.target.value) || 4))); setIsConfirmingCapacity(false); }} className="w-16 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-center font-mono text-white focus:border-blue-500 outline-none" />
                    </div>

                    <div className="flex justify-end items-center gap-4">
                        {isConfirmingCapacity && <span className="text-xs text-red-400 animate-pulse font-bold flex items-center gap-1"><AlertTriangle size={12} /> 确认修改?</span>}
                        <button type="button" onClick={() => { setPendingCapacity(settings.deptCapacity[currentDepartment]); setIsConfirmingCapacity(false); }} disabled={!hasUnsavedChanges} className="px-3 py-2 text-gray-500 hover:text-white text-xs font-bold disabled:opacity-30 transition">重置</button>
                        <button type="button" onClick={handleApplyCapacityChange} disabled={!hasUnsavedChanges && !isConfirmingCapacity} className={`px-4 py-2 rounded font-bold text-sm transition flex items-center gap-2 ${isConfirmingCapacity ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse' : 'bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white'}`}>
                            {isConfirmingCapacity ? <AlertTriangle size={16} /> : <Save size={16} />}
                            {isConfirmingCapacity ? '确认修改' : '应用更改'}
                        </button>
                    </div>
                </div>

                {/* Right: Bed Grid Visualization */}
                <div className="flex-1 w-full">
                    <div className="text-xs text-gray-500 mb-2 flex justify-between items-center">
                        <span>点击床位可修改显示名称 (如: VIP-1)</span>
                        <span className="text-gray-600">{bedGrid.length} 个床位</span>
                    </div>
                    <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 max-h-[300px] overflow-y-auto p-1 bg-gray-900/30 rounded border border-gray-700/50">
                        {bedGrid.map((bed) => (
                            <div
                                key={bed.bedNum}
                                onClick={() => handleStartEditBed(bed.bedNum, bed.label)}
                                className={`
                                relative p-2 rounded border text-center cursor-pointer transition group
                                ${editingBedNum === bed.bedNum ? 'bg-blue-900/40 border-blue-500' : 'bg-gray-800 border-gray-700 hover:border-gray-500'}
                            `}
                            >
                                {editingBedNum === bed.bedNum ? (
                                    <div className="flex flex-col gap-1" onClick={e => e.stopPropagation()}>
                                        <input
                                            autoFocus
                                            type="text"
                                            value={tempBedLabel}
                                            onChange={e => setTempBedLabel(e.target.value)}
                                            className="w-full bg-black/50 border border-blue-500 rounded px-1 text-xs text-white text-center outline-none"
                                            onKeyDown={e => { if (e.key === 'Enter') handleSaveBedLabel(); if (e.key === 'Escape') setEditingBedNum(null); }}
                                            onBlur={handleSaveBedLabel}
                                        />
                                    </div>
                                ) : (
                                    <>
                                        <div className={`text-sm font-bold truncate ${bed.label !== bed.bedNum ? 'text-blue-400' : 'text-gray-300'}`}>
                                            {bed.label}
                                        </div>
                                        {bed.label !== bed.bedNum && (
                                            <div className="text-[10px] text-gray-600 font-mono">{bed.bedNum}</div>
                                        )}
                                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100">
                                            <Edit2 size={10} className="text-gray-500" />
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BedCapacityControl;
