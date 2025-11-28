
import React, { useState } from 'react';
import { DepartmentDTO } from '../../types';
import { Shield, Plus, Trash2, Edit2, Save, X, Building2, BedDouble, AlertTriangle, AlertOctagon } from 'lucide-react';

interface AdminDashboardProps {
    departments: DepartmentDTO[];
    deptCapacities: Record<string, number>;
    onAddDepartment: (code: string, name: string, capacity: number) => void;
    onUpdateDepartment: (code: string, capacity: number) => void;
    onDeleteDepartment: (code: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
    departments,
    deptCapacities,
    onAddDepartment,
    onUpdateDepartment,
    onDeleteDepartment
}) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newDept, setNewDept] = useState({ code: '', name: '', capacity: 16 });
    const [editingDeptCode, setEditingDeptCode] = useState<string | null>(null);
    const [editCapacity, setEditCapacity] = useState(0);
    const [deleteConfirmDept, setDeleteConfirmDept] = useState<DepartmentDTO | null>(null);

    const handleAddSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDept.code || !newDept.name) return;

        // Basic validation
        if (departments.some(d => d.code === newDept.code)) {
            alert('科室代码已存在！');
            return;
        }

        onAddDepartment(newDept.code, newDept.name, newDept.capacity);
        setIsAdding(false);
        setNewDept({ code: '', name: '', capacity: 16 });
    };

    const startEdit = (dept: DepartmentDTO) => {
        setEditingDeptCode(dept.code);
        setEditCapacity(deptCapacities[dept.code] || dept.capacity || 16);
    };

    const saveEdit = () => {
        if (editingDeptCode) {
            onUpdateDepartment(editingDeptCode, editCapacity);
            setEditingDeptCode(null);
        }
    };

    const handleDeleteClick = (dept: DepartmentDTO) => {
        setDeleteConfirmDept(dept);
    };

    const confirmDelete = () => {
        if (deleteConfirmDept) {
            onDeleteDepartment(deleteConfirmDept.code);
            setDeleteConfirmDept(null);
        }
    };

    return (
        <div className="flex-1 p-8 bg-med-bg text-gray-200 overflow-y-auto relative">

            {/* Improved Delete Confirmation Modal */}
            {deleteConfirmDept && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in zoom-in-95 duration-200" onClick={() => setDeleteConfirmDept(null)}>
                    <div
                        className="bg-[#1a1d24] border border-red-900/50 w-full max-w-md rounded-2xl shadow-[0_0_50px_rgba(220,38,38,0.3)] overflow-hidden transform transition-all"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Decorative Header Gradient */}
                        <div className="h-2 bg-gradient-to-r from-red-600 to-orange-600"></div>

                        <div className="p-8 flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-full bg-red-900/20 border border-red-900/50 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(220,38,38,0.2)]">
                                <AlertOctagon size={36} className="text-red-500 animate-pulse" />
                            </div>

                            <h3 className="text-2xl font-bold text-white mb-2">删除科室确认</h3>

                            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                                您即将永久删除 <br />
                                <span className="text-white font-bold text-lg bg-red-900/30 px-2 py-0.5 rounded border border-red-900/50 mt-2 inline-block">
                                    {deleteConfirmDept.name} ({deleteConfirmDept.code})
                                </span>
                            </p>

                            <div className="bg-red-950/30 border border-red-900/30 p-3 rounded-lg text-xs text-red-300 w-full mb-6 flex items-start gap-2 text-left">
                                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                                <span>警告：此操作不可逆。删除科室将同步清除该科室下的所有床位配置、设备绑定关系及历史报警记录。请确保该科室已无在床患者。</span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 w-full">
                                <button
                                    onClick={() => setDeleteConfirmDept(null)}
                                    className="px-4 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold transition border border-gray-700 hover:border-gray-600"
                                >
                                    取消操作
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="px-4 py-3 rounded-xl bg-gradient-to-br from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold transition shadow-lg shadow-red-900/30 flex items-center justify-center gap-2 group"
                                >
                                    <Trash2 size={18} className="group-hover:rotate-12 transition-transform" />
                                    确认删除
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-3">
                        <div className="p-2 bg-purple-900/50 rounded-lg text-purple-400"><Shield size={28} /></div>
                        管理员后台 - 科室架构管理
                    </h2>
                    <p className="text-gray-500 mt-1 ml-14">新增、修改或删除医院监护科室及床位容量规划。</p>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-6 rounded-lg flex items-center gap-2 shadow-lg shadow-purple-900/20 transition"
                >
                    <Plus size={20} /> 新增科室
                </button>
            </div>

            {isAdding && (
                <div className="mb-8 bg-med-card border border-purple-900/50 rounded-xl p-6 animate-in slide-in-from-top-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-white">新增科室</h3>
                        <button onClick={() => setIsAdding(false)} className="text-gray-500 hover:text-white"><X size={20} /></button>
                    </div>
                    <form onSubmit={handleAddSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">科室代码 (Unique ID)</label>
                            <input
                                required
                                type="text"
                                placeholder="如: CCU"
                                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:border-purple-500 outline-none uppercase font-mono"
                                value={newDept.code}
                                onChange={e => setNewDept({ ...newDept, code: e.target.value.toUpperCase() })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">科室名称</label>
                            <input
                                required
                                type="text"
                                placeholder="如: 心内监护室"
                                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:border-purple-500 outline-none"
                                value={newDept.name}
                                onChange={e => setNewDept({ ...newDept, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">初始床位容量</label>
                            <input
                                type="number"
                                min="4" max="100"
                                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:border-purple-500 outline-none"
                                value={newDept.capacity}
                                onChange={e => setNewDept({ ...newDept, capacity: parseInt(e.target.value) })}
                            />
                        </div>
                        <button type="submit" className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-4 rounded transition flex items-center justify-center gap-2">
                            <Save size={18} /> 保存
                        </button>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {departments.map(dept => {
                    const currentCapacity = deptCapacities[dept.code] || dept.capacity || 0;
                    const isEditing = editingDeptCode === dept.code;

                    return (
                        <div key={dept.code} className="bg-med-card border border-gray-700 rounded-xl overflow-hidden hover:border-gray-500 transition group relative">
                            <div className="h-2 bg-gradient-to-r from-blue-600 to-purple-600"></div>
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gray-800 rounded-lg text-gray-300"><Building2 size={24} /></div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white">{dept.name}</h3>
                                            <span className="text-xs font-mono font-bold bg-gray-800 px-1.5 py-0.5 rounded text-gray-400">{dept.code}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800 flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <BedDouble size={18} />
                                        <span className="text-sm font-bold">床位容量</span>
                                    </div>
                                    {isEditing ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                className="w-16 bg-black border border-blue-500 rounded px-1 py-0.5 text-center text-white"
                                                value={editCapacity}
                                                onChange={e => setEditCapacity(parseInt(e.target.value))}
                                                autoFocus
                                            />
                                            <button onClick={saveEdit} className="p-1 bg-blue-600 rounded hover:bg-blue-500 text-white"><Save size={14} /></button>
                                        </div>
                                    ) : (
                                        <span className="text-2xl font-mono font-bold text-blue-400">{currentCapacity}</span>
                                    )}
                                </div>
                            </div>

                            <div className="bg-gray-900/80 p-3 flex justify-end gap-2 border-t border-gray-800 opacity-60 group-hover:opacity-100 transition-opacity">
                                {!isEditing && (
                                    <>
                                        <button
                                            onClick={() => startEdit(dept)}
                                            className="p-2 hover:bg-gray-800 rounded text-gray-400 hover:text-white transition"
                                            title="修改容量"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClick(dept)}
                                            className="p-2 hover:bg-red-900/30 rounded text-gray-400 hover:text-red-400 transition"
                                            title="删除科室"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AdminDashboard;
