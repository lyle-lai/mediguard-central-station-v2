
// components/settings/AlarmConfigTab.tsx

import React, { useState, useEffect } from 'react';
import { AlarmThresholdItem, AlarmPriority, DeviceDisplayConfig } from '../../types';
import { BellRing, Moon, Sun, Clock, Trash2, Save, RotateCcw, AlertTriangle } from 'lucide-react';

interface AlarmConfigTabProps {
    thresholds: AlarmThresholdItem[]; // Department-specific
    config?: DeviceDisplayConfig; // For syncing params
    onSave: (newThresholds: AlarmThresholdItem[]) => void;
    nightMode: boolean;
    onToggleNightMode: () => void;
}

const AlarmConfigTab: React.FC<AlarmConfigTabProps> = ({ thresholds, config, onSave, nightMode, onToggleNightMode }) => {

    const [localThresholds, setLocalThresholds] = useState<AlarmThresholdItem[]>(() => JSON.parse(JSON.stringify(thresholds)));
    const [isDirty, setIsDirty] = useState(false);

    // SYNC LOGIC: Merge existing rules with parameters defined in DeviceConfigs
    useEffect(() => {
        if (!isDirty) {
            const currentRules = JSON.parse(JSON.stringify(thresholds));

            // Gather all unique parameters from ALL devices in THIS department's config
            const definedParams = new Map<string, string>(); // id -> label
            if (config) {
                // Fix: Explicitly cast deviceConfig to any to avoid "property 'parameters' does not exist on type 'unknown'" error
                Object.values(config).forEach((deviceConfig: any) => {
                    if (deviceConfig && deviceConfig.parameters) {
                        deviceConfig.parameters.forEach((p: any) => {
                            if (!definedParams.has(p.id)) {
                                definedParams.set(p.id, p.label);
                            }
                        });
                    }
                });
            }

            // Sync: Add missing rules & Update labels
            const syncedRules: AlarmThresholdItem[] = [...currentRules];

            syncedRules.forEach(rule => {
                if (definedParams.has(rule.paramId)) {
                    rule.label = definedParams.get(rule.paramId)!;
                }
            });

            definedParams.forEach((label, id) => {
                if (!syncedRules.some(r => r.paramId === id)) {
                    syncedRules.push({
                        paramId: id,
                        label: label,
                        min: undefined,
                        max: undefined,
                        delay: 5,
                        priority: AlarmPriority.WARNING,
                        enabled: false
                    });
                }
            });

            setLocalThresholds(syncedRules);
        }
    }, [thresholds, config, isDirty]);

    const handleSave = () => {
        onSave(localThresholds);
        setIsDirty(false);
    };

    const handleReset = () => {
        setIsDirty(false);
    };

    const handleAlarmChange = (index: number, field: keyof AlarmThresholdItem, value: any) => {
        const newThresholds = [...localThresholds];
        if (newThresholds[index]) {
            newThresholds[index] = { ...newThresholds[index], [field]: value };
            setLocalThresholds(newThresholds);
            setIsDirty(true);
        }
    };

    const handleDeleteAlarmRule = (index: number) => {
        const newThresholds = [...localThresholds];
        newThresholds.splice(index, 1);
        setLocalThresholds(newThresholds);
        setIsDirty(true);
    };

    return (
        <div className="flex-1 p-6 bg-med-card relative flex flex-col h-full">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h4 className="text-lg font-bold text-white flex items-center gap-2"><BellRing size={18} className="text-med-alert" /> 全局告警阈值配置</h4>
                    <p className="text-xs text-gray-500 mt-1">设置生理参数的上下限及触发延迟。规则引擎将根据此配置实时监测当前科室所有床位。</p>
                </div>
                <div className="flex items-center gap-3 bg-gray-900 p-2 rounded-lg border border-gray-800">
                    <span className="text-xs text-gray-400 font-bold flex items-center gap-1">
                        {nightMode ? <Moon size={14} className="text-blue-400" /> : <Sun size={14} className="text-yellow-400" />}
                        夜间模式
                    </span>
                    <button
                        type="button"
                        onClick={onToggleNightMode}
                        className={`relative w-10 h-5 rounded-full transition-colors ${nightMode ? 'bg-blue-600' : 'bg-gray-700'}`}
                    >
                        <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full shadow transition-transform ${nightMode ? 'translate-x-5' : 'translate-x-0'}`}></div>
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto mb-16 custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-900 text-gray-500 text-xs uppercase font-bold sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="p-3 rounded-tl-lg">启用</th>
                            <th className="p-3">参数名称 (ID)</th>
                            <th className="p-3">上限 (High)</th>
                            <th className="p-3">下限 (Low)</th>
                            <th className="p-3">延迟 (Delay)</th>
                            <th className="p-3">优先级</th>
                            <th className="p-3 rounded-tr-lg">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800 text-sm">
                        {localThresholds.map((rule, idx) => (
                            <tr key={rule.paramId} className="hover:bg-gray-800/50 transition group">
                                <td className="p-3">
                                    <input
                                        type="checkbox"
                                        checked={rule.enabled}
                                        onChange={e => handleAlarmChange(idx, 'enabled', e.target.checked)}
                                        className="rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-0 cursor-pointer"
                                    />
                                </td>
                                <td className="p-3 font-bold text-gray-300">
                                    {rule.label}
                                    <div className="text-[10px] text-gray-600 font-mono">{rule.paramId}</div>
                                </td>
                                <td className="p-3">
                                    <input type="number" value={rule.max ?? ''} onChange={e => handleAlarmChange(idx, 'max', parseFloat(e.target.value))} className="w-16 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white text-center focus:border-blue-500 outline-none focus:ring-1 focus:ring-blue-500" />
                                </td>
                                <td className="p-3">
                                    <input type="number" value={rule.min ?? ''} onChange={e => handleAlarmChange(idx, 'min', parseFloat(e.target.value))} className="w-16 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white text-center focus:border-blue-500 outline-none focus:ring-1 focus:ring-blue-500" />
                                </td>
                                <td className="p-3">
                                    <div className="flex items-center gap-2">
                                        <Clock size={14} className="text-gray-500" />
                                        <input type="number" value={rule.delay} onChange={e => handleAlarmChange(idx, 'delay', parseFloat(e.target.value))} className="w-12 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white text-center focus:border-blue-500 outline-none focus:ring-1 focus:ring-blue-500" />
                                        <span className="text-xs text-gray-500">秒</span>
                                    </div>
                                </td>
                                <td className="p-3">
                                    <select
                                        value={rule.priority}
                                        onChange={e => handleAlarmChange(idx, 'priority', e.target.value)}
                                        className={`bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs font-bold outline-none cursor-pointer ${rule.priority === AlarmPriority.CRITICAL ? 'text-red-400' : rule.priority === AlarmPriority.WARNING ? 'text-yellow-400' : 'text-blue-400'}`}
                                    >
                                        <option value={AlarmPriority.CRITICAL}>CRITICAL (危急)</option>
                                        <option value={AlarmPriority.WARNING}>WARNING (警告)</option>
                                        <option value={AlarmPriority.NORMAL}>NORMAL (提示)</option>
                                    </select>
                                </td>
                                <td className="p-3">
                                    <button type="button" onClick={() => handleDeleteAlarmRule(idx)} className="text-gray-500 hover:text-red-400 p-1.5 rounded hover:bg-red-900/20 transition opacity-0 group-hover:opacity-100" title="删除规则"><Trash2 size={16} /></button>
                                </td>
                            </tr>
                        ))}
                        {localThresholds.length === 0 && (
                            <tr>
                                <td colSpan={7} className="p-8 text-center text-gray-500 italic">
                                    暂无告警策略。请在“参数”页签中添加参数，系统将自动生成对应规则。
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* SAVE BAR */}
            <div className={`absolute bottom-0 left-0 right-0 p-4 bg-gray-900/90 border-t border-gray-800 backdrop-blur-sm flex justify-between items-center transition-transform duration-300 ${isDirty ? 'translate-y-0' : 'translate-y-full'}`}>
                <div className="flex items-center gap-2 text-yellow-500 text-sm font-bold animate-pulse">
                    <AlertTriangle size={16} /> 有未保存的修改
                </div>
                <div className="flex gap-3">
                    <button type="button" onClick={handleReset} className="px-4 py-2 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-bold flex items-center gap-2 border border-gray-700 transition">
                        <RotateCcw size={16} /> 重置
                    </button>
                    <button type="button" onClick={handleSave} className="px-6 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-900/20 transition">
                        <Save size={16} /> 保存配置
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AlarmConfigTab;
