
import React, { useState } from 'react';
import { AlarmRecord, VitalStatus, AlarmCategory } from '../types';
import { AlertTriangle, CheckCircle, Wrench, Activity, Eye } from 'lucide-react';
import AlarmReviewModal from './AlarmReviewModal';

interface AlarmHistoryViewProps {
  alarms: AlarmRecord[];
  onClear: () => void;
}

const AlarmHistoryView: React.FC<AlarmHistoryViewProps> = ({ alarms, onClear }) => {
  const [filterType, setFilterType] = useState<'ALL' | VitalStatus>('ALL');
  const [filterCategory, setFilterCategory] = useState<'ALL' | AlarmCategory>('ALL');
  const [selectedAlarm, setSelectedAlarm] = useState<AlarmRecord | null>(null);

  const filteredAlarms = alarms.filter(a => {
    if (filterType !== 'ALL' && a.type !== filterType) return false;
    if (filterCategory !== 'ALL' && a.category !== filterCategory) return false;
    return true;
  }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return (
    <div className="flex-1 p-6 bg-med-bg text-gray-200 overflow-hidden flex flex-col relative">
        
        {/* Modal Overlay */}
        {selectedAlarm && (
            <AlarmReviewModal alarm={selectedAlarm} onClose={() => setSelectedAlarm(null)} />
        )}

        <div className="flex justify-between items-center mb-6">
            <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <AlertTriangle className="text-med-alert" /> 报警历史记录
                </h2>
                <p className="text-gray-500 text-sm">系统产生的生理报警与技术报警日志</p>
            </div>
            <button 
                onClick={onClear}
                className="text-sm text-gray-400 hover:text-white underline"
            >
                清空记录
            </button>
        </div>

        {/* Filters Container */}
        <div className="flex flex-wrap gap-4 mb-4 items-center bg-med-card p-3 rounded-lg border border-gray-700">
            
            {/* Category Filter */}
            <div className="flex items-center gap-2 border-r border-gray-700 pr-4">
                <span className="text-xs text-gray-500 font-bold uppercase">类别</span>
                <button onClick={() => setFilterCategory('ALL')} className={`px-3 py-1 rounded text-xs font-bold transition ${filterCategory === 'ALL' ? 'bg-gray-600 text-white' : 'text-gray-400'}`}>全部</button>
                <button onClick={() => setFilterCategory(AlarmCategory.PHYSIOLOGICAL)} className={`px-3 py-1 rounded text-xs font-bold transition flex items-center gap-1 ${filterCategory === AlarmCategory.PHYSIOLOGICAL ? 'bg-red-900 text-red-100' : 'text-gray-400'}`}><Activity size={12}/> 生理</button>
                <button onClick={() => setFilterCategory(AlarmCategory.TECHNICAL)} className={`px-3 py-1 rounded text-xs font-bold transition flex items-center gap-1 ${filterCategory === AlarmCategory.TECHNICAL ? 'bg-blue-900 text-blue-100' : 'text-gray-400'}`}><Wrench size={12}/> 技术</button>
            </div>

            {/* Level Filter */}
            <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-bold uppercase">级别</span>
                <button onClick={() => setFilterType('ALL')} className={`px-3 py-1 rounded text-xs font-bold transition ${filterType === 'ALL' ? 'bg-gray-600 text-white' : 'text-gray-400'}`}>全部</button>
                <button onClick={() => setFilterType(VitalStatus.CRITICAL)} className={`px-3 py-1 rounded text-xs font-bold transition ${filterType === VitalStatus.CRITICAL ? 'bg-med-alert text-black' : 'text-gray-400'}`}>危急</button>
                <button onClick={() => setFilterType(VitalStatus.WARNING)} className={`px-3 py-1 rounded text-xs font-bold transition ${filterType === VitalStatus.WARNING ? 'bg-med-warn text-black' : 'text-gray-400'}`}>警告</button>
            </div>
        </div>

        {/* Timeline List */}
        <div className="flex-1 overflow-y-auto bg-med-card border border-gray-700 rounded-lg p-2">
            <table className="w-full text-left">
                <thead className="text-xs text-gray-500 bg-gray-900 sticky top-0 uppercase">
                    <tr>
                        <th className="p-3">时间</th>
                        <th className="p-3">类别</th>
                        <th className="p-3">级别</th>
                        <th className="p-3">床位 / 患者</th>
                        <th className="p-3">事件描述</th>
                        <th className="p-3 text-right w-32">操作</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                    {filteredAlarms.map(alarm => (
                        <tr key={alarm.id} className="hover:bg-gray-800 transition text-sm">
                            <td className="p-3 font-mono text-gray-400">
                                {alarm.timestamp.toLocaleTimeString()}
                                <div className="text-[10px]">{alarm.timestamp.toLocaleDateString()}</div>
                            </td>
                            <td className="p-3">
                                {alarm.category === AlarmCategory.PHYSIOLOGICAL ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-red-900/30 text-red-300 border border-red-800">
                                        <Activity size={10} /> 生理
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-blue-900/30 text-blue-300 border border-blue-800">
                                        <Wrench size={10} /> 技术
                                    </span>
                                )}
                            </td>
                            <td className="p-3">
                                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${alarm.type === VitalStatus.CRITICAL ? 'bg-med-alert animate-pulse' : 'bg-med-warn'}`}></span>
                                <span className={alarm.type === VitalStatus.CRITICAL ? 'text-med-alert font-bold' : 'text-med-warn'}>{alarm.type}</span>
                            </td>
                            <td className="p-3">
                                <div className="font-bold text-white">{alarm.bedNumber}</div>
                                <div className="text-xs text-gray-500">{alarm.patientName}</div>
                            </td>
                            <td className="p-3 text-gray-300">
                                {alarm.message}
                            </td>
                            <td className="p-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    {/* Acknowledged Status - Fixed width slot for alignment */}
                                    <div className="w-6 flex justify-center">
                                         {alarm.acknowledged && (
                                            <span className="text-green-500" title="已确认"><CheckCircle size={16}/></span>
                                         )}
                                    </div>

                                    {/* Action Button - Fixed width slot */}
                                    <div className="w-20"> 
                                        {alarm.snapshot ? (
                                            <button 
                                                onClick={() => setSelectedAlarm(alarm)}
                                                className="flex items-center justify-center gap-1 w-full px-2 py-1.5 bg-gray-700 hover:bg-blue-600 text-white rounded text-xs transition border border-gray-600 hover:border-blue-500"
                                            >
                                                <Eye size={12} /> 回顾
                                            </button>
                                        ) : (
                                            <span className="flex items-center justify-center w-full py-1.5 text-[10px] text-gray-600 italic bg-gray-900/50 rounded border border-gray-800 cursor-not-allowed">
                                                无快照
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {filteredAlarms.length === 0 && (
                        <tr>
                            <td colSpan={6} className="p-10 text-center text-gray-600">无相关报警记录。</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
  );
};

export default AlarmHistoryView;
