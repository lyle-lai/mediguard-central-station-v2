
import React, { useState, useEffect } from 'react';
import { PatientData, VitalStatus, DeviceType, WaveformConfig, ParameterConfig, AlarmCategory, DeviceDisplayConfig } from '../types';
import WaveformCanvas from './WaveformCanvas';
import { analyzePatientVitals } from '../services/geminiService';
import PatientHistoryReview from './PatientHistoryReview';
import { DEFAULT_DEVICE_CONFIGS } from '../constants';
import { X, Bot, AlertTriangle, Wind, Activity, Database, AlertCircle, Info, History, Stethoscope } from 'lucide-react';

interface PatientDetailProps {
  patient: PatientData;
  deviceConfig?: DeviceDisplayConfig;
  onClose: () => void;
}

const PatientDetail: React.FC<PatientDetailProps> = ({ patient, deviceConfig, onClose }) => {
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    setAiAnalysis('');
  }, [patient.id]);

  /*
  const handleAIAnalysis = async () => {
    if (!process.env.API_KEY) {
        setAiAnalysis("错误：未配置 API Key，无法使用AI服务。");
        return;
    }
    setIsAnalyzing(true);
    setAiAnalysis("正在分析生命体征数据...");
    try {
      const result = await analyzePatientVitals(patient);
      setAiAnalysis(result);
    } catch (e) {
      setAiAnalysis("分析失败。");
    } finally {
      setIsAnalyzing(false);
    }
  };
  */

  const getDeviceIcon = (type: DeviceType, size: number = 20) => {
     switch (type) {
       case DeviceType.VENTILATOR: return <Wind size={size} className="text-blue-400" />;
       case DeviceType.ANESTHESIA: return <Database size={size} className="text-purple-400" />;
       case DeviceType.MONITOR: return <Activity size={size} className="text-green-400" />;
       default: return <Stethoscope size={size} className="text-gray-400" />;
     }
  };

  const isAlarm = !!patient.activeAlarm;
  const isTechAlarm = patient.activeAlarm?.category === AlarmCategory.TECHNICAL;
  const alarmColorClass = isTechAlarm ? 'text-cyan-400' : 'text-red-500';
  const alarmBgClass = isTechAlarm ? 'bg-cyan-950/50 border-cyan-800' : 'bg-red-950/50 border-red-800';

  const allWaveforms = patient.waveforms; 

  const renderDeviceParameters = (type: DeviceType) => {
      // Use department specific config passed as prop, fallback to default
      const configParameters = deviceConfig?.[type]?.parameters || DEFAULT_DEVICE_CONFIGS[patient.department][type].parameters || [];
      
      const deviceParams: any[] = [];
      
      configParameters.forEach((conf: ParameterConfig) => {
          const pData = patient.parameters.find(p => p.id === conf.id);
          if (pData) {
              deviceParams.push({ ...pData, label: conf.label, unit: conf.unit });
          }
      });

      if (deviceParams.length === 0) return null;

      return (
          <div key={type} className="mb-4 last:mb-0">
              <div className="flex items-center gap-2 mb-2 px-4 pt-2">
                  {getDeviceIcon(type, 14)}
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{type} 数据</span>
              </div>
              <div className="grid grid-cols-2 gap-px bg-gray-700 border-y border-gray-700">
                  {deviceParams.map((param, idx) => {
                    const valStr = String(param.value);
                    const len = valStr.length;
                    
                    // Dynamic Font Sizing for Detail View
                    let fontSize = '2rem';
                    if (len > 3) fontSize = '1.75rem'; // e.g. "37.5"
                    if (len > 6) fontSize = '1.5rem';  // e.g. "120/80"

                    return (
                        <div key={idx} className={`bg-med-card p-2 flex flex-col items-center justify-center min-h-[80px] hover:bg-white/5 transition overflow-hidden`}>
                            <div className="text-gray-400 text-xs mb-1 max-w-full flex items-center justify-center overflow-hidden w-full px-1">
                                <span className="whitespace-nowrap flex-shrink-0">{param.label}</span>
                                {param.unit && (
                                     <span className="text-[10px] text-gray-600 opacity-70 ml-1 truncate min-w-0">
                                        ({param.unit})
                                     </span>
                                )}
                            </div>
                            <div 
                                className={`font-mono font-bold leading-none whitespace-nowrap tracking-tighter max-w-full ${param.isAlarm ? 'text-med-alert animate-pulse' : 'text-white'}`}
                                style={{ fontSize }}
                            >
                                {param.value}
                            </div>
                        </div>
                    );
                  })}
              </div>
          </div>
      );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-med-bg border border-gray-700 w-full max-w-[1400px] h-[95vh] flex flex-col rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 relative">
        
        {showHistory && (
            <PatientHistoryReview 
                patient={patient} 
                onClose={() => setShowHistory(false)} 
            />
        )}

        <div className="flex justify-between items-center p-4 bg-med-card border-b border-gray-700 shrink-0">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
               <div className="p-2 bg-gray-800 rounded-lg">{getDeviceIcon(patient.deviceType)}</div>
               <h2 className="text-3xl font-bold text-med-spo2 font-mono">{patient.bedNumber}</h2>
            </div>
            
            {isAlarm ? (
                <div className={`flex items-center gap-3 px-6 py-2 rounded-lg border animate-pulse ${alarmBgClass}`}>
                    {isTechAlarm ? <Info size={24} className={alarmColorClass}/> : <AlertTriangle size={24} className={alarmColorClass}/>}
                    <div className="flex flex-col">
                        <span className={`font-bold text-lg leading-none ${alarmColorClass}`}>{patient.activeAlarm?.category}</span>
                        <span className="text-sm text-gray-300">{patient.activeAlarm?.message}</span>
                    </div>
                </div>
            ) : (
                <div className="flex items-center gap-2 px-4 py-2 bg-green-900/20 border border-green-800 rounded-lg text-green-400">
                    <Activity size={20} />
                    <span className="font-bold">状态正常</span>
                </div>
            )}
            
            <div className="h-8 w-px bg-gray-600"></div>
            <div>
              <div className="text-xl text-white font-semibold flex items-center gap-2">
                {patient.name}
                <div className="flex gap-1">
                    {patient.connectedDevices.map(d => (
                         <span key={d} className="text-xs px-2 py-0.5 bg-gray-700 rounded-full text-gray-300 font-normal border border-gray-600">
                            {d}
                        </span>
                    ))}
                </div>
              </div>
              <div className="text-sm text-gray-400">
                住院号: {patient.admissionId} | {patient.age}岁 | {patient.gender}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
              <button 
                onClick={() => setShowHistory(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded font-bold transition border border-gray-600"
              >
                  <History size={18} /> 历史回顾
              </button>

              <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-full text-gray-400 hover:text-white transition">
                <X size={24} />
              </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          
          <div className="flex-1 flex flex-col border-r border-gray-700 bg-black/50 p-4 space-y-2 overflow-y-auto custom-scrollbar">
             {allWaveforms.map((wave, idx) => (
                 <div key={idx} className="flex-1 min-h-[120px] relative border border-gray-800/50 rounded bg-med-bg p-1 flex flex-col">
                    <span className="text-xs font-bold absolute top-2 left-2 px-2 py-0.5 rounded bg-black/40 z-10" style={{ color: wave.color }}>
                        {wave.label}
                    </span>
                    <div className="flex-1 w-full h-full relative">
                        <WaveformCanvas 
                            data={wave.data} 
                            type={wave.id} 
                            color={wave.color} 
                        />
                    </div>
                 </div>
             ))}
             {allWaveforms.length === 0 && (
                <div className="flex items-center justify-center h-full text-gray-600">
                    该床位无波形数据。
                </div>
             )}
          </div>

          <div className="w-[35%] min-w-[320px] max-w-[500px] flex flex-col bg-med-card shrink-0 border-l border-gray-800">
            
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {patient.connectedDevices.map(type => renderDeviceParameters(type))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDetail;
