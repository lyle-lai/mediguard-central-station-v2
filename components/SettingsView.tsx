
import React, { useState } from 'react';
import { SystemSettings, DeviceType, Department, User, DeviceDisplayConfig, AlarmThresholdItem, WaveformConfig, ParameterConfig, DepartmentPreferences } from '../types';
import { Activity, Settings as SettingsIcon, Hash, BellRing } from 'lucide-react';
import SimulationControl from './settings/SimulationControl';
import BedCapacityControl from './settings/BedCapacityControl';
import DeviceConfigTab from './settings/DeviceConfigTab';
import AlarmConfigTab from './settings/AlarmConfigTab';

interface SettingsViewProps {
  settings: SystemSettings;
  onUpdate: (newSettings: SystemSettings) => void;
  // New specific save handlers
  onSaveCapacity: (capacity: number, bedLabels: Record<string, string>) => void;
  onSaveDeviceConfig?: any; // Deprecated prop
  onSaveWaveforms: (deviceType: DeviceType, waveforms: WaveformConfig[]) => void;
  onSaveParameters: (deviceType: DeviceType, parameters: ParameterConfig[]) => void;
  onSaveAlarms: (thresholds: AlarmThresholdItem[]) => void;
  onSavePreferences: (prefs: Partial<DepartmentPreferences>) => void; // New handler
  onTriggerAlarm?: () => void;
  currentUser: User;
  currentDepartment: Department;
}

const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdate,
  onSaveCapacity,
  onSaveWaveforms,
  onSaveParameters,
  onSaveAlarms,
  onSavePreferences,
  onTriggerAlarm,
  currentDepartment
}) => {
  const [editingDevice, setEditingDevice] = useState<DeviceType>(DeviceType.MONITOR);
  const [activeTab, setActiveTab] = useState<'waveforms' | 'parameters' | 'alarms'>('waveforms');

  // Extract Department-Specific Configs
  const currentDeptDeviceConfig = settings.deviceConfigs[currentDepartment];
  const currentDeptAlarmThresholds = settings.alarmThresholds[currentDepartment];

  return (
    <div className="flex-1 p-6 md:p-8 bg-med-bg text-gray-200 overflow-y-auto">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
        <div className="p-2 bg-gray-800 rounded-lg"><SettingsIcon size={24} /></div>
        系统全局配置
      </h2>

      <div className="flex flex-col gap-8 w-full max-w-none">
        <SimulationControl
          settings={settings}
          onUpdate={onUpdate}
          onSavePreferences={onSavePreferences}
          onTriggerAlarm={onTriggerAlarm}
        />

        <div className="bg-med-card border border-gray-700 rounded-xl overflow-hidden shadow-lg flex flex-col">
          <div className="p-6 border-b border-gray-700 bg-gray-800/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div><h3 className="text-xl font-semibold text-gray-100 flex items-center gap-2"><Activity size={20} className="text-blue-400" /> 设备与告警配置 ({currentDepartment})</h3></div>
            <div className="flex p-1 bg-gray-900 rounded-lg border border-gray-700">
              <button type="button" onClick={() => setActiveTab('waveforms')} className={`px-4 py-2 rounded text-sm font-bold flex items-center gap-2 transition ${activeTab === 'waveforms' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}><Activity size={16} /> 波形</button>
              <button type="button" onClick={() => setActiveTab('parameters')} className={`px-4 py-2 rounded text-sm font-bold flex items-center gap-2 transition ${activeTab === 'parameters' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}><Hash size={16} /> 参数</button>
              <button type="button" onClick={() => setActiveTab('alarms')} className={`px-4 py-2 rounded text-sm font-bold flex items-center gap-2 transition ${activeTab === 'alarms' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}><BellRing size={16} /> 告警策略</button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row min-h-[400px]">
            {activeTab !== 'alarms' ? (
              <DeviceConfigTab
                config={currentDeptDeviceConfig}
                onSaveWaveforms={onSaveWaveforms}
                onSaveParameters={onSaveParameters}
                activeTab={activeTab}
                editingDevice={editingDevice}
                setEditingDevice={setEditingDevice}
              />
            ) : (
              <AlarmConfigTab
                thresholds={currentDeptAlarmThresholds}
                config={currentDeptDeviceConfig}
                onSave={onSaveAlarms}
                nightMode={settings.nightMode}
                onToggleNightMode={() => onSavePreferences({ nightMode: !settings.nightMode })}
              />
            )}
          </div>
        </div>

        <BedCapacityControl
          settings={settings}
          onSaveCapacity={onSaveCapacity}
          currentDepartment={currentDepartment}
        />
      </div>
    </div>
  );
};

export default SettingsView;
