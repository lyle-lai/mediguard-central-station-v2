
import React from 'react';
import { SystemSettings } from '../../types';
import { Database, Gauge, PlayCircle, AlertTriangle } from 'lucide-react';

interface SimulationControlProps {
  settings: SystemSettings;
  onUpdate: (newSettings: SystemSettings) => void;
  onTriggerAlarm?: () => void;
}

const SimulationControl: React.FC<SimulationControlProps> = ({ settings, onUpdate, onTriggerAlarm }) => {
  return (
    <div className="bg-med-card border border-gray-700 rounded-xl p-6 shadow-lg flex flex-col gap-6">
      <h3 className="text-xl font-semibold text-gray-100 border-b border-gray-700 pb-2 flex items-center gap-2">
        <Database size={20} className="text-purple-400" /> 系统模式与数据源
      </h3>
      <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
        <div>
          <div className="font-bold text-gray-200 flex items-center gap-2">
            演示模式 (Demo Mode)
            {settings.isDemoMode ? <span className="text-xs bg-green-900 text-green-300 px-2 py-0.5 rounded border border-green-700">运行中</span> : <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded">已停止</span>}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {settings.isDemoMode 
              ? "系统正在生成模拟患者波形和报警数据。关闭此开关以连接真实后端数据源。" 
              : "模拟器已停止。等待真实 API 或 WebSocket 数据推送。"
            }
          </p>
        </div>
        <button 
          type="button"
          onClick={() => onUpdate({...settings, isDemoMode: !settings.isDemoMode})}
          className={`relative w-16 h-8 rounded-full transition-colors duration-300 ${settings.isDemoMode ? 'bg-blue-600' : 'bg-gray-700'}`}
        >
          <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow transition-transform duration-300 ${settings.isDemoMode ? 'translate-x-8' : 'translate-x-0'}`}></div>
        </button>
      </div>
      {settings.isDemoMode && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-gray-800/50">
          <div className="p-4 bg-gray-900/30 rounded-lg border border-gray-800">
            <label className="block text-sm text-gray-300 mb-4 font-bold flex items-center gap-2"><Gauge size={16} className="text-blue-400" /> 模拟数据生成速率</label>
            <input type="range" min="0" max="5" step="1" value={settings.simulationSpeed} onChange={(e) => onUpdate({...settings, simulationSpeed: parseInt(e.target.value, 10)})} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500" />
          </div>
          <div className="p-4 bg-gray-900/30 rounded-lg border border-gray-800 flex flex-col justify-between">
            <label className="block text-sm text-gray-300 font-bold flex items-center gap-2 mb-2"><AlertTriangle size={16} className="text-orange-400"/> 报警系统测试</label>
            <button type="button" onClick={onTriggerAlarm} disabled={!settings.isDemoMode} className="w-full bg-orange-900/40 border border-orange-800/50 hover:bg-orange-800/60 text-orange-200 font-bold py-2 rounded transition text-xs flex items-center justify-center gap-2">
              <PlayCircle size={14}/> 立即触发测试报警
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimulationControl;
