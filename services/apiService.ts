
import { PatientData, AlarmRecord, IoTDevice, ApiResponse, DepartmentCode, PatientDisplaySettings, SystemSettings, TrendDataPoint, SystemDictionaries, AlarmSnapshot, DeviceDisplayConfig, AlarmThresholdItem } from '../types';

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

// --- System & Dictionaries ---

export const fetchDictionariesApi = async (): Promise<SystemDictionaries> => {
    return fetchApi<SystemDictionaries>('/system/dictionaries');
};

// Fetch ALL config for a department (Initialization)
// Now returns a simplified object matching the response of GET /departments/{id}/config
export const fetchGlobalConfig = async (departmentCode: DepartmentCode): Promise<Partial<SystemSettings>> => {
    return fetchApi<Partial<SystemSettings>>(`/departments/${departmentCode}/config`);
};

// --- Granular Config Updates ---

// 1. Bed Capacity & Labels
export const updateDepartmentCapacity = async (
    departmentCode: DepartmentCode, 
    capacity: number, 
    bedLabels: Record<string, string>
): Promise<void> => {
    return fetchApi<void>(`/departments/${departmentCode}/capacity`, {
        method: 'PUT',
        body: JSON.stringify({ capacity, bedLabels }),
    });
};

// 2. Device Configs (Waveforms/Params)
export const updateDepartmentDeviceConfig = async (
    departmentCode: DepartmentCode, 
    config: DeviceDisplayConfig
): Promise<void> => {
    return fetchApi<void>(`/departments/${departmentCode}/device-configs`, {
        method: 'PUT',
        body: JSON.stringify(config),
    });
};

// 3. Alarm Thresholds
export const updateDepartmentAlarms = async (
    departmentCode: DepartmentCode, 
    thresholds: AlarmThresholdItem[]
): Promise<void> => {
    return fetchApi<void>(`/departments/${departmentCode}/alarm-thresholds`, {
        method: 'PUT',
        body: JSON.stringify(thresholds),
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

export const updatePatientConfigApi = async (patientId: string, settings: PatientDisplaySettings): Promise<void> => {
  return fetchApi<void>(`/patients/${patientId}/config`, {
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

export const fetchAlarmHistoryApi = async (department?: DepartmentCode): Promise<AlarmRecord[]> => {
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
