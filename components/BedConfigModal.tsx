
import React, { useState, useEffect, useRef } from 'react';
import { PatientData } from '../types';
import { X, Save, Activity, Hash, ArrowUp, ArrowDown, CheckSquare, Square } from 'lucide-react';

interface BedConfigModalProps {
  patient: PatientData;
  onClose: () => void;
  onSave: (patientId: string, settings: { visibleWaveformIds: string[], visibleParameterIds: string[] }) => void;
}

const BedConfigModal: React.FC<BedConfigModalProps> = ({ patient, onClose, onSave }) => {
  // We use a ref to hold the initial patient data reference to derive available options only ONCE.
  // This prevents the form from resetting every time 'patient' prop updates (100ms tick).
  const initialPatientRef = useRef(patient);
  const allWaves = initialPatientRef.current.waveforms;
  const allParams = initialPatientRef.current.parameters;

  const [activeTab, setActiveTab] = useState<'waveforms' | 'parameters'>('waveforms');
  
  // State for the lists (ID strings)
  const [waveIds, setWaveIds] = useState<string[]>([]);
  const [paramIds, setParamIds] = useState<string[]>([]);
  
  // State for visibility map
  const [visibleWaves, setVisibleWaves] = useState<Record<string, boolean>>({});
  const [visibleParams, setVisibleParams] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Initialize based on existing settings OR defaults
    // This runs ONLY ONCE on mount due to empty dependency array (or patient.id check)
    const p = initialPatientRef.current;

    if (p.displaySettings) {
        // Use saved settings
        // Merge saved IDs with any new/other IDs found in data (in case data schema changed)
        const savedWaveIds = p.displaySettings.visibleWaveformIds;
        const otherWaveIds = allWaves.map(w => w.id).filter(id => !savedWaveIds.includes(id));
        setWaveIds([...savedWaveIds, ...otherWaveIds]);

        const savedParamIds = p.displaySettings.visibleParameterIds;
        const otherParamIds = allParams.map(par => par.id).filter(id => !savedParamIds.includes(id));
        setParamIds([...savedParamIds, ...otherParamIds]);
        
        const wv: Record<string, boolean> = {};
        allWaves.forEach(w => wv[w.id] = savedWaveIds.includes(w.id));
        setVisibleWaves(wv);

        const pv: Record<string, boolean> = {};
        allParams.forEach(pa => pv[pa.id] = savedParamIds.includes(pa.id));
        setVisibleParams(pv);
    } else {
        // Default Initialization
        setWaveIds(allWaves.map(w => w.id));
        setParamIds(allParams.map(p => p.id));
        
        const wv: Record<string, boolean> = {};
        allWaves.forEach((w, i) => wv[w.id] = i < 4); // Default show first 4
        setVisibleWaves(wv);

        const pv: Record<string, boolean> = {};
        allParams.forEach((p, i) => pv[p.id] = i < 6); // Default show first 6
        setVisibleParams(pv);
    }
  }, []); // Intentionally empty to run once on mount

  const handleToggle = (id: string) => {
    if (activeTab === 'waveforms') {
        setVisibleWaves(prev => ({ ...prev, [id]: !prev[id] }));
    } else {
        setVisibleParams(prev => ({ ...prev, [id]: !prev[id] }));
    }
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
      const list = activeTab === 'waveforms' ? [...waveIds] : [...paramIds];
      if (direction === 'up') {
          if (index === 0) return;
          [list[index], list[index - 1]] = [list[index - 1], list[index]];
      } else {
          if (index === list.length - 1) return;
          [list[index], list[index + 1]] = [list[index + 1], list[index]];
      }
      
      if (activeTab === 'waveforms') setWaveIds(list);
      else setParamIds(list);
  };

  const handleSave = () => {
      // Filter out unchecked items but keep the order of the list
      const finalWaves = waveIds.filter(id => visibleWaves[id]);
      const finalParams = paramIds.filter(id => visibleParams[id]);
      
      onSave(patient.id, {
          visibleWaveformIds: finalWaves,
          visibleParameterIds: finalParams
      });
      onClose();
  };

  const currentListIds = activeTab === 'waveforms' ? waveIds : paramIds;
  const isChecked = (id: string) => activeTab === 'waveforms' ? visibleWaves[id] : visibleParams[id];

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-med-card border border-gray-700 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            
            <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-gray-900">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-900/30 text-blue-400 rounded-lg border border-blue-900">
                        <Activity size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-100">床位显示配置</h3>
                        <p className="text-xs text-gray-400 font-mono">{patient.bedNumber} - {patient.name}</p>
                    </div>
                </div>
                <button onClick={onClose} className="text-gray-500 hover:text-white transition"><X size={20}/></button>
            </div>

            <div className="flex p-2 bg-gray-900 border-b border-gray-800">
                <button 
                    onClick={() => setActiveTab('waveforms')}
                    className={`flex-1 py-2 text-sm font-bold rounded transition flex items-center justify-center gap-2 ${activeTab === 'waveforms' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}
                >
                    <Activity size={16} /> 波形设置
                </button>
                <button 
                    onClick={() => setActiveTab('parameters')}
                    className={`flex-1 py-2 text-sm font-bold rounded transition flex items-center justify-center gap-2 ${activeTab === 'parameters' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}
                >
                    <Hash size={16} /> 参数设置
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-[#0f1115]">
                <p className="text-xs text-gray-500 mb-3 px-1">
                    勾选需要显示的项，并通过上下箭头调整显示顺序（排在前面的将优先显示）。
                </p>
                <div className="space-y-2">
                    {currentListIds.map((id, index) => {
                        // Look up latest metadata from props, or fallback to initial ref if missing
                        // We use `patient` prop here to ensure if labels/colors update they are reflected, 
                        // even though the list structure is frozen in state.
                        const wave = patient.waveforms.find(w => w.id === id) || allWaves.find(w => w.id === id);
                        const param = patient.parameters.find(p => p.id === id) || allParams.find(p => p.id === id);
                        
                        const label = activeTab === 'waveforms' ? wave?.label : param?.label;
                        const sub = activeTab === 'parameters' ? param?.unit : '';
                        const color = activeTab === 'waveforms' ? wave?.color : '';
                        const checked = isChecked(id);

                        return (
                            <div key={id} className={`flex items-center justify-between p-3 rounded border transition ${checked ? 'bg-gray-800 border-gray-600' : 'bg-gray-900/50 border-gray-800 opacity-60'}`}>
                                <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => handleToggle(id)}>
                                    <div className={`text-blue-500`}>
                                        {checked ? <CheckSquare size={18} /> : <Square size={18} />}
                                    </div>
                                    <div>
                                        <div className="font-bold text-sm text-gray-200" style={{ color: checked ? color : undefined }}>{label || id}</div>
                                        {sub && <div className="text-xs text-gray-500">{sub}</div>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button 
                                        onClick={() => handleMove(index, 'up')}
                                        disabled={index === 0}
                                        className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-white disabled:opacity-20 transition"
                                    >
                                        <ArrowUp size={16} />
                                    </button>
                                    <button 
                                        onClick={() => handleMove(index, 'down')}
                                        disabled={index === currentListIds.length - 1}
                                        className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-white disabled:opacity-20 transition"
                                    >
                                        <ArrowDown size={16} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="p-4 border-t border-gray-700 bg-gray-900 flex justify-end gap-3">
                <button onClick={onClose} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-sm font-bold transition">取消</button>
                <button onClick={handleSave} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-bold transition flex items-center gap-2">
                    <Save size={16} /> 保存配置
                </button>
            </div>
        </div>
    </div>
  );
};

export default BedConfigModal;
