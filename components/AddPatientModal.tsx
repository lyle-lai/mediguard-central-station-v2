
import React, { useState, useEffect } from 'react';
import { Department, DeviceType, PatientData, IoTDevice } from '../types';
import { fetchAvailableIoTDevices } from '../services/iotSimulator';
import { X, Save, Monitor, Building2, User, RefreshCw, Wifi, Lock } from 'lucide-react';

interface AddPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<PatientData>) => void;
  currentDepartment: Department;
  initialBedNumber?: string;
  occupiedBeds: string[]; // List of currently used bed numbers
  capacity: number; // Total capacity for this department
}

const AddPatientModal: React.FC<AddPatientModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  currentDepartment, 
  initialBedNumber,
  occupiedBeds,
  capacity
}) => {
  const [formData, setFormData] = useState({
    name: '',
    age: 45,
    gender: '男' as '男' | '女',
    bedNumber: '',
    admissionId: '',
    department: currentDepartment,
    deviceType: DeviceType.MONITOR,
    deviceId: '' // The actual IoT device ID
  });

  const [availableDevices, setAvailableDevices] = useState<IoTDevice[]>([]);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);
  const [availableBeds, setAvailableBeds] = useState<string[]>([]);

  // Effect 1: Initialize Modal when it opens (Reset form, Load Devices)
  // CRITICAL: Does NOT depend on occupiedBeds or capacity to avoid infinite loop due to parent updates.
  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({
        ...prev,
        department: currentDepartment,
        bedNumber: initialBedNumber || '', 
        name: '',
        deviceId: '',
        admissionId: `ZY-${Math.floor(Math.random() * 100000)}`
      }));
      loadDevices();
    }
  }, [isOpen, currentDepartment, initialBedNumber]);

  // Effect 2: Update Available Beds logic when bed data changes
  useEffect(() => {
    if (isOpen) {
        const prefix = getBedPrefix(currentDepartment);
        const beds: string[] = [];
        for (let i = 1; i <= capacity; i++) {
            const bedNum = `${prefix}-${String(i).padStart(2, '0')}`;
            // Add to list if it's NOT occupied OR if it matches the initialBedNumber (the one we clicked)
            if (!occupiedBeds.includes(bedNum) || bedNum === initialBedNumber) {
                beds.push(bedNum);
            }
        }
        setAvailableBeds(beds);
    }
  }, [isOpen, occupiedBeds, capacity, currentDepartment, initialBedNumber]);

  const getBedPrefix = (dept: Department) => {
      if (dept.includes('重症')) return 'ICU';
      if (dept.includes('手术')) return 'OR';
      if (dept.includes('急诊')) return 'ER';
      if (dept.includes('新生儿')) return 'N';
      return 'Gen';
  };

  const loadDevices = async () => {
    setIsLoadingDevices(true);
    try {
      const devices = await fetchAvailableIoTDevices();
      setAvailableDevices(devices.sort((a,b) => {
        if (a.department === currentDepartment && b.department !== currentDepartment) return -1;
        if (a.department !== currentDepartment && b.department === currentDepartment) return 1;
        return 0;
      }));
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingDevices(false);
    }
  };

  const handleDeviceSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const devId = e.target.value;
    const device = availableDevices.find(d => d.deviceId === devId);
    if (device) {
      setFormData(prev => ({
        ...prev,
        deviceId: devId,
        deviceType: device.deviceType,
        // We override the device department to match the current department context
        // This simulates assigning a pool device to the specific ward
        department: currentDepartment 
      }));
    } else {
      setFormData(prev => ({...prev, deviceId: ''}));
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.deviceId || !formData.bedNumber) return;
    onSubmit(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-med-card border border-gray-700 w-full max-w-xl rounded-xl shadow-2xl overflow-hidden transform transition-all scale-100">
        
        <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-gray-900/50">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Monitor className="text-blue-500" /> 设备接入与患者登记
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Section 1: Device Selection (IoT Platform) */}
          <div className="bg-blue-900/10 border border-blue-900/30 rounded-lg p-4">
             <div className="flex justify-between items-center mb-3">
                <label className="text-xs font-bold text-blue-400 uppercase flex items-center gap-2">
                    <Wifi size={14} /> 物联设备选择
                </label>
                <button 
                  type="button" 
                  onClick={loadDevices} 
                  className={`text-xs text-gray-400 hover:text-white flex items-center gap-1 ${isLoadingDevices ? 'animate-spin' : ''}`}
                  title="刷新设备列表"
                >
                   <RefreshCw size={12} />
                </button>
             </div>
             
             {isLoadingDevices ? (
                <div className="text-sm text-gray-500 italic py-2">正在从物联平台获取设备列表...</div>
             ) : (
                <div className="space-y-3">
                   <select 
                     required
                     value={formData.deviceId}
                     onChange={handleDeviceSelect}
                     className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                   >
                     <option value="">-- 请选择空闲设备 --</option>
                     {availableDevices.map(dev => (
                       <option key={dev.deviceId} value={dev.deviceId}>
                          {dev.department === currentDepartment ? '📍' : ''} [{dev.deviceType}] {dev.serialNumber} - {dev.department}
                       </option>
                     ))}
                   </select>
                   
                   {formData.deviceId && (
                      <div className="flex gap-4 text-xs text-gray-400 bg-black/20 p-2 rounded">
                         <span>类型: <span className="text-white font-mono">{formData.deviceType}</span></span>
                         <span>状态: <span className="text-green-400 font-bold">在线</span></span>
                         <span>IP: <span className="font-mono">192.168.1.xxx</span></span>
                      </div>
                   )}
                </div>
             )}
          </div>

          {/* Section 2: Patient & Bed Info */}
          <div className="space-y-4">
             <div className="flex items-center gap-2 pb-2 border-b border-gray-800">
                <User size={16} className="text-gray-500" />
                <span className="text-sm font-bold text-gray-300">患者与床位绑定</span>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase mb-1">所属科室</label>
                   <div className="relative">
                     <Building2 className="absolute left-3 top-2.5 text-gray-500" size={16} />
                     <div className="w-full bg-gray-900/50 border border-gray-800 rounded pl-10 pr-3 py-2 text-sm text-gray-400 flex items-center justify-between cursor-not-allowed">
                        <span>{formData.department}</span>
                        <Lock size={12} className="text-gray-600"/>
                     </div>
                   </div>
                </div>
                <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase mb-1">分配床位</label>
                   <select
                     required
                     value={formData.bedNumber}
                     onChange={e => setFormData({...formData, bedNumber: e.target.value})}
                     className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-blue-500 outline-none font-mono"
                   >
                     <option value="" disabled>-- 选择床位 --</option>
                     {availableBeds.map(bed => (
                         <option key={bed} value={bed}>{bed}</option>
                     ))}
                   </select>
                   {availableBeds.length === 0 && (
                       <div className="text-[10px] text-red-500 mt-1">该科室暂无空闲床位，请先调整科室容量。</div>
                   )}
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                   <input 
                     required
                     type="text" 
                     value={formData.name}
                     onChange={e => setFormData({...formData, name: e.target.value})}
                     placeholder="患者姓名"
                     className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                   />
                </div>
                <div>
                   <input 
                      type="text" 
                      value={formData.admissionId}
                      onChange={e => setFormData({...formData, admissionId: e.target.value})}
                      placeholder="住院号"
                      className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                   />
                </div>
                <div className="flex gap-2">
                   <input 
                      type="number" 
                      value={formData.age}
                      onChange={e => setFormData({...formData, age: parseInt(e.target.value)})}
                      className="w-20 bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                   />
                   <select 
                      value={formData.gender}
                      onChange={e => setFormData({...formData, gender: e.target.value as any})}
                      className="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                   >
                      <option value="男">男</option>
                      <option value="女">女</option>
                   </select>
                </div>
             </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-800">
             <button 
               type="submit" 
               disabled={!formData.deviceId || !formData.bedNumber}
               className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold py-2 rounded flex items-center justify-center gap-2 transition"
             >
               <Save size={18} /> 确认绑定并接入
             </button>
             <button 
               type="button" 
               onClick={onClose}
               className="px-6 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-2 rounded transition"
             >
               取消
             </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AddPatientModal;
