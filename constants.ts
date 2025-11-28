
import { DeviceDisplayConfig, DeviceTypeCode, DepartmentCode, User, UserRole, AlarmThresholdItem, AlarmPriority } from "./types";

export const MAX_WAVEFORM_POINTS = 300; 
export const UPDATE_INTERVAL_MS = 100; 

export const AI_SYSTEM_INSTRUCTION = `You are an expert medical AI assistant specialized in analyzing vital signs from ICU monitors, Ventilators, and Anesthesia machines.
Your goal is to identify potential clinical risks (e.g., respiratory distress, hemodynamic instability, equipment failure) based on the provided numeric parameters.
Provide concise, actionable recommendations for medical staff. 
Always use professional medical terminology in Chinese.`;

export const WAVEFORM_COLORS = {
  ECG: '#00ff41',   // Green
  SPO2: '#00d0ff',  // Blue/Cyan
  RESP: '#ffea00',  // Yellow
  CO2: '#ffffff',   // White
  PAW: '#ff9500',   // Orange
  FLOW: '#34d399',  // Emerald
  GAS: '#a855f7',   // Purple
  ART: '#ff3b30',   // Red
  CVP: '#3b82f6',   // Blue
};

export const MOCK_USERS: (User & { password: string })[] = [
  { 
      id: 'u1', username: 'admin', password: '123', name: '系统管理员', role: UserRole.ADMIN,
      departments: [
          { id: 'd1', code: DepartmentCode.ICU, name: '重症医学科' },
          { id: 'd2', code: DepartmentCode.OR, name: '手术室' },
          { id: 'd3', code: DepartmentCode.ER, name: '急诊科' },
          { id: 'd4', code: DepartmentCode.GENERAL, name: '普通病房' },
          { id: 'd5', code: DepartmentCode.NICU, name: '新生儿科' }
      ] 
  },
  { 
      id: 'u2', username: 'icu', password: '123', name: '张护士长', role: UserRole.NURSE,
      departments: [{ id: 'd1', code: DepartmentCode.ICU, name: '重症医学科' }]
  },
  { 
      id: 'u3', username: 'or', password: '123', name: '李麻醉师', role: UserRole.DOCTOR,
      departments: [{ id: 'd2', code: DepartmentCode.OR, name: '手术室' }]
  },
  { 
      id: 'u4', username: 'er', password: '123', name: '王急诊医', role: UserRole.DOCTOR,
      departments: [{ id: 'd3', code: DepartmentCode.ER, name: '急诊科' }]
  },
  { 
      id: 'u5', username: 'gen', password: '123', name: '刘护士', role: UserRole.NURSE,
      departments: [{ id: 'd4', code: DepartmentCode.GENERAL, name: '普通病房' }]
  }
];

export const DEFAULT_DEPT_CAPACITY: Record<DepartmentCode, number> = {
    [DepartmentCode.ICU]: 16,
    [DepartmentCode.OR]: 8,
    [DepartmentCode.ER]: 12,
    [DepartmentCode.NICU]: 10,
    [DepartmentCode.GENERAL]: 20
};

// BASE CONFIGS (Single Instance templates)
const BASE_ALARM_THRESHOLDS: AlarmThresholdItem[] = [
    { paramId: 'hr', label: '心率 (HR)', max: 120, min: 50, delay: 2, priority: AlarmPriority.HIGH, enabled: true },
    { paramId: 'spo2', label: '血氧 (SpO2)', min: 90, delay: 5, priority: AlarmPriority.HIGH, enabled: true },
    { paramId: 'resp', label: '呼吸率 (RR)', max: 30, min: 8, delay: 10, priority: AlarmPriority.MED, enabled: true },
    { paramId: 'nibp_sys', label: '收缩压 (Sys)', max: 160, min: 90, delay: 5, priority: AlarmPriority.MED, enabled: true },
    { paramId: 'etco2', label: 'EtCO2', max: 45, min: 30, delay: 5, priority: AlarmPriority.MED, enabled: true },
    { paramId: 'ppeak', label: '气道峰压', max: 40, delay: 1, priority: AlarmPriority.HIGH, enabled: true },
];

const BASE_DEVICE_CONFIG: DeviceDisplayConfig = {
  [DeviceTypeCode.MONITOR]: {
    waveforms: [
      { id: 'ecg', label: '心电 I导联 (ECG-I)', visible: true, color: '#00ff41', order: 1 },
      { id: 'ecg_ii', label: '心电 II导联 (ECG-II)', visible: false, color: '#00ff41', order: 2 },
      { id: 'spo2', label: '血氧 (SpO2)', visible: true, color: '#00d0ff', order: 3 },
      { id: 'art', label: '有创血压 (ART)', visible: false, color: '#ff3b30', order: 4 },
      { id: 'resp', label: '呼吸 (Resp)', visible: true, color: '#ffea00', order: 5 },
      { id: 'cvp', label: '中心静脉压 (CVP)', visible: false, color: '#3b82f6', order: 6 },
    ],
    parameters: [
      { id: 'hr', label: 'HR', unit: 'bpm', visible: true, order: 1 },
      { id: 'spo2', label: 'SpO2', unit: '%', visible: true, order: 2 },
      { id: 'nibp', label: 'NIBP', unit: 'mmHg', visible: true, order: 3 },
      { id: 'resp', label: 'RR', unit: 'rpm', visible: true, order: 4 },
      { id: 'temp', label: 'Temp', unit: '°C', visible: true, order: 5 },
      { id: 'cvp', label: 'CVP', unit: 'mmHg', visible: false, order: 6 },
    ]
  },
  [DeviceTypeCode.VENTILATOR]: {
    waveforms: [
      { id: 'paw', label: '气道压力 (Paw)', visible: true, color: '#ff9500', order: 1 },
      { id: 'flow', label: '流速 (Flow)', visible: true, color: '#34d399', order: 2 },
      { id: 'vol', label: '容量 (Volume)', visible: true, color: '#00d0ff', order: 3 },
      { id: 'aux', label: '辅助压力 (Paux)', visible: false, color: '#a855f7', order: 4 },
    ],
    parameters: [
      { id: 'ppeak', label: 'Ppeak', unit: 'cmH2O', visible: true, order: 1 },
      { id: 'vte', label: 'VTe', unit: 'ml', visible: true, order: 2 },
      { id: 'mv', label: 'MV', unit: 'L/min', visible: true, order: 3 },
      { id: 'fio2', label: 'FiO2', unit: '%', visible: true, order: 4 },
      { id: 'peep', label: 'PEEP', unit: 'cmH2O', visible: true, order: 5 },
      { id: 'freq', label: 'fTotal', unit: 'bpm', visible: true, order: 6 },
    ]
  },
  [DeviceTypeCode.ANESTHESIA]: {
    waveforms: [
      { id: 'co2', label: '二氧化碳 (CO2)', visible: true, color: '#ffffff', order: 1 },
      { id: 'ecg', label: '心电 (ECG)', visible: true, color: '#00ff41', order: 2 },
      { id: 'pleth', label: '血氧 (Pleth)', visible: true, color: '#00d0ff', order: 3 },
      { id: 'agent', label: '麻醉气体 (Agent)', visible: false, color: '#a855f7', order: 4 },
    ],
    parameters: [
      { id: 'etco2', label: 'EtCO2', unit: 'mmHg', visible: true, order: 1 },
      { id: 'spo2', label: 'SpO2', unit: '%', visible: true, order: 2 },
      { id: 'mac', label: 'MAC', unit: '', visible: true, order: 3 },
      { id: 'fio2', label: 'FiO2', unit: '%', visible: true, order: 4 },
      { id: 'hr', label: 'HR', unit: 'bpm', visible: true, order: 5 },
    ]
  }
};

// GENERATE DEPARTMENT-SPECIFIC MAPS
export const DEFAULT_DEVICE_CONFIGS: Record<DepartmentCode, DeviceDisplayConfig> = {} as any;
export const DEFAULT_ALARM_THRESHOLDS: Record<DepartmentCode, AlarmThresholdItem[]> = {} as any;
export const DEFAULT_BED_LABELS: Record<DepartmentCode, Record<string, string>> = {} as any;

Object.values(DepartmentCode).forEach(dept => {
    DEFAULT_DEVICE_CONFIGS[dept] = JSON.parse(JSON.stringify(BASE_DEVICE_CONFIG));
    DEFAULT_ALARM_THRESHOLDS[dept] = JSON.parse(JSON.stringify(BASE_ALARM_THRESHOLDS));
    DEFAULT_BED_LABELS[dept] = {};
});
