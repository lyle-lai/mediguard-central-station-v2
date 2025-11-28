# MediGuard CMS - API 接口文档 v3.5 (Complete)

本文档基于前端代码 (`services/apiService.ts`, `types.ts`) 及最新重构逻辑整理，定义了前端与后端交互的完整契约。

## 1. 基础信息 (Base Info)

*   **Base URL**: `/api`
*   **WebSocket URL**: `ws://localhost:8080/ws-mediguard`
*   **Content-Type**: `application/json`
*   **鉴权方式**: HTTP Header `Authorization: Bearer <token>`
*   **通用响应结构**:

```json
{
  "code": 200,
  "message": "success",
  "data": {} 
}
```

---

## 2. 认证模块 (Authentication)

### 2.1 用户登录
**说明**: 获取访问令牌及用户信息。
**URL**: `/auth/login`
**Method**: `POST`

**Request Body**:
```json
{
  "username": "admin",
  "password": "123"
}
```

**Response Body**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsImV4cCI6MTcxNjIzOTAyMn0.signature_string",
    "user": {
      "id": "u1",
      "username": "admin",
      "name": "系统管理员",
      "role": "ADMIN",
      "departments": [
        { "id": "d1", "code": "ICU", "name": "重症医学科" },
        { "id": "d2", "code": "OR", "name": "手术室" },
        { "id": "d3", "code": "ER", "name": "急诊科" }
      ]
    }
  }
}
```

---

## 3. 系统与科室配置 (System & Config)

### 3.1 获取系统字典
**说明**: 获取设备类型、科室列表、报警级别等静态字典数据。
**URL**: `/system/dictionaries`
**Method**: `GET`

**Response Body**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "deviceTypes": [
      { "code": "MONITOR", "label": "监护仪" },
      { "code": "VENTILATOR", "label": "呼吸机" },
      { "code": "ANESTHESIA", "label": "麻醉机" }
    ],
    "departments": [
      { "code": "ICU", "label": "重症医学科", "capacity": 20 },
      { "code": "OR", "label": "手术室", "capacity": 8 },
      { "code": "ER", "label": "急诊科", "capacity": 12 }
    ],
    "alarmLevels": [
      { "code": "CRITICAL", "label": "危急" },
      { "code": "WARNING", "label": "警告" },
      { "code": "NORMAL", "label": "正常" }
    ]
  }
}
```

### 3.2 获取科室完整配置
**说明**: 获取指定科室的全局配置，包括床位容量、自定义床位标签、设备显示模板、报警阈值。
**URL**: `/departments/{departmentCode}/config`
**Method**: `GET`
**Path Params**: `departmentCode` (例如: `ICU`)

**Response Body**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "deptCapacity": {
      "ICU": 20
    },
    "bedLabels": {
      "ICU": {
        "ICU-01": "VIP-1",
        "ICU-02": "隔离床"
      }
    },
    "deviceConfigs": {
      "ICU": {
        "MONITOR": {
          "waveforms": [
             { "id": "ecg", "label": "ECG I", "visible": true, "color": "#00ff41", "order": 1 },
             { "id": "spo2", "label": "SpO2", "visible": true, "color": "#00d0ff", "order": 2 },
             { "id": "resp", "label": "Resp", "visible": true, "color": "#ffea00", "order": 3 }
          ],
          "parameters": [
             { "id": "hr", "label": "HR", "unit": "bpm", "visible": true, "order": 1 },
             { "id": "spo2", "label": "SpO2", "unit": "%", "visible": true, "order": 2 },
             { "id": "nibp", "label": "NIBP", "unit": "mmHg", "visible": true, "order": 3 }
          ]
        },
        "VENTILATOR": {
          "waveforms": [
             { "id": "paw", "label": "Paw", "visible": true, "color": "#ff9500", "order": 1 }
          ],
          "parameters": [
             { "id": "ppeak", "label": "Ppeak", "unit": "cmH2O", "visible": true, "order": 1 }
          ]
        },
        "ANESTHESIA": {
           "waveforms": [],
           "parameters": []
        }
      }
    },
    "alarmThresholds": {
      "ICU": [
        {
          "paramId": "hr",
          "label": "心率",
          "min": 50,
          "max": 120,
          "delay": 2,
          "priority": "HIGH",
          "enabled": true
        },
        {
          "paramId": "spo2",
          "label": "血氧",
          "min": 90,
          "max": 100,
          "delay": 5,
          "priority": "HIGH",
          "enabled": true
        }
      ]
    }
  }
}
```

### 3.3 更新床位容量与标签
**说明**: 调整科室床位数量及自定义床位名称。
**URL**: `/departments/{departmentCode}/capacity`
**Method**: `PUT`
**Path Params**: `departmentCode` (例如: `ICU`)

**Request Body**:
```json
{
  "capacity": 24,
  "bedLabels": {
    "ICU-01": "VIP-New",
    "ICU-05": "负压病房",
    "ICU-08": "ICU-08"
  }
}
```

**Response Body**:
```json
{ "code": 200, "message": "success", "data": null }
```

### 3.4 更新设备显示模板
**说明**: 配置该科室下各类设备的默认波形和参数显示顺序/颜色。
**URL**: `/departments/{departmentCode}/device-configs`
**Method**: `PUT`
**Path Params**: `departmentCode` (例如: `ICU`)

**Request Body** (`DeviceDisplayConfig`):
```json
{
  "MONITOR": {
    "waveforms": [
       { "id": "ecg", "label": "ECG I", "visible": true, "color": "#00ff41", "order": 1 },
       { "id": "spo2", "label": "SpO2", "visible": true, "color": "#00d0ff", "order": 2 },
       { "id": "resp", "label": "Resp", "visible": true, "color": "#ffea00", "order": 3 },
       { "id": "art", "label": "ART", "visible": false, "color": "#ff3b30", "order": 4 }
    ],
    "parameters": [
       { "id": "hr", "label": "HR", "unit": "bpm", "visible": true, "order": 1 },
       { "id": "spo2", "label": "SpO2", "unit": "%", "visible": true, "order": 2 },
       { "id": "nibp", "label": "NIBP", "unit": "mmHg", "visible": true, "order": 3 },
       { "id": "resp", "label": "RR", "unit": "rpm", "visible": true, "order": 4 },
       { "id": "temp", "label": "Temp", "unit": "°C", "visible": true, "order": 5 }
    ]
  },
  "VENTILATOR": {
    "waveforms": [
       { "id": "paw", "label": "Paw", "visible": true, "color": "#ff9500", "order": 1 },
       { "id": "flow", "label": "Flow", "visible": true, "color": "#34d399", "order": 2 },
       { "id": "vol", "label": "Volume", "visible": true, "color": "#00d0ff", "order": 3 }
    ],
    "parameters": [
       { "id": "ppeak", "label": "Ppeak", "unit": "cmH2O", "visible": true, "order": 1 },
       { "id": "vte", "label": "VTe", "unit": "ml", "visible": true, "order": 2 },
       { "id": "mv", "label": "MV", "unit": "L/min", "visible": true, "order": 3 },
       { "id": "fio2", "label": "FiO2", "unit": "%", "visible": true, "order": 4 },
       { "id": "peep", "label": "PEEP", "unit": "cmH2O", "visible": true, "order": 5 },
       { "id": "freq", "label": "fTotal", "unit": "bpm", "visible": true, "order": 6 }
    ]
  },
  "ANESTHESIA": {
     "waveforms": [
        { "id": "co2", "label": "CO2", "visible": true, "color": "#ffffff", "order": 1 },
        { "id": "ecg", "label": "ECG", "visible": true, "color": "#00ff41", "order": 2 },
        { "id": "pleth", "label": "Pleth", "visible": true, "color": "#00d0ff", "order": 3 }
     ],
     "parameters": [
        { "id": "etco2", "label": "EtCO2", "unit": "mmHg", "visible": true, "order": 1 },
        { "id": "spo2", "label": "SpO2", "unit": "%", "visible": true, "order": 2 },
        { "id": "mac", "label": "MAC", "unit": "", "visible": true, "order": 3 },
        { "id": "fio2", "label": "FiO2", "unit": "%", "visible": true, "order": 4 },
        { "id": "hr", "label": "HR", "unit": "bpm", "visible": true, "order": 5 }
     ]
  }
}
```

**Response Body**:
```json
{ "code": 200, "message": "success", "data": null }
```

### 3.5 更新报警阈值策略
**说明**: 更新该科室的生理参数报警规则。
**URL**: `/departments/{departmentCode}/alarm-thresholds`
**Method**: `PUT`
**Path Params**: `departmentCode` (例如: `ICU`)

**Request Body** (`AlarmThresholdItem[]`):
```json
[
  {
    "paramId": "hr",
    "label": "心率",
    "max": 110,
    "min": 55,
    "delay": 5,
    "priority": "HIGH",
    "enabled": true
  },
  {
    "paramId": "spo2",
    "label": "血氧",
    "max": 100,
    "min": 92,
    "delay": 10,
    "priority": "HIGH",
    "enabled": true
  },
  {
    "paramId": "resp",
    "label": "呼吸率",
    "max": 30,
    "min": 8,
    "delay": 15,
    "priority": "MED",
    "enabled": false
  },
  {
    "paramId": "nibp_sys",
    "label": "收缩压",
    "max": 160,
    "min": 90,
    "delay": 5,
    "priority": "MED",
    "enabled": true
  },
  {
    "paramId": "etco2",
    "label": "EtCO2",
    "max": 45,
    "min": 30,
    "delay": 5,
    "priority": "MED",
    "enabled": true
  },
  {
    "paramId": "ppeak",
    "label": "气道峰压",
    "max": 40,
    "min": null,
    "delay": 1,
    "priority": "HIGH",
    "enabled": true
  }
]
```

**Response Body**:
```json
{ "code": 200, "message": "success", "data": null }
```

---

## 4. 患者与床位管理 (Patients)

### 4.1 获取所有患者
**说明**: 获取当前所有科室的在床患者及设备绑定信息。
**URL**: `/patients`
**Method**: `GET`

**Response Body**:
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": "p_12345678",
      "deviceId": "iot_dev_01",
      "bedNumber": "ICU-01",
      "department": "ICU",
      "deviceType": "MONITOR",
      "connectedDevices": ["MONITOR", "VENTILATOR"],
      "name": "张三",
      "age": 45,
      "gender": "男",
      "admissionId": "ZY2024001",
      "status": "NORMAL",
      "activeAlarm": null,
      "parameters": [
        { "id": "hr", "label": "HR", "value": 75, "unit": "bpm" },
        { "id": "spo2", "label": "SpO2", "value": 98, "unit": "%" }
      ],
      "waveforms": [
        { "id": "ecg", "label": "ECG", "color": "#00ff41", "data": [50, 52, 55, 60, 55, 50] }
      ],
      "alarmDuration": 0,
      "violationCounters": {}
    },
    {
      "id": "p_87654321",
      "deviceId": "iot_dev_02",
      "bedNumber": "ICU-02",
      "department": "ICU",
      "deviceType": "VENTILATOR",
      "connectedDevices": ["VENTILATOR"],
      "name": "李四",
      "age": 62,
      "gender": "女",
      "admissionId": "ZY2024002",
      "status": "WARNING",
      "activeAlarm": {
         "message": "Ppeak High",
         "category": "PHYSIOLOGICAL",
         "timestamp": "2024-05-24T10:00:00.000Z",
         "priority": "MED",
         "isAcknowledged": false
      },
      "parameters": [],
      "waveforms": [],
      "alarmDuration": 50,
      "violationCounters": { "ppeak": 5 }
    }
  ]
}
```

### 4.2 患者入科 (绑定设备)
**说明**: 将物理设备绑定到床位并登记患者信息。
**URL**: `/patients`
**Method**: `POST`

**Request Body**:
```json
{
  "name": "王五",
  "age": 32,
  "gender": "男",
  "admissionId": "ZY2024003",
  "bedNumber": "ICU-05",
  "department": "ICU",
  "deviceId": "iot_pool_05",
  "deviceType": "MONITOR"
}
```

**Response Body**:
```json
{
  "code": 200,
  "message": "success",
  "data": "p_new_generated_uuid"
}
```

### 4.3 患者出科 (解绑设备)
**说明**: 移除患者并释放设备。
**URL**: `/patients/{patientId}`
**Method**: `DELETE`
**Path Params**: `patientId`

**Response Body**:
```json
{ "code": 200, "message": "success", "data": null }
```

### 4.4 更新床位显示配置
**说明**: 保存针对特定患者床位的个性化显示设置（隐藏/显示波形或参数）。
**URL**: `/patients/{patientId}/config`
**Method**: `PUT`
**Path Params**: `patientId`

**Request Body** (`PatientDisplaySettings`):
```json
{
  "visibleWaveformIds": ["ecg", "spo2", "resp", "art"],
  "visibleParameterIds": ["hr", "spo2", "nibp", "temp", "cvp"]
}
```

**Response Body**:
```json
{ "code": 200, "message": "success", "data": null }
```

### 4.5 获取历史趋势数据
**说明**: 获取患者生命体征的历史趋势数据（图表/表格用）。
**URL**: `/patients/{patientId}/trends`
**Method**: `GET`
**Path Params**: `patientId`
**Query Params**: `range` (int, 小时数, 如 1, 4, 8, 24)

**Response Body**:
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "timestamp": "2024-05-24T08:00:00.000Z",
      "hr": 75,
      "spo2": 98,
      "nibp_sys": 120,
      "nibp_dia": 80,
      "resp": 18,
      "temp": 37.1
    },
    {
      "timestamp": "2024-05-24T08:05:00.000Z",
      "hr": 78,
      "spo2": 97,
      "nibp_sys": 122,
      "nibp_dia": 82,
      "resp": 19,
      "temp": 37.2
    },
    {
      "timestamp": "2024-05-24T08:10:00.000Z",
      "hr": 80,
      "spo2": 99,
      "nibp_sys": 118,
      "nibp_dia": 78,
      "resp": 18,
      "temp": 37.1
    }
  ]
}
```

---

## 5. 设备管理 (Devices)

### 5.1 获取可用设备列表
**说明**: 获取当前在线且未分配到床位的 IoT 设备池。
**URL**: `/devices/available`
**Method**: `GET`

**Response Body**:
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "deviceId": "iot_pool_01",
      "serialNumber": "SN-10086",
      "deviceType": "MONITOR",
      "department": "ICU",
      "status": "ONLINE",
      "ipAddress": "192.168.1.50"
    },
    {
      "deviceId": "iot_pool_02",
      "serialNumber": "SN-10087",
      "deviceType": "VENTILATOR",
      "department": "ICU",
      "status": "ONLINE",
      "ipAddress": "192.168.1.51"
    }
  ]
}
```

---

## 6. 报警管理 (Alarms)

### 6.1 获取报警历史
**说明**: 获取系统的报警日志。
**URL**: `/alarms`
**Method**: `GET`
**Query Params**: `department` (string, 可选, 例如 `ICU`)

**Response Body**:
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": "alarm_001",
      "timestamp": "2024-05-20T10:05:00.000Z",
      "patientId": "p_123",
      "patientName": "张三",
      "bedNumber": "ICU-01",
      "department": "ICU",
      "deviceType": "MONITOR",
      "category": "PHYSIOLOGICAL",
      "type": "CRITICAL",
      "message": "HR > 120 bpm",
      "acknowledged": false,
      "snapshot": {
         "timestamp": "2024-05-20T10:05:00.000Z",
         "waveforms": [],
         "parameters": []
      }
    },
    {
      "id": "alarm_002",
      "timestamp": "2024-05-20T11:00:00.000Z",
      "patientId": "p_123",
      "patientName": "张三",
      "bedNumber": "ICU-01",
      "department": "ICU",
      "deviceType": "MONITOR",
      "category": "TECHNICAL",
      "type": "WARNING",
      "message": "SpO2 Sensor Off",
      "acknowledged": true,
      "snapshot": null
    }
  ]
}
```

### 6.2 获取报警快照详情
**说明**: 获取报警触发时刻前后的全息波形和参数快照。
**URL**: `/alarms/{alarmId}/snapshot`
**Method**: `GET`
**Path Params**: `alarmId`

**Response Body**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "alarm_001",
    "timestamp": "2024-05-20T10:05:00.000Z",
    "parameters": [
      { "id": "hr", "label": "HR", "value": 125, "unit": "bpm", "isAlarm": true },
      { "id": "spo2", "label": "SpO2", "value": 96, "unit": "%", "isAlarm": false },
      { "id": "nibp", "label": "NIBP", "value": "130/85", "unit": "mmHg", "isAlarm": false }
    ],
    "waveforms": [
      { "id": "ecg", "label": "ECG I", "color": "#00ff41", "data": [50, 60, 40, 50, 50, 50, 80, -20, 50] },
      { "id": "spo2", "label": "SpO2", "color": "#00d0ff", "data": [90, 92, 94, 95, 94, 92, 90, 88] }
    ]
  }
}
```

---

## 7. 实时数据推送 (WebSocket)

**Protocol**: STOMP over WebSocket
**URL**: `ws://localhost:8080/ws-mediguard`

### 7.1 订阅生命体征
**Topic**: `/topic/vitals`
**Direction**: Server -> Client

**Message Payload (JSON Array of DeviceRealtimeDataDTO)**:
```json
[
  {
    "deviceId": "iot_dev_01",
    "timestamp": 1716190000123,
    "waveforms": {
      "ecg": [50, 52, 55, 60, 65, 70, 60, 50, 40, 50],
      "spo2": [90, 91, 92, 93, 94, 93, 92, 91, 90, 90]
    },
    "parameters": {
      "hr": 78,
      "spo2": 99,
      "resp": 18
    },
    "activeAlarms": [
       { "code": "HR_HIGH", "msg": "HR > 120", "level": "CRITICAL" }
    ]
  },
  {
    "deviceId": "iot_dev_02",
    "timestamp": 1716190000123,
    "waveforms": {
      "paw": [20, 22, 25, 30, 25, 20]
    },
    "parameters": {
      "ppeak": 25,
      "vte": 480
    },
    "activeAlarms": []
  }
]
```