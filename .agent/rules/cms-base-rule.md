---
trigger: always_on
---

# MediGuard CMS 项目规则

## 基本信息

**项目名称**: MediGuard CMS (Central Monitoring Station)  
**项目类型**: 医疗设备中央监护站 Web 系统  
**技术栈**: React 19 + TypeScript 5.8 + Vite 6  
**主要工作**: 开发医疗监护系统的前端界面和实时数据处理

## 核心架构原则

### 床位为中心 (Bed-Centric Architecture)
- 所有功能围绕物理床位组织，而非设备或患者
- 支持空床位可视化和交互
- 单床位支持多设备融合显示（监护仪+呼吸机+麻醉机）
- 双层配置体系：科室级全局配置 + 床位级个性化配置

### 类型系统规范
```typescript
// ✅ 使用 Enum 定义所有业务代码
export enum DeviceTypeCode {
  MONITOR = 'MONITOR',
  VENTILATOR = 'VENTILATOR',
  ANESTHESIA = 'ANESTHESIA'
}

// ❌ 禁止使用字符串字面量
const deviceType = 'MONITOR';  // 错误

// ✅ 使用 Record 而非 Map
deviceConfigs: Record<string, DeviceDisplayConfig>  // 正确
```

## 开发规则

### 强制规则

1. **类型安全**: 所有 API 响应、组件 Props 必须有明确的 TypeScript 类型定义
2. **禁用 Map**: API 数据传输禁止使用 Map 类型（无法正确序列化为 JSON）
3. **禁用 any**: 避免使用 `any` 类型，必须显式定义类型
4. **配置管理**: 禁止硬编码配置，所有配置从 API 获取或存储在 SystemSettings
5. **错误处理**: 所有 API 调用必须包含 try-catch 错误处理

### 性能规范

```typescript
// ✅ Canvas 波形渲染：使用 requestAnimationFrame
useEffect(() => {
  let animationId: number;
  const render = () => {
    drawWaveforms();
    animationId = requestAnimationFrame(render);
  };
  animationId = requestAnimationFrame(render);
  return () => cancelAnimationFrame(animationId);
}, [waveformData]);

// ✅ 数据缓存：使用 useMemo
const visiblePatients = useMemo(() => {
  return patients.filter(p => p.department === activeDept);
}, [patients, activeDept]);
```

### 医疗数据规范

**生理波形数据**:
- 实时性要求：60fps 渲染
- 数据结构：批量传输（WebSocket 每次推送 1 秒的波形点数组）
- 波形 ID：小写英文缩写（`ecg`, `spo2`, `resp`, `paw`, `co2`）

**生命体征参数**:
- 稀疏更新：参数值仅在变化时推送
- 单位标准：`bpm`, `%`, `mmHg`, `cmH2O`, `°C`
- 复合参数：如 `nibp: "120/80"` 或分解为 `nibp_sys`, `nibp_dia`

## API 交互规范

### 统一响应结构
```typescript
interface ApiResponse<T> {
  code: number;      // HTTP 状态码
  message: string;   // 消息描述
  data: T;          // 响应数据
}
```

### 鉴权方式
- **Header**: `Authorization: Bearer <token>`
- **Token 管理**: 存储在 localStorage

### 关键端点

| 模块 | 端点 | 方法 | 说明 |
|------|------|------|------|
| 认证 | `/auth/login` | POST | 用户登录 |
| 配置 | `/departments/{code}/config` | GET | 获取科室配置 |
| 患者 | `/patients` | GET | 获取所有患者 |
| 患者 | `/patients` | POST | 患者入科（设备绑定） |
| 患者 | `/patients/{id}` | DELETE | 患者出科（设备解绑） |
| 报警 | `/alarms` | GET | 获取报警历史 |
| 设备 | `/devices/available` | GET | 获取可用设备池 |

## 报警系统规范

### 报警分类
- **生理报警 (PHYSIOLOGICAL)**: 红色/黄色，参数超过阈值
- **技术报警 (TECHNICAL)**: 青色，设备问题

### 报警优先级
```typescript
enum AlarmPriority {
  CRITICAL = 'CRITICAL',  // 危急（红色）
  WARNING = 'WARNING',    // 警告（黄色）
  NORMAL = 'NORMAL'       // 正常（白色）
}
```

### 报警防抖
- 防抖时间：10 秒
- 违规计数器：使用 `violationCounters` 跟踪连续超标时长
- 报警快照：触发时保存前后 10 秒的全息波形和参数值

## UI/UX 规范

### 视图模式

| 模式 | 卡片高度 | 波形数量 | 参数容量 | 使用场景 |
|------|---------|---------|---------|---------|
| 标准 (standard) | 320px | 3 条 | 6-8 个 | 日常监护 |
| 密集 (compact) | 192px | 2 条 | 3-4 个 | 多床位概览 |
| 大屏 (large) | 自适应 | 自适应 | 8+ 个 | 电视墙/投影 |

### 颜色规范

**状态颜色**:
```css
--color-status-normal: #10b981;        /* 正常 - 绿色 */
--color-status-warning: #f59e0b;       /* 警告 - 黄色 */
--color-status-critical: #ef4444;      /* 危急 - 红色 */
--color-status-disconnected: #6b7280;  /* 断连 - 灰色 */
--color-status-standby: #3b82f6;       /* 待机 - 蓝色 */
--color-alarm-technical: #06b6d4;      /* 技术报警 - 青色 */
```

**波形颜色**（符合医疗行业惯例）:
```typescript
const STANDARD_WAVEFORM_COLORS = {
  ecg: '#00ff41',   // ECG - 绿色
  spo2: '#00d0ff',  // SpO2 - 青色
  resp: '#ffea00',  // Resp - 黄色
  art: '#ff3b30',   // ART 有创血压 - 红色
  paw: '#ff9500',   // Paw 气道压 - 橙色
  co2: '#a0ff00'    // CO2 - 黄绿色
};
```

## 权限与科室隔离

### 角色定义
```typescript
enum UserRole {
  ADMIN = 'ADMIN',    // 系统管理员（访问所有科室）
  DOCTOR = 'DOCTOR',  // 医生（所属科室）
  NURSE = 'NURSE'     // 护士（所属科室）
}
```

### 测试账号

| 用户名 | 密码 | 角色 | 权限科室 |
|--------|------|------|---------|
| admin | 123 | ADMIN | 所有科室 |
| icu | 123 | NURSE | 仅 ICU |
| or | 123 | DOCTOR | 仅手术室 |
| er | 123 | DOCTOR | 仅急诊科 |

## 文件命名规范

### 组件文件
```
PatientCard.tsx         # React 组件使用 PascalCase
WaveformCanvas.tsx
AddPatientModal.tsx
```

### 服务文件
```
apiService.ts           # 服务使用 camelCase + Service 后缀
iotSimulator.ts
websocketService.ts
```

### 类型文件
```
types.ts                # 全局类型定义
constants.ts            # 常量定义
```

## Git 提交规范

```
feat: 新增床位配置功能
fix: 修复报警快照保存问题
refactor: 重构科室配置 API 调用逻辑
perf: 优化 Canvas 波形渲染性能
docs: 更新 API 文档
style: 调整患者卡片样式
test: 添加报警引擎单元测试
chore: 更新依赖包版本
```

## 禁止事项

### ❌ 严格禁止

1. **不得用于真实临床**: 本项目仅为演示原型，严禁用于真实医疗诊断或监护
2. **不得泄露患者隐私**: 即使是模拟数据，也应遵循数据保护原则
3. **不得使用 Map 作为 API 数据**: Map 无法正确序列化为 JSON
4. **不得硬编码配置**: 所有配置必须从 API 获取或存储在 SystemSettings 中
5. **不得跳过类型定义**: 所有 API 响应、组件 Props 必须有明确的 TypeScript 类型
6. **不得在生产环境开启 Demo 模式**: Demo 模式仅用于开发演示

## 文件相关说明

### 核心项目文件
以下文件以项目根目录为基础展示路径：

- `README.md` - 项目概述、功能特性、快速开始指南
- `api.md` - 完整 API 接口文档（v3.5）
- `VERSION.md` - 版本更新日志
- `types.ts` - TypeScript 全局类型定义
- `constants.ts` - 全局常量定义
- `App.tsx` - 主应用组件

### 项目文件结构

```
/mediguard-central-stationv2
├── .agent/                    # Agent 工作流和配置文件
├── components/                # React 组件
│   ├── PatientCard.tsx       # 患者卡片组件
│   ├── WaveformCanvas.tsx    # 波形渲染组件
│   ├── EmptyBedCard.tsx      # 空床位卡片
│   ├── layout/               # 布局组件
│   ├── settings/             # 设置相关组件
│   ├── dashboard/            # 仪表盘组件
│   └── admin/                # 管理员专用组件
├── services/                  # 服务层
│   ├── apiService.ts         # API 调用服务
│   ├── websocketService.ts   # WebSocket 实时通信
│   ├── iotSimulator.ts       # IoT 信号模拟器
│   ├── ruleEngine.ts         # 报警规则引擎
│   └── geminiService.ts      # AI 服务集成
├── hooks/                     # 自定义 React Hooks
├── utils/                     # 工具函数
├── public/                    # 静态资源
├── App.tsx                    # 主应用组件
├── types.ts                   # 全局类型定义
├── constants.ts               # 全局常量
├── index.css                  # 全局样式
├── README.md                  # 项目说明文档
├── api.md                     # API 接口文档
├── VERSION.md                 # 版本更新日志
├── tsconfig.json              # TypeScript 配置
├── vite.config.ts             # Vite 构建配置
└── package.json               # 项目依赖配置
```

## 性能指标

- **波形渲染**: 稳定 60fps
- **WebSocket 延迟**: < 100ms
- **页面加载时间**: < 2s
- **内存占用**: < 200MB (20 床位场景)

## 参考文档

- [README.md](./README.md) - 项目概述与快速开始
- [api.md](./api.md) - 完整 API 接口文档
- [types.ts](./types.ts) - TypeScript 类型定义
- [VERSION.md](./VERSION.md) - 版本更新日志

---

