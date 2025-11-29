
// components/settings/DeviceConfigTab.tsx

import React, { useState, useEffect } from 'react';
import { DeviceType, WaveformConfig, ParameterConfig, DeviceTypeDesc, AlarmPriority, AlarmThresholdItem, DeviceDisplayConfig } from '../../types';
import { Plus, X, ArrowUp, ArrowDown, Trash2, Save, RotateCcw, AlertTriangle } from 'lucide-react';

interface DeviceConfigTabProps {
    config: DeviceDisplayConfig; // Department-specific config
    // Updated callbacks to support separation
    onSaveWaveforms: (deviceType: DeviceType, waveforms: WaveformConfig[]) => void;
    onSaveParameters: (deviceType: DeviceType, parameters: ParameterConfig[]) => void;
    activeTab: 'waveforms' | 'parameters';
    editingDevice: DeviceType;
    setEditingDevice: (d: DeviceType) => void;
}

const DeviceConfigTab: React.FC<DeviceConfigTabProps> = ({ config, onSaveWaveforms, onSaveParameters, activeTab, editingDevice, setEditingDevice }) => {
    const [showAddForm, setShowAddForm] = useState(false);
    const [newItemId, setNewItemId] = useState('');
    const [newItemLabel, setNewItemLabel] = useState('');
    const [newItemMeta, setNewItemMeta] = useState('');

    // Local State for Editing (Buffer)
    const [localDeviceConfigs, setLocalDeviceConfigs] = useState<DeviceDisplayConfig | null>(() => config ? JSON.parse(JSON.stringify(config)) : null);
    const [isDirty, setIsDirty] = useState(false);

    // Sync with parent prop if it changes externally
    useEffect(() => {
        if (!isDirty && config) {
            setLocalDeviceConfigs(JSON.parse(JSON.stringify(config)));
        }
    }, [config, isDirty]);

    if (!config || !localDeviceConfigs) {
        return <div className="p-8 text-center text-gray-500">正在加载配置或配置不存在...</div>;
    }

    const handleSave = () => {
        if (!localDeviceConfigs) return;

        // Strict Mode: Only save the configuration for the CURRENTLY selected device and CURRENT active tab.
        // This prevents overwriting other devices' configs or overwriting parameters when viewing waveforms (and vice-versa).

        const currentDeviceConfig = localDeviceConfigs[editingDevice];

        if (activeTab === 'waveforms') {
            onSaveWaveforms(editingDevice, currentDeviceConfig.waveforms);
        } else if (activeTab === 'parameters') {
            onSaveParameters(editingDevice, currentDeviceConfig.parameters);
        }

        setIsDirty(false);
    };

    const handleReset = () => {
        if (!config) return;
        setLocalDeviceConfigs(JSON.parse(JSON.stringify(config)));
        setIsDirty(false);
    };

    // --- Handlers operate on LOCAL state ---

    const handleToggleVisibility = (id: string) => {
        if (!localDeviceConfigs) return;
        const newConfigs = JSON.parse(JSON.stringify(localDeviceConfigs));
        const targetConfig = newConfigs[editingDevice];
        const list = activeTab === 'waveforms' ? targetConfig.waveforms : targetConfig.parameters;

        const item = list.find((i: any) => i.id === id);
        if (item) item.visible = !item.visible;

        setLocalDeviceConfigs(newConfigs);
        setIsDirty(true);
    };

    const handleMove = (index: number, direction: 'up' | 'down') => {
        if (!localDeviceConfigs) return;
        const newConfigs = JSON.parse(JSON.stringify(localDeviceConfigs));
        const targetConfig = newConfigs[editingDevice];
        const list: any[] = activeTab === 'waveforms' ? targetConfig.waveforms : targetConfig.parameters;

        // Sort by current order first
        list.sort((a, b) => (a.order || 0) - (b.order || 0));

        // Normalize orders
        list.forEach((item, i) => { item.order = i + 1; });

        if (direction === 'up') {
            if (index === 0) return;
            const prevOrder = list[index - 1].order;
            list[index - 1].order = list[index].order;
            list[index].order = prevOrder;
        } else {
            if (index === list.length - 1) return;
            const nextOrder = list[index + 1].order;
            list[index + 1].order = list[index].order;
            list[index].order = nextOrder;
        }
        setLocalDeviceConfigs(newConfigs);
        setIsDirty(true);
    };

    const handleAddItem = () => {
        if (!localDeviceConfigs) return;
        if (!newItemLabel.trim() || !newItemId.trim()) { alert("请输入ID和名称"); return; }
        const id = newItemId.trim();

        const newConfigs = JSON.parse(JSON.stringify(localDeviceConfigs));
        const targetConfig = newConfigs[editingDevice];
        const list: any[] = activeTab === 'waveforms' ? targetConfig.waveforms : targetConfig.parameters;

        if (list.some(item => item.id === id)) { alert("ID 已存在"); return; }

        const maxOrder = Math.max(...list.map(i => i.order || 0), 0);
        const newOrder = maxOrder + 1;

        if (activeTab === 'waveforms') {
            const newItem: WaveformConfig = { id, label: newItemLabel, color: newItemMeta || '#ffffff', visible: true, order: newOrder };
            targetConfig.waveforms.push(newItem);
        } else {
            const newItem: ParameterConfig = { id, label: newItemLabel, unit: newItemMeta || '', visible: true, order: newOrder };
            targetConfig.parameters.push(newItem);
        }

        setLocalDeviceConfigs(newConfigs);
        setIsDirty(true);
        setNewItemLabel(''); setNewItemMeta(''); setNewItemId(''); setShowAddForm(false);
    };

    const handleDeleteItem = (id: string) => {
        if (!localDeviceConfigs) return;
        const newConfigs = JSON.parse(JSON.stringify(localDeviceConfigs));
        const targetConfig = newConfigs[editingDevice];

        if (activeTab === 'waveforms') {
            targetConfig.waveforms = targetConfig.waveforms.filter((i: any) => i.id !== id);
        } else {
            targetConfig.parameters = targetConfig.parameters.filter((i: any) => i.id !== id);
        }

        setLocalDeviceConfigs(newConfigs);
        setIsDirty(true);
    };

    const currentDevice = localDeviceConfigs[editingDevice];
    const displayList = activeTab === 'waveforms' ? currentDevice.waveforms : currentDevice.parameters;
    const sortedDisplayList = [...displayList].sort((a, b) => (a.order || 0) - (b.order || 0));

    return (
        <>
            <div className="w-full lg:w-48 border-r border-gray-700 bg-gray-900/50 p-3 flex flex-col gap-1">
                <div className="text-[10px] font-bold text-gray-500 uppercase mb-2 px-2">设备类型</div>
                {Object.values(DeviceType).map(type => (<button type="button" key={type} onClick={() => setEditingDevice(type)} className={`text-left px-3 py-2 rounded-md text-sm font-medium transition-all ${editingDevice === type ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>{DeviceTypeDesc[type]}</button>))}
            </div>
            <div className="flex-1 flex flex-col md:flex-row bg-med-card p-6 gap-8 relative">
                <div className="flex-1 mb-16">
                    <div className="text-gray-500 text-sm mb-4 flex justify-between items-center">
                        <span>配置 {DeviceTypeDesc[editingDevice]} 的{activeTab === 'waveforms' ? '波形' : '参数'}显示顺序与可见性。</span>
                        <button type="button" onClick={() => setShowAddForm(true)} className="text-xs bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded border border-gray-600 flex items-center gap-1"><Plus size={12} /> 新增自定义项</button>
                    </div>
                    {showAddForm && (
                        <div className="mb-4 p-4 bg-gray-800/80 border border-blue-900/50 rounded-lg animate-in slide-in-from-top-2">
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="text-xs font-bold text-blue-400 uppercase">新增{activeTab === 'waveforms' ? '波形' : '参数'}</h4>
                                <button type="button" onClick={() => setShowAddForm(false)}><X size={14} className="text-gray-500 hover:text-white" /></button>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="text-[10px] text-gray-500 block mb-1">ID (唯一标识)</label>
                                    <input type="text" value={newItemId} onChange={e => setNewItemId(e.target.value)} placeholder="如: bis" className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs text-white" />
                                </div>
                                <div>
                                    <label className="text-[10px] text-gray-500 block mb-1">显示名称</label>
                                    <input type="text" value={newItemLabel} onChange={e => setNewItemLabel(e.target.value)} placeholder="如: 脑电双频" className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs text-white" />
                                </div>
                                <div>
                                    <label className="text-[10px] text-gray-500 block mb-1">{activeTab === 'waveforms' ? '颜色 (Hex)' : '单位'}</label>
                                    <div className="flex gap-1">
                                        {activeTab === 'waveforms' ? (
                                            <div className="flex items-center gap-1 w-full">
                                                <input type="color" value={newItemMeta || '#ffffff'} onChange={e => setNewItemMeta(e.target.value)} className="h-6 w-8 bg-transparent border-none p-0 cursor-pointer" />
                                                <input type="text" value={newItemMeta} onChange={e => setNewItemMeta(e.target.value)} placeholder="#ffffff" className="flex-1 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs text-white" />
                                            </div>
                                        ) : (
                                            <input type="text" value={newItemMeta} onChange={e => setNewItemMeta(e.target.value)} placeholder="如: %" className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs text-white" />
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="mt-3 flex justify-end">
                                <button type="button" onClick={handleAddItem} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded transition">确认添加</button>
                            </div>
                        </div>
                    )}
                    <div className="bg-gray-900/30 rounded-lg p-1 space-y-1 border border-gray-800/50 overflow-y-auto max-h-[500px]">
                        {sortedDisplayList.map((c, idx) => (
                            <div key={`${c.id}-${idx}`} className={`flex items-center justify-between p-2 rounded border transition group ${c.visible ? 'bg-gray-800 border-gray-600' : 'bg-gray-900/50 border-gray-800 opacity-60'}`}>
                                <div className="flex items-center gap-3">
                                    <div className="text-xs font-mono text-gray-500 w-4 text-center">{idx + 1}</div>
                                    <div className="w-4 h-4 rounded cursor-pointer flex items-center justify-center border border-gray-600 bg-gray-900" onClick={() => handleToggleVisibility(c.id)}>
                                        {c.visible ? <div className="w-2.5 h-2.5 bg-blue-500 rounded-sm"></div> : null}
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-gray-200 flex items-center gap-2">
                                            {c.label}
                                            {activeTab === 'waveforms' && <div className="w-3 h-3 rounded-full" style={{ backgroundColor: (c as any).color }}></div>}
                                        </div>
                                        <div className="text-[10px] font-mono text-gray-500 flex gap-2">
                                            ID: {c.id}
                                            {activeTab === 'parameters' && (c as any).unit && <span className="bg-gray-700 px-1 rounded text-gray-300">{(c as any).unit}</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button type="button" onClick={() => handleMove(idx, 'up')} disabled={idx === 0} className="p-1 hover:bg-gray-600 rounded disabled:opacity-20"><ArrowUp size={14} /></button>
                                    <button type="button" onClick={() => handleMove(idx, 'down')} disabled={idx === sortedDisplayList.length - 1} className="p-1 hover:bg-gray-600 rounded disabled:opacity-20"><ArrowDown size={14} /></button>
                                    <button type="button" onClick={() => handleDeleteItem(c.id)} className="ml-2 p-1 hover:bg-red-900/30 text-gray-500 hover:text-red-400 rounded" title="删除"><Trash2 size={14} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={`absolute bottom-0 left-0 right-0 p-4 bg-gray-900/90 border-t border-gray-800 backdrop-blur-sm flex justify-between items-center transition-transform duration-300 ${isDirty ? 'translate-y-0' : 'translate-y-full'}`}>
                    <div className="flex items-center gap-2 text-yellow-500 text-sm font-bold animate-pulse">
                        <AlertTriangle size={16} /> 有未保存的修改
                    </div>
                    <div className="flex gap-3">
                        <button type="button" onClick={handleReset} className="px-4 py-2 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-bold flex items-center gap-2 border border-gray-700 transition">
                            <RotateCcw size={16} /> 重置
                        </button>
                        <button type="button" onClick={handleSave} className="px-6 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-900/20 transition">
                            <Save size={16} /> 保存当前页
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default DeviceConfigTab;
