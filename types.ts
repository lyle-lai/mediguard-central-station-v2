
// Enums: CODES for API/Logic
export enum VitalStatusCode {
  NORMAL = 'NORMAL',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
  DISCONNECTED = 'DISCONNECTED',
  STANDBY = 'STANDBY'
}

export enum DeviceTypeCode {
  MONITOR = 'MONITOR',
  VENTILATOR = 'VENTILATOR',
  ANESTHESIA = 'ANESTHESIA'
}

export enum DepartmentCode {
  ICU = 'ICU',
  OR = 'OR',
  ER = 'ER',
  NICU = 'NICU',
  GENERAL = 'GENERAL'
}

export enum AlarmCategoryCode {
  PHYSIOLOGICAL = 'PHYSIOLOGICAL', 
  TECHNICAL = 'TECHNICAL'
}

export enum UserRole {
  ADMIN = 'ADMIN',
  DOCTOR = 'DOCTOR',
  NURSE = 'NURSE'
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  PATIENTS = 'PATIENTS',
  ALARMS = 'ALARMS',
  SETTINGS = 'SETTINGS'
}

export enum AlarmPriority {
  HIGH = 'HIGH',
  MED = 'MED',
  LOW = 'LOW'
}

// Static Descriptors (Fallback if API dictionary fails)
export const VitalStatusDesc: Record<VitalStatusCode, string> = {
  [VitalStatusCode.NORMAL]: '正常',
  [VitalStatusCode.WARNING]: '警告',
  [VitalStatusCode.CRITICAL]: '危急',
  [VitalStatusCode.DISCONNECTED]: '断连',
  [VitalStatusCode.STANDBY]: '待机'
};

export const DeviceTypeDesc: Record<DeviceTypeCode, string> = {
  [DeviceTypeCode.MONITOR]: '监护仪',
  [DeviceTypeCode.VENTILATOR]: '呼吸机',
  [DeviceTypeCode.ANESTHESIA]: '麻醉机'
};

export const DepartmentDesc: Record<DepartmentCode, string> = {
  [DepartmentCode.ICU]: '重症医学科 (ICU)',
  [DepartmentCode.OR]: '手术室 (OR)',
  [DepartmentCode.ER]: '急诊科 (ER)',
  [DepartmentCode.NICU]: '新生儿科 (NICU)',
  [DepartmentCode.GENERAL]: '普通病房 (General)'
};

// Aliases
export type VitalStatus = VitalStatusCode;
export const VitalStatus = VitalStatusCode;
export type DeviceType = DeviceTypeCode;
export const DeviceType = DeviceTypeCode;
export type Department = DepartmentCode;
export const Department = DepartmentCode;
export type AlarmCategory = AlarmCategoryCode;
export const AlarmCategory = AlarmCategoryCode;


// --- Data Models ---

export interface DepartmentDTO {
    id: string;
    code: DepartmentCode;
    name: string;
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  // Removed 'department' field. 'departments' is the source of truth.
  departments: DepartmentDTO[];
  token?: string;
}

export interface Waveform {
  id: string;
  label: string;
  color: string;
  data: number[]; 
}

export interface Parameter {
  id: string;
  label: string;
  value: number | string;
  unit: string;
  isAlarm?: boolean;
}

export interface PatientDisplaySettings {
  visibleWaveformIds: string[];
  visibleParameterIds: string[];
}

export interface PatientData {
  id: string; 
  deviceId: string; // Physical device binding
  bedNumber: string;
  bedLabel?: string; // Custom display name for the bed
  department: DepartmentCode;
  deviceType: DeviceTypeCode;
  connectedDevices: DeviceTypeCode[];
  name: string;
  age: number;
  gender: '男' | '女';
  admissionId: string;
  status: VitalStatusCode;
  displaySettings?: PatientDisplaySettings;
  activeAlarm?: {
    message: string;
    category: AlarmCategoryCode;
    timestamp: Date;
    isAcknowledged?: boolean;
    priority?: AlarmPriority;
  };
  alarmDuration?: number; 
  violationCounters?: Record<string, number>; // Tracks duration of threshold violation
  parameters: Parameter[];
  waveforms: Waveform[];
}

export interface AlarmSnapshot {
  id?: string;
  timestamp: Date;
  waveforms: Waveform[];
  parameters: Parameter[];
}

export interface AlarmRecord {
  id: string;
  timestamp: Date;
  patientId: string;
  patientName: string;
  department: DepartmentCode;
  bedNumber: string;
  deviceType: DeviceTypeCode;
  type: VitalStatusCode;
  category: AlarmCategoryCode;
  message: string;
  acknowledged: boolean;
  snapshot?: AlarmSnapshot;
}

// DTO for Trend History API
export interface TrendDataPoint {
  timestamp: Date;
  hr: number;
  spo2: number;
  nibp_sys: number;
  nibp_dia: number;
  resp: number;
  temp: number;
  co2?: number;
}

// --- Config Models ---

export interface WaveformConfig {
  id: string;
  label: string;
  visible: boolean;
  color: string;
  order: number;
}

export interface ParameterConfig {
  id: string;
  label: string;
  unit: string;
  visible: boolean;
  order: number;
}

export type DeviceDisplayConfig = {
  [key in DeviceTypeCode]: {
    waveforms: WaveformConfig[];
    parameters: ParameterConfig[];
  };
};

export interface AlarmThresholdItem {
    paramId: string;
    label: string;
    min?: number;
    max?: number;
    delay: number; // seconds
    priority: AlarmPriority;
    enabled: boolean;
}

export type AlarmRule = AlarmThresholdItem;

export interface SystemSettings {
  isDemoMode: boolean;
  layoutMode: 'compact' | 'standard' | 'large';
  audioEnabled: boolean;
  simulationSpeed: number;
  filterType: DeviceTypeCode | 'ALL';
  // CHANGED: Map Department -> Config
  deviceConfigs: Record<DepartmentCode, DeviceDisplayConfig>;
  deptCapacity: Record<DepartmentCode, number>;
  // CHANGED: Map Department -> Thresholds
  alarmThresholds: Record<DepartmentCode, AlarmThresholdItem[]>;
  // NEW: Map Dept -> BedID -> CustomLabel
  bedLabels: Record<DepartmentCode, Record<string, string>>; 
  nightMode: boolean;
}

export interface IoTDevice {
  deviceId: string;
  serialNumber: string;
  deviceType: DeviceTypeCode;
  department: DepartmentCode;
  status: 'ONLINE' | 'OFFLINE';
  ipAddress: string;
}

// --- API DTOs ---

export interface DictionaryItem {
    code: string;
    label: string;
    capacity?: number;
}

export interface SystemDictionaries {
    deviceTypes: DictionaryItem[];
    departments: DictionaryItem[]; // Should remain for Admin assignment/reference
    alarmLevels: DictionaryItem[];
}

// WebSocket Message (Batch)
export interface DeviceRealtimeDataDTO {
  deviceId: string; // KEY: Device ID only
  timestamp: number;
  seq?: number;
  // Waveforms are arrays (Batch of points, e.g. 1 second worth)
  // Key: waveform ID (ecg, spo2), Value: Array of numbers
  waveforms: Record<string, number[]>; 
  // Parameters can be sparse (key-value)
  parameters: Record<string, string | number>;
  // Active alarms list
  activeAlarms?: { code: string; msg: string; level: VitalStatusCode }[];
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface LoginResponse {
  token: string;
  user: User;
}
