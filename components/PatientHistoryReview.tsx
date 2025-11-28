
import React, { useState, useEffect, useRef } from 'react';
import { PatientData, TrendDataPoint } from '../types';
import { fetchPatientTrendsApi } from '../services/apiService';
import { X, Calendar, Table, TrendingUp, Waves } from 'lucide-react';

interface PatientHistoryReviewProps {
  patient: PatientData;
  onClose: () => void;
  isDemoMode?: boolean; // Pass in demo mode status
}

const TIME_RANGES = [
  { label: '1小时', hours: 1, interval: 1 }, 
  { label: '4小时', hours: 4, interval: 5 }, 
  { label: '8小时', hours: 8, interval: 10 }, 
  { label: '24小时', hours: 24, interval: 30 }, 
];

const PatientHistoryReview: React.FC<PatientHistoryReviewProps> = ({ patient, onClose, isDemoMode = true }) => {
  const [selectedRange, setSelectedRange] = useState(TIME_RANGES[1]); 
  const [viewMode, setViewMode] = useState<'GRAPH' | 'TABLE' | 'WAVE'>('GRAPH');
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const graphCanvasRef = useRef<HTMLCanvasElement>(null);
  const waveCanvasRef = useRef<HTMLCanvasElement>(null);

  // --- Data Fetching ---
  useEffect(() => {
    const loadData = async () => {
        setIsLoading(true);
        try {
            if (isDemoMode) {
                // Simulation Logic (Local)
                const data: TrendDataPoint[] = [];
                const now = new Date();
                const totalMinutes = selectedRange.hours * 60;
                const steps = totalMinutes / selectedRange.interval;

                for (let i = 0; i <= steps; i++) {
                    const t = new Date(now.getTime() - (steps - i) * selectedRange.interval * 60000);
                    const timeFactor = i / 10;
                    let hr = 75 + 10 * Math.sin(timeFactor) + (Math.random() * 5);
                    let spo2 = 98 + Math.sin(timeFactor * 0.5) + (Math.random() * 1);
                    let sys = 120 + 15 * Math.sin(timeFactor * 0.3) + (Math.random() * 5);
                    let dia = 80 + 10 * Math.sin(timeFactor * 0.3) + (Math.random() * 3);
                    
                    if (Math.random() > 0.95) hr += 15;
                    if (Math.random() > 0.98) spo2 -= 5;

                    data.push({
                        timestamp: t,
                        hr: Math.round(hr),
                        spo2: Math.round(Math.min(100, spo2)),
                        nibp_sys: Math.round(sys),
                        nibp_dia: Math.round(dia),
                        resp: Math.round(18 + Math.random() * 4),
                        temp: Number((36.5 + Math.random() * 0.5).toFixed(1))
                    });
                }
                setTrendData(data);
            } else {
                // Real API
                const data = await fetchPatientTrendsApi(patient.id, selectedRange.hours);
                setTrendData(data);
            }
        } catch (e) {
            console.error("Failed to load trends", e);
        } finally {
            setIsLoading(false);
        }
    };

    loadData();
  }, [selectedRange, patient.id, isDemoMode]);

  // Draw Trend Graph
  useEffect(() => {
    if (viewMode !== 'GRAPH' || !graphCanvasRef.current || trendData.length === 0) return;
    
    const canvas = graphCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    
    ctx.clearRect(0, 0, width, height);

    const padding = { top: 20, right: 30, bottom: 30, left: 40 };
    const drawWidth = width - padding.left - padding.right;
    const drawHeight = height - padding.top - padding.bottom;

    // Grid
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    for (let i = 0; i <= 4; i++) {
        const y = padding.top + (drawHeight / 4) * i;
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.fillStyle = '#6b7280';
        ctx.font = '10px monospace';
        ctx.fillText(String(200 - i * 50), 5, y + 3);
    }
    const timeStep = Math.max(1, Math.floor(trendData.length / 5));
    for (let i = 0; i < trendData.length; i += timeStep) {
        const x = padding.left + (i / (trendData.length - 1)) * drawWidth;
        ctx.moveTo(x, padding.top);
        ctx.lineTo(x, height - padding.bottom);
        const timeStr = trendData[i].timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        ctx.fillText(timeStr, x - 15, height - 10);
    }
    ctx.stroke();

    const drawLine = (getData: (d: TrendDataPoint) => number, color: string) => {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        trendData.forEach((d, i) => {
            const val = getData(d);
            const x = padding.left + (i / (trendData.length - 1)) * drawWidth;
            const y = padding.top + drawHeight - ((val / 200) * drawHeight);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
    };

    drawLine(d => d.hr, '#00ff41');
    drawLine(d => d.spo2, '#00d0ff');
    drawLine(d => d.nibp_sys, '#ff3b30');

  }, [trendData, viewMode]);

  // Draw Static Waveform (Full Disclosure)
  // NOTE: For Real Mode, this would ideally fetch a different API endpoint for waveform blobs.
  // Currently simulating based on patient data or mock.
  useEffect(() => {
    if (viewMode !== 'WAVE' || !waveCanvasRef.current) return;

    const canvas = waveCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const TOTAL_WIDTH = 4000;
    const HEIGHT = 500;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = TOTAL_WIDTH * dpr;
    canvas.height = HEIGHT * dpr;
    canvas.style.width = `${TOTAL_WIDTH}px`;
    canvas.style.height = `${HEIGHT}px`;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = '#0f1115';
    ctx.fillRect(0, 0, TOTAL_WIDTH, HEIGHT);

    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    for (let x = 0; x < TOTAL_WIDTH; x += 50) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, HEIGHT);
        if (x % 200 === 0) {
             ctx.fillStyle = '#4b5563';
             ctx.font = '10px monospace';
             const secondsAgo = (TOTAL_WIDTH - x) / 50;
             ctx.fillText(`-${secondsAgo}s`, x + 5, HEIGHT - 5);
        }
    }
    for (let y = 0; y < HEIGHT; y += 50) {
        ctx.moveTo(0, y);
        ctx.lineTo(TOTAL_WIDTH, y);
    }
    ctx.stroke();

    const tracks = [
        { label: 'ECG I', color: '#00ff41', yOffset: 80, amp: 40, type: 'ecg' },
        { label: 'SpO2', color: '#00d0ff', yOffset: 230, amp: 40, type: 'pleth' },
        { label: 'Resp', color: '#ffea00', yOffset: 380, amp: 30, type: 'resp' }
    ];

    tracks.forEach(track => {
        ctx.fillStyle = track.color;
        ctx.font = 'bold 12px monospace';
        ctx.fillText(track.label, 10, track.yOffset - 50);

        ctx.beginPath();
        ctx.strokeStyle = track.color;
        ctx.lineWidth = 1.5;
        
        for (let x = 0; x < TOTAL_WIDTH; x++) {
            let val = 0;
            if (track.type === 'ecg') {
                 const p = x % 200;
                 if (p > 20 && p < 40) val = 10 * Math.sin((p-20)*0.15);
                 else if (p > 50 && p < 55) val = -10;
                 else if (p >= 55 && p <= 65) val = 80;
                 else if (p > 65 && p < 70) val = -20;
                 else if (p > 100 && p < 140) val = 15 * Math.sin((p-100)*0.08);
                 val += (Math.random() - 0.5) * 2;
            } else if (track.type === 'pleth') {
                 val = 30 * Math.sin(x * 0.05) + 10 * Math.sin(x * 0.1);
            } else {
                 val = 30 * Math.sin(x * 0.02);
            }
            const y = track.yOffset - (val / 100) * track.amp;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
    });

  }, [viewMode]);

  return (
    <div className="absolute inset-0 bg-med-bg z-[120] flex flex-col animate-in slide-in-from-right duration-300">
        
        <div className="h-14 border-b border-gray-700 bg-med-card flex items-center justify-between px-6 shrink-0">
            <div className="flex items-center gap-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Calendar size={20} className="text-blue-400"/> 历史回顾
                </h2>
                <div className="h-4 w-px bg-gray-600"></div>
                <div className="text-sm text-gray-400">
                    {patient.bedNumber} - {patient.name}
                </div>
                {isLoading && <span className="text-xs text-blue-400 animate-pulse">数据加载中...</span>}
            </div>
            <div className="flex items-center gap-4">
                {viewMode !== 'WAVE' && (
                  <div className="flex bg-gray-800 rounded p-0.5">
                      {TIME_RANGES.map(range => (
                          <button
                              key={range.label}
                              onClick={() => setSelectedRange(range)}
                              className={`px-3 py-1 text-xs rounded transition ${selectedRange.label === range.label ? 'bg-blue-600 text-white font-bold' : 'text-gray-400 hover:text-white'}`}
                          >
                              {range.label}
                          </button>
                      ))}
                  </div>
                )}
                
                <div className="flex bg-gray-800 rounded p-0.5">
                    <button onClick={() => setViewMode('GRAPH')} className={`px-3 py-1.5 rounded transition flex items-center gap-2 text-xs font-bold ${viewMode === 'GRAPH' ? 'bg-gray-600 text-white' : 'text-gray-400'}`}><TrendingUp size={14} /> 趋势</button>
                    <button onClick={() => setViewMode('TABLE')} className={`px-3 py-1.5 rounded transition flex items-center gap-2 text-xs font-bold ${viewMode === 'TABLE' ? 'bg-gray-600 text-white' : 'text-gray-400'}`}><Table size={14} /> 表格</button>
                    <button onClick={() => setViewMode('WAVE')} className={`px-3 py-1.5 rounded transition flex items-center gap-2 text-xs font-bold ${viewMode === 'WAVE' ? 'bg-gray-600 text-white' : 'text-gray-400'}`}><Waves size={14} /> 波形</button>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded text-gray-400 hover:text-white">
                    <X size={24} />
                </button>
            </div>
        </div>

        <div className="flex-1 p-6 overflow-hidden flex flex-col">
            
            {viewMode === 'GRAPH' && (
                <div className="flex-1 bg-med-card border border-gray-700 rounded-xl p-4 relative flex flex-col">
                    <div className="flex gap-6 mb-4 justify-center">
                        <div className="flex items-center gap-2 text-xs font-bold"><div className="w-3 h-3 bg-med-ecg rounded-full"></div> 心率 (HR)</div>
                        <div className="flex items-center gap-2 text-xs font-bold"><div className="w-3 h-3 bg-med-spo2 rounded-full"></div> 血氧 (SpO2)</div>
                        <div className="flex items-center gap-2 text-xs font-bold"><div className="w-3 h-3 bg-med-alert rounded-full"></div> 收缩压 (Sys)</div>
                    </div>
                    <div className="flex-1 relative w-full h-full">
                        <canvas ref={graphCanvasRef} className="w-full h-full block" />
                    </div>
                </div>
            )}

            {viewMode === 'TABLE' && (
                <div className="flex-1 bg-med-card border border-gray-700 rounded-xl overflow-hidden flex flex-col">
                    <div className="overflow-y-auto flex-1">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-800 text-gray-400 text-xs uppercase font-bold sticky top-0 z-10">
                                <tr>
                                    <th className="p-3 border-b border-gray-700">时间</th>
                                    <th className="p-3 border-b border-gray-700">HR (bpm)</th>
                                    <th className="p-3 border-b border-gray-700">SpO2 (%)</th>
                                    <th className="p-3 border-b border-gray-700">NIBP (mmHg)</th>
                                    <th className="p-3 border-b border-gray-700">RR (rpm)</th>
                                    <th className="p-3 border-b border-gray-700">Temp (°C)</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm divide-y divide-gray-800 text-gray-300 font-mono">
                                {trendData.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-gray-800/50">
                                        <td className="p-3">{row.timestamp.toLocaleTimeString()}</td>
                                        <td className={`p-3 ${row.hr > 100 ? 'text-red-400' : ''}`}>{row.hr}</td>
                                        <td className={`p-3 ${row.spo2 < 95 ? 'text-yellow-400' : ''}`}>{row.spo2}</td>
                                        <td className="p-3">{row.nibp_sys}/{row.nibp_dia}</td>
                                        <td className="p-3">{row.resp}</td>
                                        <td className="p-3">{row.temp}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {viewMode === 'WAVE' && (
                <div className="flex-1 flex flex-col bg-med-card border border-gray-700 rounded-xl overflow-hidden">
                    <div className="bg-gray-900/80 border-b border-gray-800 px-4 py-2 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-4">
                            <span className="font-bold text-gray-200 text-xs">波形全息回顾 (Full Disclosure)</span>
                            <span className="text-gray-500 text-xs">记录时长: 20 分钟 (模拟)</span>
                        </div>
                        <div className="text-[10px] text-gray-500 flex items-center gap-1">
                             拖动下方滚动条查看历史记录
                        </div>
                    </div>
                    <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar bg-black relative">
                        <canvas ref={waveCanvasRef} className="block h-full" />
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default PatientHistoryReview;
