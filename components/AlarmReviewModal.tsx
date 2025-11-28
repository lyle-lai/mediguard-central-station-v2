
import React from 'react';
import { AlarmRecord, VitalStatus, AlarmCategory } from '../types';
import WaveformCanvas from './WaveformCanvas';
import { X, AlertTriangle, Info, Clock, User, Activity } from 'lucide-react';

interface AlarmReviewModalProps {
  alarm: AlarmRecord;
  onClose: () => void;
}

const AlarmReviewModal: React.FC<AlarmReviewModalProps> = ({ alarm, onClose }) => {
  if (!alarm.snapshot) return null;

  const isPhys = alarm.category === AlarmCategory.PHYSIOLOGICAL;
  
  // Format timestamp
  const dateStr = alarm.timestamp.toLocaleDateString();
  const timeStr = alarm.timestamp.toLocaleTimeString();

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-med-bg border border-gray-700 w-full max-w-4xl max-h-[90vh] flex flex-col rounded-xl shadow-2xl overflow-hidden relative">
        
        {/* Header - Styled like a printed report strip */}
        <div className={`p-4 border-b border-gray-700 flex justify-between items-start ${isPhys ? 'bg-red-950/30' : 'bg-blue-950/30'}`}>
            <div className="flex gap-4">
                <div className={`p-3 rounded-lg flex items-center justify-center ${isPhys ? 'bg-red-900/50 text-red-400' : 'bg-blue-900/50 text-blue-400'}`}>
                    {isPhys ? <AlertTriangle size={32} /> : <Info size={32} />}
                </div>
                <div>
                    <h2 className={`text-xl font-bold ${isPhys ? 'text-red-400' : 'text-blue-400'}`}>
                        {alarm.message}
                    </h2>
                    <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                        <span className="flex items-center gap-1"><Clock size={14}/> {dateStr} {timeStr}</span>
                        <span className="flex items-center gap-1"><Activity size={14}/> {alarm.category} - {alarm.type}</span>
                    </div>
                </div>
            </div>
            
            <button onClick={onClose} className="p-2 bg-gray-800 hover:bg-gray-700 rounded-full text-white transition">
                <X size={20} />
            </button>
        </div>

        {/* Patient Info Bar */}
        <div className="bg-gray-900 border-b border-gray-800 px-6 py-2 flex items-center gap-8 text-sm font-mono text-gray-300">
            <span className="text-white font-bold text-lg">{alarm.bedNumber}</span>
            <span className="flex items-center gap-2"><User size={14} /> {alarm.patientName}</span>
            <span className="opacity-50">|</span>
            <span>{alarm.department}</span>
            <span>{alarm.deviceType}</span>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#0f1115]">
            
            <div className="flex flex-col lg:flex-row gap-6">
                
                {/* Left: Waveform Snapshots */}
                <div className="flex-1 space-y-4">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">事件波形记录 (Waveform Snapshot)</h3>
                    {alarm.snapshot.waveforms.length > 0 ? (
                        alarm.snapshot.waveforms.map((wave) => (
                            <div key={wave.id} className="h-32 bg-black border border-gray-800 rounded relative">
                                <span className="absolute top-2 left-2 text-xs font-bold px-1.5 py-0.5 bg-gray-900/80 rounded z-10" style={{ color: wave.color }}>
                                    {wave.label}
                                </span>
                                <WaveformCanvas data={wave.data} type={wave.id} color={wave.color} />
                            </div>
                        ))
                    ) : (
                        <div className="h-32 flex items-center justify-center border border-gray-800 border-dashed rounded text-gray-600 text-sm">
                            无波形数据记录
                        </div>
                    )}
                </div>

                {/* Right: Frozen Parameters */}
                <div className="w-full lg:w-64 shrink-0">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">冻结参数 (Frozen Values)</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
                        {alarm.snapshot.parameters.map((param) => (
                            <div key={param.id} className={`p-3 bg-gray-800/50 border rounded flex justify-between items-center ${param.isAlarm ? 'border-red-600 bg-red-900/10' : 'border-gray-700'}`}>
                                <div>
                                    <div className="text-xs text-gray-400 uppercase">{param.label}</div>
                                    <div className="text-[10px] text-gray-600">{param.unit}</div>
                                </div>
                                <div className={`text-xl font-mono font-bold ${param.isAlarm ? 'text-red-500' : 'text-gray-200'}`}>
                                    {param.value}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            <div className="mt-8 pt-4 border-t border-gray-800 text-center">
                 <p className="text-xs text-gray-600 font-mono">
                     Snapshot ID: {alarm.id} | System Time: {Date.now()}
                 </p>
                 <p className="text-xs text-gray-600 mt-1">
                     该视图展示了报警触发时刻（t=0）前 10 秒的监测数据快照。
                 </p>
            </div>

        </div>

      </div>
    </div>
  );
};

export default AlarmReviewModal;
