
import React from 'react';
import { PatientData, VitalStatus, DeviceType, WaveformConfig, ParameterConfig, AlarmCategory } from '../types';
import WaveformCanvas from './WaveformCanvas';
import { Activity, Wind, Database, AlertCircle, Info, Stethoscope, Settings, Power } from 'lucide-react';

interface PatientCardProps {
  patient: PatientData;
  bedLabel?: string; // NEW PROP
  deviceConfig?: { waveforms: WaveformConfig[], parameters: ParameterConfig[] };
  onClick: (patient: PatientData) => void;
  onOpenConfig?: (patient: PatientData) => void; 
  compact?: boolean; 
  stretch?: boolean; 
}

const PatientCard: React.FC<PatientCardProps> = ({ patient, bedLabel, deviceConfig, onClick, onOpenConfig, compact = false, stretch = false }) => {
  
  const getDeviceIcon = (type: DeviceType, size: number = 14) => {
    switch (type) {
      case DeviceType.VENTILATOR: return <Wind size={size} className="text-blue-400" key={type} />;
      case DeviceType.ANESTHESIA: return <Database size={size} className="text-purple-400" key={type} />;
      case DeviceType.MONITOR: return <Activity size={size} className="text-green-400" key={type} />;
      default: return <Stethoscope size={size} className="text-gray-400" key={type} />;
    }
  };

  const isAlarm = !!patient.activeAlarm;
  const isTechAlarm = patient.activeAlarm?.category === AlarmCategory.TECHNICAL;
  const isPhysAlarm = patient.activeAlarm?.category === AlarmCategory.PHYSIOLOGICAL;
  const isStandby = patient.status === VitalStatus.STANDBY;

  // Dynamic Styles based on Alarm Type
  const getBorderColor = () => {
      if (isStandby) return 'border-gray-700 border-dashed opacity-80';
      if (isTechAlarm) return 'border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.3)]';
      if (isPhysAlarm) return 'border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.5)] animate-pulse';
      if (patient.status === VitalStatus.DISCONNECTED) return 'border-gray-700 border-dashed';
      return 'border-gray-800 bg-[#0b0c10] hover:border-gray-600 shadow-md';
  };

  const getHeaderBg = () => {
      if (isStandby) return 'bg-gray-800/30 text-gray-500';
      if (isTechAlarm) return 'bg-cyan-950/80 text-cyan-200';
      if (isPhysAlarm) return 'bg-red-950/90 text-red-100';
      return 'bg-gray-900/50 text-gray-400';
  };
  
  // Logic to determine what to show (Custom Settings vs Default Config)
  let displayWaves: any[] = [];
  let displayParams: any[] = [];

  if (patient.displaySettings) {
      // 1. Use Custom Settings (Strict Order)
      patient.displaySettings.visibleWaveformIds.forEach(id => {
          const w = patient.waveforms.find(pw => pw.id === id);
          if (w) displayWaves.push(w); 
      });

      patient.displaySettings.visibleParameterIds.forEach(id => {
          const p = patient.parameters.find(pp => pp.id === id);
          if (p) displayParams.push(p);
      });
  } else {
      // 2. Use Default Config
      const waveConfigs = deviceConfig?.waveforms || [];
      // If we have a global config, respect the 'visible' flag and order
      if (waveConfigs.length > 0) {
          for (const config of waveConfigs) {
              if (!config.visible) continue;
              const waveData = patient.waveforms.find(w => w.id === config.id);
              if (waveData) {
                  displayWaves.push({ ...waveData, color: config.color, label: config.label });
              }
          }
      } else {
          // Fallback if no config passed
          displayWaves.push(...patient.waveforms.slice(0, 3));
      }

      const paramConfigs = deviceConfig?.parameters || [];
      if (paramConfigs.length > 0) {
          for (const config of paramConfigs) {
              if (!config.visible) continue;
              const paramData = patient.parameters.find(p => p.id === config.id);
              if (paramData) {
                  displayParams.push(paramData);
              }
          }
      } else {
          // Fallback
          displayParams.push(...patient.parameters.slice(0, 6));
      }
  }

  // Slicing Logic
  const visibleWaves = compact ? displayWaves.slice(0, 2) : displayWaves;
  // Increase visible params for Hybrid Grid
  const visibleParams = compact ? displayParams.slice(0, 4) : displayParams.slice(0, 8);
  
  const fixedHeightClass = compact ? 'h-48' : 'h-80'; 
  const heightClass = stretch ? 'h-full' : fixedHeightClass;
  
  const getBigNumberColor = (param: any, idx: number) => {
      if (isStandby) return '#6b7280'; // Gray for standby
      if (param.isAlarm) return undefined; 
      if (idx === 0) {
          if (patient.deviceType === DeviceType.VENTILATOR && patient.connectedDevices.length === 1) {
              return '#ff9500'; 
          }
          if (visibleWaves[0]) return visibleWaves[0].color;
      }
      return '#e5e7eb'; 
  };

  const handleConfigClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onOpenConfig) onOpenConfig(patient);
  };

  return (
    <div 
      onClick={() => onClick(patient)}
      className={`
        relative flex flex-col group
        rounded-xl border-2 overflow-hidden
        cursor-pointer transition-all duration-200
        ${getBorderColor()}
        ${heightClass}
      `}
    >
      <div className={`flex justify-between items-center px-3 py-1.5 border-b border-gray-800 shrink-0 h-10 transition-colors duration-300 ${getHeaderBg()}`}>
        <div className="flex items-center gap-2 overflow-hidden min-w-0">
          <span className={`font-mono font-bold text-xl md:text-2xl leading-none whitespace-nowrap ${isAlarm ? 'text-inherit' : 'text-med-spo2'}`}>
            {/* PRIORITIZE BED LABEL */}
            {bedLabel || patient.bedNumber}
          </span>
          {isStandby && <span className="text-xs border border-gray-600 px-1 rounded flex items-center gap-1"><Power size={10}/> 待机</span>}
        </div>

        <div className="flex-1 px-3 overflow-hidden text-right md:text-center min-w-0">
            {isAlarm ? (
                <div className="text-xs md:text-sm font-bold whitespace-nowrap animate-pulse flex items-center justify-end md:justify-center gap-1">
                    {isTechAlarm ? <Info size={14} className="shrink-0"/> : <AlertCircle size={14} className="shrink-0"/>}
                    <span className="whitespace-nowrap">{patient.activeAlarm?.message}</span>
                </div>
            ) : (
                <div className="flex flex-col md:flex-row items-end md:items-center justify-end md:justify-center gap-0 md:gap-2">
                    <span className="font-bold text-gray-200 text-sm whitespace-nowrap">{patient.name}</span>
                    {!compact && <span className="text-xs text-gray-500 hidden md:inline whitespace-nowrap">| {patient.gender} {patient.age}岁</span>}
                </div>
            )}
        </div>

        <div className="flex items-center gap-2 justify-end shrink-0 pl-1">
             {patient.connectedDevices && patient.connectedDevices.length > 0 
                ? patient.connectedDevices.map(d => getDeviceIcon(d, 14))
                : getDeviceIcon(patient.deviceType, 14)
             }
             {onOpenConfig && (
                 <button 
                    onClick={handleConfigClick}
                    className="ml-1 p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    title="配置显示"
                 >
                     <Settings size={14} />
                 </button>
             )}
        </div>
      </div>

      <div className="flex-1 flex min-h-0 bg-[#0f1115] relative">
        
        {/* STANDBY OVERLAY */}
        {isStandby && (
            <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-700/30 tracking-[1em] rotate-[-15deg] select-none">
                    STANDBY
                </h2>
            </div>
        )}

        <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          {visibleWaves.map((wave, idx) => (
             <div key={idx} className="flex-1 w-full min-h-0 relative border-b border-gray-800/30 last:border-0 group/wave">
                 <div className="absolute inset-0 opacity-10 bg-[length:30px_30px] bg-[linear-gradient(0deg,transparent_24%,rgba(255,255,255,.05)_25%,rgba(255,255,255,.05)_26%,transparent_27%,transparent_74%,rgba(255,255,255,.05)_75%,rgba(255,255,255,.05)_76%,transparent_77%,transparent),linear-gradient(90deg,transparent_24%,rgba(255,255,255,.05)_25%,rgba(255,255,255,.05)_26%,transparent_27%,transparent_74%,rgba(255,255,255,.05)_75%,rgba(255,255,255,.05)_76%,transparent_77%,transparent)]"></div>
                 
                 <span className="absolute top-1 left-2 text-[10px] font-mono font-bold z-10 opacity-70 group-hover/wave:opacity-100 transition-opacity" style={{ color: wave.color }}>
                   {wave.label.split(' ')[0]} 
                 </span>
                 
                 <div className="w-full h-full relative">
                    <WaveformCanvas data={wave.data} type={wave.id} color={wave.color} />
                 </div>
             </div>
          ))}
          {visibleWaves.length === 0 && (
             <div className="flex items-center justify-center h-full text-xs text-gray-700">无波形</div>
          )}
        </div>

        {/* Parameters Column - Hybrid Grid (Smart Colspan) */}
        <div className={`
            grid
            ${compact ? 'w-[35%] grid-cols-1' : 'w-[40%] grid-cols-2'} 
            bg-[#15171e] border-l border-gray-800 shadow-xl z-10
            overflow-hidden
            auto-rows-fr
        `}>
            {visibleParams.map((param, idx) => {
                const valStr = String(param.value);
                const len = valStr.length;
                const isLong = len > 5; // e.g. "120/80" -> 6 chars. Spans 2 cols.
                
                // Smart Colspan: In standard mode, long values span 2 columns
                const colSpan = (!compact && isLong) ? 'col-span-2' : 'col-span-1';
                
                // Refined Font Size Logic based on Length
                let fontSize = 'text-3xl'; // Default Big (Length <= 3, e.g. "98")
                
                if (compact) {
                    fontSize = 'text-xl';
                    if (len >= 4) fontSize = 'text-lg'; // Fix for 4-chars in compact mode
                } else {
                    // Standard Mode
                    if (len >= 4) fontSize = 'text-2xl'; // Medium (Length 4-5, e.g. "37.5" or "100")
                    if (len > 7) fontSize = 'text-xl';  // Very long (Length > 7)
                }

                return (
                    <div 
                        key={param.id} 
                        className={`
                            relative flex flex-col justify-center px-1 py-0.5 
                            border-b border-r border-gray-800/50 
                            items-end hover:bg-white/5 transition overflow-hidden
                            ${colSpan}
                        `}
                    >
                        {/* Improved Label Display: Prioritize Label Name, truncate Unit if needed */}
                        <div className="w-full flex justify-end items-center text-[9px] text-gray-500 font-bold opacity-70 overflow-hidden">
                            <span className="whitespace-nowrap flex-shrink-0">{param.label}</span>
                            {param.unit && (
                                <span className="lowercase font-normal opacity-50 ml-1 truncate min-w-0">
                                    ({param.unit})
                                </span>
                            )}
                        </div>
                        
                        <div 
                            className={`
                                font-mono font-bold leading-none whitespace-nowrap tracking-tighter w-full text-right 
                                ${fontSize} 
                                ${param.isAlarm ? 'text-med-alert animate-pulse' : ''}
                            `}
                            style={{ 
                                color: getBigNumberColor(param, idx)
                            }}
                        >
                            {param.value}
                        </div>
                    </div>
                );
            })}
        </div>
      </div>
    </div>
  );
};

export default PatientCard;
