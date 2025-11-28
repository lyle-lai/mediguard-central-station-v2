
import React, { useState } from 'react';
import { PatientData, VitalStatus } from '../types';
import { UserPlus, UserMinus, Search, Monitor, Building2, Trash2, AlertTriangle, X } from 'lucide-react';

interface PatientListViewProps {
  patients: PatientData[];
  onAddPatient: () => void;
  onRemovePatient: (id: string) => void;
}

const PatientListView: React.FC<PatientListViewProps> = ({ patients, onAddPatient, onRemovePatient }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [patientToDelete, setPatientToDelete] = useState<PatientData | null>(null);

  const filteredPatients = patients.filter(p => {
    const term = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      p.bedNumber.toLowerCase().includes(term) ||
      p.id.toLowerCase().includes(term) ||
      p.admissionId.toLowerCase().includes(term)
    );
  });

  const handleDeleteClick = (e: React.MouseEvent, patient: PatientData) => {
    e.stopPropagation();
    setPatientToDelete(patient);
  };

  const confirmDelete = () => {
    if (patientToDelete) {
      onRemovePatient(patientToDelete.id);
      setPatientToDelete(null);
    }
  };

  return (
    <div className="flex-1 p-6 bg-med-bg text-gray-200 overflow-hidden flex flex-col relative">
       {/* Delete Modal */}
       {patientToDelete && (
         <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="bg-med-card border border-gray-700 w-full max-w-md rounded-xl shadow-2xl overflow-hidden transform scale-100">
                <div className="p-4 bg-red-900/20 border-b border-red-900/50 flex items-center gap-3">
                    <div className="p-2 bg-red-900/50 rounded-full text-red-400">
                        <AlertTriangle size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-white">确认移除设备?</h3>
                </div>
                <div className="p-6">
                    <p className="text-gray-300 mb-2">
                        您即将移除床位 <span className="font-bold text-white font-mono text-lg mx-1">{patientToDelete.bedNumber}</span> 的设备绑定。
                    </p>
                    <p className="text-sm text-gray-500">
                        患者: {patientToDelete.name} (ID: {patientToDelete.admissionId})
                        <br/>
                        此操作将停止该床位的数据采集，并释放设备。
                    </p>
                </div>
                <div className="p-4 bg-gray-900/50 border-t border-gray-800 flex justify-end gap-3">
                    <button 
                        onClick={() => setPatientToDelete(null)}
                        className="px-4 py-2 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold transition"
                    >
                        取消
                    </button>
                    <button 
                        onClick={confirmDelete}
                        className="px-4 py-2 rounded bg-red-600 hover:bg-red-500 text-white font-bold transition flex items-center gap-2"
                    >
                        <Trash2 size={16} /> 确认移除
                    </button>
                </div>
            </div>
         </div>
       )}

       {/* Header */}
       <div className="flex justify-between items-center mb-6">
         <div>
            <h2 className="text-2xl font-bold">设备与患者管理</h2>
            <p className="text-gray-500 text-sm">管理当前科室接入的监护设备</p>
         </div>
         <button 
           onClick={onAddPatient}
           className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded transition shadow-lg shadow-blue-900/20"
         >
            <UserPlus size={18} /> 添加设备
         </button>
       </div>

       {/* Search Bar */}
       <div className="bg-med-card p-3 rounded-t-lg border-b border-gray-700 flex items-center gap-3">
          <Search className="text-gray-500" size={20} />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索设备ID、患者姓名或床位号..." 
            className="bg-transparent border-none outline-none text-white w-full placeholder-gray-600"
          />
          {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="text-gray-500 hover:text-white">
                  <X size={16} />
              </button>
          )}
       </div>

       {/* Table */}
       <div className="bg-med-card rounded-b-lg border border-gray-700 overflow-hidden flex-1 overflow-y-auto custom-scrollbar">
         <table className="w-full text-left border-collapse">
           <thead className="bg-gray-800 text-gray-400 text-xs uppercase font-semibold sticky top-0 z-10 shadow-sm">
             <tr>
               <th className="p-4">床位/设备</th>
               <th className="p-4">归属科室</th>
               <th className="p-4">设备类型</th>
               <th className="p-4">患者信息</th>
               <th className="p-4">关键参数摘要</th>
               <th className="p-4">状态</th>
               <th className="p-4 text-right">操作</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-gray-700 text-sm">
             {filteredPatients.map(p => (
               <tr key={p.id} className="hover:bg-gray-800/50 transition group">
                 <td className="p-4 font-mono font-bold text-blue-400 text-lg">{p.bedNumber}</td>
                 <td className="p-4 text-gray-400">
                    <span className="flex items-center gap-1.5 px-2 py-1 bg-gray-900 rounded border border-gray-800 w-fit text-xs">
                        <Building2 size={12}/>
                        {p.department.split(' ')[0]}
                    </span>
                 </td>
                 <td className="p-4">
                    <span className="flex items-center gap-2 text-gray-300">
                        <Monitor size={14} className="text-gray-500" />
                        {p.deviceType}
                    </span>
                 </td>
                 <td className="p-4">
                    <div className="font-bold text-gray-200">{p.name}</div>
                    <div className="text-xs text-gray-500 font-mono">{p.admissionId}</div>
                 </td>
                 <td className="p-4 text-gray-400 font-mono text-xs">
                    <div className="flex flex-wrap gap-2">
                        {p.parameters.slice(0,3).map((param, i) => (
                            <span key={i} className="px-1.5 py-0.5 bg-gray-900 rounded border border-gray-800">
                                <span className="text-gray-500 mr-1">{param.label}:</span>
                                <span className="text-gray-300">{param.value}</span>
                            </span>
                        ))}
                    </div>
                 </td>
                 <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold border ${
                        p.status === VitalStatus.CRITICAL ? 'bg-red-900/30 text-red-400 border-red-900' :
                        p.status === VitalStatus.WARNING ? 'bg-orange-900/30 text-orange-400 border-orange-900' :
                        p.status === VitalStatus.STANDBY ? 'bg-gray-800 text-gray-500 border-gray-700' :
                        'bg-green-900/30 text-green-400 border-green-900'
                    }`}>
                        {p.status}
                    </span>
                 </td>
                 <td className="p-4 text-right">
                   <button 
                     onClick={(e) => handleDeleteClick(e, p)}
                     className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-900/20 rounded transition"
                     title="移除设备"
                   >
                      <Trash2 size={18} />
                   </button>
                 </td>
               </tr>
             ))}
             {filteredPatients.length === 0 && (
                <tr>
                    <td colSpan={7} className="p-10 text-center text-gray-500 italic flex flex-col items-center justify-center gap-2">
                        <Search size={32} className="opacity-20"/>
                        {searchTerm ? '未找到匹配的设备或患者' : '该科室暂无连接设备'}
                    </td>
                </tr>
             )}
           </tbody>
         </table>
       </div>
    </div>
  );
};

export default PatientListView;
