
import { PatientData, AlarmRecord, IoTDevice, ApiResponse, DepartmentCode, PatientDisplaySettings, SystemSettings, TrendDataPoint, SystemDictionaries, AlarmSnapshot, DeviceDisplayConfig, AlarmThresholdItem, LoginResponse, DepartmentDTO, DeviceType, WaveformConfig, ParameterConfig, DepartmentPreferences } from '../types';

const API_BASE_URL = '/api';

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  const res: ApiResponse<T> = await response.json();
  if (res.code !== 200) {
    throw new Error(res.message || 'Unknown API Error');
  }
  return res.data;
}

export const loginApi = async (username: string, password: string): Promise<LoginResponse> => {
  return fetchApi<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
};

// --- System & Dictionaries ---

export const fetchDictionariesApi = async (): Promise<SystemDictionaries> => {
  return fetchApi<SystemDictionaries>('/system/dictionaries');
};

// Fetch ALL config for a department (Initialization)
// Now returns a simplified object matching the response of GET /departments/{id}/config
export const fetchGlobalConfig = async (departmentCode: string): Promise<any> => {
  return fetchApi<any>(`/departments/${departmentCode}/config`);
};

// --- Granular Config Updates ---

// 1. Bed Capacity & Labels
export const updateDepartmentCapacity = async (
  departmentCode: string,
  capacity: number,
  bedLabels: Record<string, string>
): Promise<void> => {
  return fetchApi<void>(`/departments/${departmentCode}/capacity`, {
    method: 'PUT',
    body: JSON.stringify({ capacity, bedLabels }),
  });
};

// 2. Device Configs (Waveforms/Params) - Split into specific updates

export const updateDeviceWaveformsApi = async (
  departmentCode: string,
  deviceType: string,
  waveforms: WaveformConfig[]
): Promise<void> => {
  return fetchApi<void>(`/departments/${departmentCode}/device-configs/${deviceType}/waveforms`, {
    method: 'PUT',
    body: JSON.stringify(waveforms),
  });
};

export const updateDeviceParametersApi = async (
  departmentCode: string,
  deviceType: string,
  parameters: ParameterConfig[]
): Promise<void> => {
  return fetchApi<void>(`/departments/${departmentCode}/device-configs/${deviceType}/parameters`, {
    method: 'PUT',
    body: JSON.stringify(parameters),
  });
};

// Deprecated: Kept for compatibility if needed, but UI now uses specific methods above
export const updateDepartmentDeviceConfig = async (
  departmentCode: string,
  deviceType: string,
  config: { waveforms: any[], parameters: any[] }
): Promise<void> => {
  return fetchApi<void>(`/departments/${departmentCode}/device-configs/${deviceType}`, {
    method: 'PUT',
    body: JSON.stringify(config),
  });
};

// 3. Alarm Thresholds
export const updateDepartmentAlarms = async (
  departmentCode: string,
  thresholds: AlarmThresholdItem[]
): Promise<void> => {
  return fetchApi<void>(`/departments/${departmentCode}/alarm-thresholds`, {
    method: 'PUT',
    body: JSON.stringify(thresholds),
  });
};

// 4. Department Preferences (Demo, Night Mode, etc.)
export const updateDepartmentPreferencesApi = async (
  departmentCode: string,
  preferences: DepartmentPreferences
): Promise<void> => {
  return fetchApi<void>(`/departments/${departmentCode}/preferences`, {
    method: 'PUT',
    body: JSON.stringify(preferences),
  });
};

// --- Department Management (Admin) ---

export const fetchDepartmentsApi = async (): Promise<DepartmentDTO[]> => {
  return fetchApi<DepartmentDTO[]>('/admin/departments');
};

export const createDepartmentApi = async (code: string, name: string, capacity: number): Promise<DepartmentDTO> => {
  return fetchApi<DepartmentDTO>('/admin/departments', {
    method: 'POST',
    body: JSON.stringify({ code, name, capacity }),
  });
};

export const deleteDepartmentApi = async (code: string): Promise<void> => {
  return fetchApi<void>(`/admin/departments/${code}`, {
    method: 'DELETE',
  });
};


// --- Patient & Bed Management ---

export const fetchAllPatientsApi = async (): Promise<PatientData[]> => {
  return fetchApi<PatientData[]>('/patients');
};

export const admitPatientApi = async (patient: Partial<PatientData>): Promise<string> => {
  return fetchApi<string>('/patients', {
    method: 'POST',
    body: JSON.stringify(patient),
  });
};

export const dischargePatientApi = async (patientId: string): Promise<void> => {
  return fetchApi<void>(`/patients/${patientId}`, {
    method: 'DELETE',
  });
};

// 更新床位显示配置
// 注意: 后端使用 bedNumber 而非 patientId
export const updatePatientConfigApi = async (bedNumber: string, settings: PatientDisplaySettings): Promise<void> => {
  return fetchApi<void>(`/patients/beds/${bedNumber}/config`, {
    method: 'PUT',
    body: JSON.stringify(settings),
  });
};

// --- History & Trends ---

export const fetchPatientTrendsApi = async (patientId: string, rangeHours: number): Promise<TrendDataPoint[]> => {
  const data = await fetchApi<any[]>(`/patients/${patientId}/trends?range=${rangeHours}`);
  return data.map(d => ({
    ...d,
    timestamp: new Date(d.timestamp)
  }));
};

// --- Device Management ---

export const fetchAvailableDevicesApi = async (): Promise<IoTDevice[]> => {
  return fetchApi<IoTDevice[]>('/devices/available');
};

// --- Alarm Management ---

export const fetchAlarmHistoryApi = async (department?: string): Promise<AlarmRecord[]> => {
  const query = department ? `?department=${department}` : '';
  const data = await fetchApi<any[]>(`/alarms${query}`);
  return data.map(a => ({
    ...a,
    timestamp: new Date(a.timestamp),
  }));
};

export const fetchAlarmSnapshotApi = async (alarmId: string): Promise<AlarmSnapshot> => {
  const data = await fetchApi<any>(`/alarms/${alarmId}/snapshot`);
  return {
    ...data,
    timestamp: new Date(data.timestamp)
  };
};
