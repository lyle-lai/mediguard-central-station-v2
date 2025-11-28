
import { PatientData, VitalStatus, DeviceType, Parameter, Waveform, DeviceDisplayConfig, Department, IoTDevice, AlarmRecord, AlarmCategory, AlarmSnapshot, AlarmThresholdItem, AlarmPriority, DepartmentCode } from '../types';
import { MAX_WAVEFORM_POINTS, DEFAULT_DEVICE_CONFIGS, DEFAULT_DEPT_CAPACITY, DEFAULT_ALARM_THRESHOLDS } from '../constants';
import * as MathUtils from '../utils/waveformMath';

let timeStep = 0;

const getPrevData = (p: PatientData, id: string): number[] => {
    const existing = p.waveforms.find(w => w.id === id);
    if (existing && existing.data.length >= MAX_WAVEFORM_POINTS) {
        return existing.data.slice(1);
    }
    return new Array(MAX_WAVEFORM_POINTS - 1).fill(50);
};

// Config passed here is for a SINGLE department
const updateDeviceWaveforms = (p: PatientData, deviceType: DeviceType, config: DeviceDisplayConfig, tOffset: number): Waveform[] => {
    const deviceConfig = config[deviceType]?.waveforms || DEFAULT_DEVICE_CONFIGS[p.department][deviceType].waveforms;
    const configIds = deviceConfig.map(c => c.id);

    const isLeadOff = p.activeAlarm?.category === AlarmCategory.TECHNICAL && p.activeAlarm.message.includes('脱落');
    const isStandby = p.status === VitalStatus.STANDBY;

    return configIds.map(id => {
        const prevData = getPrevData(p, id);
        let newValue = 50;

        if (isStandby) {
            newValue = 50;
        } else if (isLeadOff && (id.includes('ecg') || id.includes('spo2'))) {
             newValue = 50 + (Math.random() * 2 - 1); 
        } else {
            const t = timeStep * 1.5 + tOffset;
            if (id.includes('ecg')) newValue = MathUtils.generateECG(t, id === 'ecg' ? 0 : 20);
            else if (id.includes('spo2') || id.includes('pleth')) newValue = MathUtils.generatePleth(t);
            else if (id.includes('resp')) newValue = MathUtils.generateResp(timeStep + tOffset);
            else if (id.includes('co2') || id.includes('etco2')) newValue = MathUtils.generateCO2(t);
            else if (id.includes('paw')) newValue = MathUtils.generatePaw(t);
            else if (id.includes('flow')) newValue = MathUtils.generateFlow(t);
            else if (id.includes('art')) newValue = MathUtils.generateART(t);
            else if (id.includes('cvp')) newValue = MathUtils.generateCVP(t);
            else if (id.includes('agent')) newValue = MathUtils.generateAgent(timeStep + tOffset);
            else if (id.includes('vol')) newValue = MathUtils.generateResp(timeStep + tOffset); 
            else {
                const seed = id.split('').reduce((a,b) => a + b.charCodeAt(0), 0);
                newValue = MathUtils.generateGeneric(t, seed);
            }
        }

        const conf = deviceConfig.find(c => c.id === id);
        return {
            id,
            label: conf ? conf.label : id.toUpperCase(),
            color: isStandby ? '#4b5563' : (conf ? conf.color : '#ffffff'), 
            data: [...prevData, newValue]
        };
    });
};

const updateDeviceParameters = (p: PatientData, deviceType: DeviceType, config: DeviceDisplayConfig, tOffset: number, forceAlarm: boolean): Parameter[] => {
    let hrBase = 75 + 10 * Math.sin(timeStep * 0.01 + tOffset);
    let spo2Base = 97 + 2 * Math.sin(timeStep * 0.005 + tOffset);
    const isStandby = p.status === VitalStatus.STANDBY;

    if (forceAlarm && !isStandby) {
        if (deviceType === DeviceType.VENTILATOR) {
            // Vent logic usually Ppeak
        } else {
            hrBase = 155 + Math.random() * 10; 
            spo2Base = 88 + Math.random() * 2; 
        }
    }

    const deviceParamsConfig = config[deviceType]?.parameters || DEFAULT_DEVICE_CONFIGS[p.department][deviceType].parameters;

    return deviceParamsConfig.map(conf => {
        let val: string | number = '--';
        
        if (!isStandby) {
            switch (conf.id) {
                case 'hr': val = Math.round(hrBase); break;
                case 'spo2': val = Math.round(spo2Base); break;
                case 'nibp': val = '120/80'; break;
                case 'resp': val = Math.round(18 + 4 * Math.sin(timeStep * 0.02 + tOffset)); break;
                case 'temp': val = 37.1; break;
                case 'etco2': val = 38; break;
                case 'ppeak': val = forceAlarm && deviceType === DeviceType.VENTILATOR ? 45 : 25; break;
                case 'vte': val = 480; break;
                case 'mv': val = '7.5'; break;
                case 'fio2': val = 45; break;
                case 'mac': val = (1.1 + 0.1 * Math.sin(timeStep * 0.01)).toFixed(1); break;
                case 'energy': val = 200; break;
                case 'cvp': val = 8; break;
                default:
                    const seed = conf.id.split('').reduce((a,b) => a + b.charCodeAt(0), 0);
                    val = Math.round(50 + 20 * Math.sin(timeStep * 0.05 + seed));
                    break;
            }
        }

        return {
            id: conf.id,
            label: conf.label,
            value: val,
            unit: conf.unit,
            isAlarm: false 
        };
    });
};

const createPatientInBed = (dept: Department, bedNum: string): PatientData => {
  const rand = Math.random();
  let primaryType: DeviceType;
  let connectedDevices: DeviceType[] = [];

  if (dept === Department.ICU) { 
      if (rand < 0.2) {
          primaryType = DeviceType.VENTILATOR;
          connectedDevices.push(DeviceType.VENTILATOR);
      } else {
          primaryType = DeviceType.MONITOR;
          connectedDevices.push(DeviceType.MONITOR);
          if (rand > 0.6) connectedDevices.push(DeviceType.VENTILATOR);
      }
  }
  else if (dept === Department.OR) { 
      primaryType = DeviceType.ANESTHESIA; 
      connectedDevices.push(DeviceType.ANESTHESIA);
      if (rand > 0.5) connectedDevices.push(DeviceType.MONITOR);
  }
  else if (dept === Department.ER) { 
      primaryType = DeviceType.MONITOR; 
      connectedDevices.push(primaryType);
  }
  else { 
      primaryType = DeviceType.MONITOR; 
      connectedDevices.push(DeviceType.MONITOR);
  }

  connectedDevices = Array.from(new Set(connectedDevices));
  const startWithAlarm = Math.random() < 0.05; 
  const isStandby = Math.random() < 0.1;

  return {
    id: `dev_${bedNum}_${Date.now()}`,
    deviceId: `iot_${bedNum}_${Math.floor(Math.random() * 10000)}`,
    bedNumber: bedNum,
    department: dept,
    deviceType: primaryType,
    connectedDevices: connectedDevices,
    name: generateRandomName(),
    age: 30 + Math.floor(Math.random() * 50),
    gender: Math.random() > 0.5 ? '男' : '女',
    admissionId: `ZY-${2024000 + Math.floor(Math.random() * 1000)}`,
    status: isStandby ? VitalStatus.STANDBY : (startWithAlarm ? VitalStatus.CRITICAL : VitalStatus.NORMAL),
    parameters: [],
    waveforms: [], 
    alarmDuration: startWithAlarm ? 500 : 0,
    violationCounters: {} 
  };
};

const generateRandomName = () => {
    const surnames = ['张', '李', '王', '赵', '陈', '刘', '杨', '黄', '吴', '周'];
    const names = ['伟', '芳', '娜', '敏', '静', '秀', '强', '军', '磊', '洋'];
    return surnames[Math.floor(Math.random() * surnames.length)] + names[Math.floor(Math.random() * names.length)];
};

export const generateInitialData = (): PatientData[] => {
  const patients: PatientData[] = [];
  Object.values(Department).forEach(dept => {
      const capacity = DEFAULT_DEPT_CAPACITY[dept];
      const prefix = dept.split(' ')[0] === '重症医学科' ? 'ICU' 
                   : dept.split(' ')[0] === '手术室' ? 'OR' 
                   : dept.split(' ')[0] === '急诊科' ? 'ER' 
                   : dept.split(' ')[0] === '新生儿科' ? 'N' : 'Gen';

      for (let i = 1; i <= capacity; i++) {
          if (Math.random() > 0.3) {
              const bedNum = `${prefix}-${String(i).padStart(2, '0')}`;
              patients.push(createPatientInBed(dept, bedNum));
          }
      }
  });
  return patients;
};

export const forceTriggerAlarm = (patients: PatientData[], department: Department): PatientData[] => {
    const candidates = patients.filter(p => p.department === department && p.status !== VitalStatus.STANDBY);
    if (candidates.length === 0) return patients;
    const victim = candidates[Math.floor(Math.random() * candidates.length)];
    
    return patients.map(p => {
        if (p.id === victim.id) {
            return { ...p, alarmDuration: 100 }; 
        }
        return p;
    });
};

// --- RULE ENGINE ---
const checkAlarmRules = (params: Parameter[], thresholds: AlarmThresholdItem[], violations: Record<string, number>): { 
    activeAlarm?: { message: string, category: AlarmCategory, priority: AlarmPriority }, 
    newViolations: Record<string, number>,
    triggeredParams: string[]
} => {
    const newViolations = { ...violations };
    const triggeredParams: string[] = [];
    let highestPriorityAlarm: { message: string, category: AlarmCategory, priority: AlarmPriority } | undefined = undefined;

    const isHigherPriority = (a: AlarmPriority, b: AlarmPriority) => {
        if (a === AlarmPriority.HIGH) return true;
        if (a === AlarmPriority.MED && b === AlarmPriority.LOW) return true;
        return false;
    };

    thresholds.forEach(rule => {
        if (!rule.enabled) return;
        
        const param = params.find(p => p.id === rule.paramId);
        if (!param || typeof param.value !== 'number') {
            newViolations[rule.paramId] = 0; 
            return;
        }

        const val = param.value;
        let violating = false;
        let msg = '';

        if (rule.max !== undefined && val > rule.max) {
            violating = true;
            msg = `${rule.label} 过高 (${val} > ${rule.max})`;
        } else if (rule.min !== undefined && val < rule.min) {
            violating = true;
            msg = `${rule.label} 过低 (${val} < ${rule.min})`;
        }

        if (violating) {
            newViolations[rule.paramId] = (newViolations[rule.paramId] || 0) + 0.1; 
            
            if (newViolations[rule.paramId] >= rule.delay) {
                triggeredParams.push(rule.paramId);
                if (!highestPriorityAlarm || isHigherPriority(rule.priority, highestPriorityAlarm.priority)) {
                    highestPriorityAlarm = {
                        message: msg,
                        category: AlarmCategory.PHYSIOLOGICAL,
                        priority: rule.priority
                    };
                }
            }
        } else {
            newViolations[rule.paramId] = 0; 
        }
    });

    return { activeAlarm: highestPriorityAlarm, newViolations, triggeredParams };
};

export const simulateNextTick = (
    currentPatients: PatientData[], 
    speed: number, 
    // Update: Map instead of Single Config
    deviceConfigsMap?: Record<DepartmentCode, DeviceDisplayConfig>,
    // Update: Map instead of Single Array
    alarmThresholdsMap?: Record<DepartmentCode, AlarmThresholdItem[]>
): PatientData[] => {
  timeStep += speed;

  return currentPatients.map((p, idx) => {
    // Lookup config for this patient's department
    const configToUse = deviceConfigsMap ? deviceConfigsMap[p.department] : DEFAULT_DEVICE_CONFIGS[p.department];
    const thresholdsToUse = alarmThresholdsMap ? alarmThresholdsMap[p.department] : DEFAULT_ALARM_THRESHOLDS[p.department];

    const isStandby = p.status === VitalStatus.STANDBY;

    if (isStandby) {
        const offset = idx * 123; 
        let combinedParams: Parameter[] = [];
        let combinedWaves: Waveform[] = [];

        p.connectedDevices.forEach(dType => {
            const dParams = updateDeviceParameters(p, dType, configToUse, offset, false);
            const dWaves = updateDeviceWaveforms(p, dType, configToUse, offset);
            dParams.forEach(np => { if (!combinedParams.find(cp => cp.id === np.id)) combinedParams.push(np); });
            dWaves.forEach(nw => { if (!combinedWaves.find(cw => cw.id === nw.id)) combinedWaves.push(nw); });
        });

        return { ...p, activeAlarm: undefined, alarmDuration: 0, parameters: combinedParams, waveforms: combinedWaves, violationCounters: {} };
    }

    const remainingAlarm = p.alarmDuration ? Math.max(0, p.alarmDuration - 1) : 0;
    let newAlarmDuration = remainingAlarm;

    if (newAlarmDuration === 0 && Math.random() < 0.001) { 
        newAlarmDuration = 60;
    }

    const isForcedAlarm = newAlarmDuration > 0;
    const offset = idx * 123; 

    let combinedParams: Parameter[] = [];
    let combinedWaves: Waveform[] = [];

    p.connectedDevices.forEach(dType => {
        const dParams = updateDeviceParameters(p, dType, configToUse, offset, isForcedAlarm);
        const dWaves = updateDeviceWaveforms(p, dType, configToUse, offset);
        dParams.forEach(np => { if (!combinedParams.find(cp => cp.id === np.id)) combinedParams.push(np); });
        dWaves.forEach(nw => { if (!combinedWaves.find(cw => cw.id === nw.id)) combinedWaves.push(nw); });
    });

    let status = VitalStatus.NORMAL;
    let activeAlarm = p.activeAlarm; 
    let violations = p.violationCounters || {};

    if (thresholdsToUse) {
        const result = checkAlarmRules(combinedParams, thresholdsToUse, violations);
        violations = result.newViolations;
        
        if (result.activeAlarm) {
            combinedParams = combinedParams.map(cp => ({ ...cp, isAlarm: result.triggeredParams.includes(cp.id) }));
            status = result.activeAlarm.priority === AlarmPriority.HIGH ? VitalStatus.CRITICAL : VitalStatus.WARNING;
            const isSameMsg = activeAlarm?.message === result.activeAlarm.message;
            activeAlarm = {
                message: result.activeAlarm.message,
                category: result.activeAlarm.category,
                timestamp: activeAlarm ? activeAlarm.timestamp : new Date(),
                isAcknowledged: (activeAlarm?.isAcknowledged && isSameMsg) || false,
                priority: result.activeAlarm.priority
            };
        } else {
            if (isForcedAlarm && Math.random() > 0.8 && !activeAlarm) {
                 status = VitalStatus.WARNING;
                 activeAlarm = {
                     message: 'SpO2 探头脱落', category: AlarmCategory.TECHNICAL, timestamp: new Date(),
                     isAcknowledged: false, priority: AlarmPriority.MED
                 };
            } else if (!isForcedAlarm) {
                activeAlarm = undefined;
            }
        }
    }

    return { ...p, status, activeAlarm, alarmDuration: newAlarmDuration, parameters: combinedParams, waveforms: combinedWaves, violationCounters: violations };
  });
};

export const captureAlarmSnapshot = (patient: PatientData): AlarmSnapshot => {
    return {
        timestamp: new Date(),
        waveforms: JSON.parse(JSON.stringify(patient.waveforms)),
        parameters: JSON.parse(JSON.stringify(patient.parameters))
    };
};

export const generateInitialAlarms = (patients: PatientData[]): AlarmRecord[] => {
    const alarms: AlarmRecord[] = [];
    const count = 15;
    const now = Date.now();

    for (let i = 0; i < count; i++) {
        const randomPatient = patients[Math.floor(Math.random() * patients.length)];
        const timeOffset = Math.floor(Math.random() * 24 * 3600 * 1000);
        const timestamp = new Date(now - timeOffset);
        const isPhysiological = Math.random() > 0.3;
        const category = isPhysiological ? AlarmCategory.PHYSIOLOGICAL : AlarmCategory.TECHNICAL;
        const type = Math.random() > 0.6 ? VitalStatus.CRITICAL : VitalStatus.WARNING;
        let message = '';
        if (category === AlarmCategory.PHYSIOLOGICAL) {
            const msgs = ['HR > 120 bpm', 'SpO2 < 90%', 'Resp > 30 rpm', 'Apnea detected', 'PVCs detected', 'ST Elevation'];
            message = msgs[Math.floor(Math.random() * msgs.length)];
        } else {
             const msgs = ['SpO2 Sensor Off', 'ECG Lead Off', 'Battery Low', 'Network Unstable'];
             message = msgs[Math.floor(Math.random() * msgs.length)];
        }
        alarms.push({
            id: `alarm_hist_${i}`, timestamp: timestamp, patientId: randomPatient.id, patientName: randomPatient.name,
            department: randomPatient.department, bedNumber: randomPatient.bedNumber, deviceType: randomPatient.deviceType,
            type: type, category: category, message: message, acknowledged: Math.random() > 0.4,
            snapshot: captureAlarmSnapshot(randomPatient) 
        });
    }
    return alarms.sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime());
}

export const fetchAvailableIoTDevices = async (): Promise<IoTDevice[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const devices: IoTDevice[] = [];
            const depts = Object.values(Department);
            const types = Object.values(DeviceType);
            for(let i=0; i<12; i++) {
                const dept = depts[Math.floor(Math.random() * depts.length)];
                const type = types[Math.floor(Math.random() * types.length)];
                devices.push({
                    deviceId: `iot_pool_${i}`, serialNumber: `SN-${10000 + i}`, deviceType: type,
                    department: dept, status: 'ONLINE', ipAddress: `10.0.1.${50 + i}`
                });
            }
            resolve(devices);
        }, 600);
    });
}
