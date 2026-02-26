import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { Users as UsersIcon, Plus, Edit, Shield, X } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Users() {
    const { getToken } = useAuth();
    const [users, setUsers] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'staff' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` });

    async function load() {
        setLoading(true);
        const res = await fetch(`${API}/users`, { headers: headers() });
        setUsers(await res.json());
        setLoading(false);
    }

    useEffect(() => { load(); }, []);

    function openNew() { setEditing(null); setForm({ name: '', email: '', password: '', role: 'staff' }); setError(''); setIsOpen(true); }
    function openEdit(u) { setEditing(u); setForm({ name: u.name, email: u.email, password: '', role: u.role }); setError(''); setIsOpen(true); }

    async function handleSave(e) {
        e.preventDefault();
        setSaving(true); setError('');
        try {
            const body = editing
                ? { name: form.name, role: form.role, isActive: true, ...(form.password ? { password: form.password } : {}) }
                : { name: form.name, email: form.email, password: form.password, role: form.role };
            const res = await fetch(`${API}/users${editing ? `/${editing.id}` : ''}`, {
                method: editing ? 'PUT' : 'POST',
                headers: headers(),
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'เกิดข้อผิดพลาด');
            setIsOpen(false);
            load();
        } catch (err) { setError(err.message); } finally { setSaving(false); }
    }

    async function toggleActive(u) {
        await fetch(`${API}/users/${u.id}`, { method: 'PUT', headers: headers(), body: JSON.stringify({ isActive: !u.isActive }) });
        load();
    }

    return (
        <div className="space-y-4 sm:space-y-6 animate-fade-in p-1 sm:p-2">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">จัดการพนักงาน</h1>
                    <p className="text-slate-400 mt-1 flex items-center gap-2 text-sm sm:text-base">
                        <UsersIcon size={14} className="text-emerald-400" />
                        เพิ่ม แก้ไข และจัดการสิทธิ์พนักงาน
                    </p>
                </div>
                <button onClick={openNew} className="btn-primary flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 w-full sm:w-auto">
                    <Plus size={18} /> เพิ่มพนักงาน
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16"><div className="spinner" /></div>
            ) : (
                <>
                    {/* Mobile Card View */}
                    <div className="sm:hidden space-y-3">
                        {users.map(u => (
                            <div key={u.id} className="glass-card p-4 border border-white/5">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h4 className="text-white font-medium text-sm">{u.name}</h4>
                                        <p className="text-xs text-slate-500 mt-0.5">{u.email}</p>
                                    </div>
                                    <div className="flex flex-col gap-1 items-end">
                                        <span className={`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full border ${u.role === 'admin' ? 'bg-violet-500/10 text-violet-400 border-violet-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                                            {u.role === 'admin' ? '👑 Admin' : '👤 Staff'}
                                        </span>
                                        <span className={`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full border ${u.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                            {u.isActive ? 'ใช้งาน' : 'ปิดใช้งาน'}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-xs text-slate-500 mb-3">สร้างเมื่อ {new Date(u.createdAt).toLocaleDateString('th-TH')}</div>
                                <div className="flex gap-2">
                                    <button className="flex-1 text-xs py-2 px-3 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-colors" onClick={() => openEdit(u)}>แก้ไข</button>
                                    <button className={`flex-1 text-xs py-2 px-3 rounded-lg border transition-colors ${u.isActive ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`} onClick={() => toggleActive(u)}>
                                        {u.isActive ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop Table */}
                    <div className="hidden sm:block glass-card overflow-hidden border border-white/5">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="py-4 px-6 text-slate-400 font-semibold text-xs tracking-wider">ชื่อ</th>
                                    <th className="py-4 px-6 text-slate-400 font-semibold text-xs tracking-wider">อีเมล</th>
                                    <th className="py-4 px-6 text-slate-400 font-semibold text-xs tracking-wider">สิทธิ์</th>
                                    <th className="py-4 px-6 text-slate-400 font-semibold text-xs tracking-wider">สถานะ</th>
                                    <th className="py-4 px-6 text-slate-400 font-semibold text-xs tracking-wider">วันที่สร้าง</th>
                                    <th className="py-4 px-6 text-slate-400 font-semibold text-xs tracking-wider">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {users.map(u => (
                                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="py-4 px-6 text-white font-medium text-sm">{u.name}</td>
                                        <td className="py-4 px-6 text-slate-300 text-sm">{u.email}</td>
                                        <td className="py-4 px-6">
                                            <span className={`inline-flex px-2.5 py-0.5 text-[10px] font-semibold rounded-full border ${u.role === 'admin' ? 'bg-violet-500/10 text-violet-400 border-violet-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                                                {u.role === 'admin' ? '👑 Admin' : '👤 Staff'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`inline-flex px-2.5 py-0.5 text-[10px] font-semibold rounded-full border ${u.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                                {u.isActive ? 'ใช้งาน' : 'ปิดใช้งาน'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-slate-400 text-sm">{new Date(u.createdAt).toLocaleDateString('th-TH')}</td>
                                        <td className="py-4 px-6">
                                            <div className="flex gap-2">
                                                <button className="text-xs py-1.5 px-3 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-colors" onClick={() => openEdit(u)}>แก้ไข</button>
                                                <button className={`text-xs py-1.5 px-3 rounded-lg border transition-colors ${u.isActive ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`} onClick={() => toggleActive(u)}>
                                                    {u.isActive ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {isOpen && createPortal(
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4 sm:p-4" onClick={() => setIsOpen(false)}>
                    <div className="glass-card w-full max-w-md p-0 overflow-hidden shadow-2xl border border-white/10 max-h-[90vh] sm:max-h-[90vh] flex flex-col sm:rounded-2xl rounded-none max-sm:h-full max-sm:max-h-full max-sm:rounded-none" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-5 border-b border-white/5 bg-white/[0.02]">
                            <h2 className="text-lg font-bold text-white">{editing ? 'แก้ไขพนักงาน' : 'เพิ่มพนักงาน'}</h2>
                            <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="flex-1 overflow-y-auto">
                            <div className="p-5 space-y-4">
                                {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-3 text-sm">{error}</div>}
                                <div>
                                    <label className="block text-xs text-slate-400 font-medium mb-1.5">ชื่อ *</label>
                                    <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="input-field" />
                                </div>
                                {!editing && (
                                    <div>
                                        <label className="block text-xs text-slate-400 font-medium mb-1.5">อีเมล *</label>
                                        <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required className="input-field" />
                                    </div>
                                )}
                                <div>
                                    <label className="block text-xs text-slate-400 font-medium mb-1.5">{editing ? 'รหัสผ่านใหม่ (เว้นว่างถ้าไม่เปลี่ยน)' : 'รหัสผ่าน *'}</label>
                                    <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required={!editing} className="input-field" />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 font-medium mb-1.5">สิทธิ์</label>
                                    <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="input-field">
                                        <option value="staff">Staff</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                            </div>
                            <div className="p-5 pt-0 flex gap-3">
                                <button type="button" className="btn-secondary flex-1 py-3" onClick={() => setIsOpen(false)}>ยกเลิก</button>
                                <button type="submit" className="btn-primary flex-1 py-3" disabled={saving}>{saving ? 'กำลังบันทึก...' : 'บันทึก'}</button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
