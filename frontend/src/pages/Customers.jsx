import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { Search, UserCheck, Plus, X, Phone, MessageCircle } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://103.142.150.196:5000/api';

export default function Customers() {
    const { getToken } = useAuth();
    const [customers, setCustomers] = useState([]);
    const [search, setSearch] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [detailCustomer, setDetailCustomer] = useState(null);
    const [form, setForm] = useState({ name: '', phone: '', lineId: '', note: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` });

    async function load(q = search) {
        setLoading(true);
        const res = await fetch(`${API}/customers?search=${encodeURIComponent(q)}`, { headers: headers() });
        setCustomers(await res.json());
        setLoading(false);
    }

    useEffect(() => { load(); }, []);

    async function openDetail(c) {
        const res = await fetch(`${API}/customers/${c.id}`, { headers: headers() });
        setDetailCustomer(await res.json());
    }

    function openNew() { setEditing(null); setForm({ name: '', phone: '', lineId: '', note: '' }); setError(''); setIsOpen(true); }
    function openEdit(c) { setEditing(c); setForm({ name: c.name, phone: c.phone || '', lineId: c.lineId || '', note: c.note || '' }); setError(''); setIsOpen(true); }

    async function handleSave(e) {
        e.preventDefault();
        setSaving(true); setError('');
        try {
            const res = await fetch(`${API}/customers${editing ? `/${editing.id}` : ''}`, {
                method: editing ? 'PUT' : 'POST', headers: headers(), body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'เกิดข้อผิดพลาด');
            setIsOpen(false); load();
        } catch (err) { setError(err.message); } finally { setSaving(false); }
    }

    async function handleDelete(id) {
        if (!confirm('ต้องการลบลูกค้านี้ใช่หรือไม่?')) return;
        await fetch(`${API}/customers/${id}`, { method: 'DELETE', headers: headers() });
        load();
    }

    function formatDate(d) { return new Date(d).toLocaleDateString('th-TH'); }
    function formatCurrency(n) { return n?.toLocaleString('th-TH') ?? '0'; }

    return (
        <div className="space-y-4 sm:space-y-6 animate-fade-in p-1 sm:p-2">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">ลูกค้า</h1>
                    <p className="text-slate-400 mt-1 flex items-center gap-2 text-sm sm:text-base">
                        <UserCheck size={14} className="text-emerald-400" />
                        ข้อมูลลูกค้าและประวัติการสั่งซื้อ
                    </p>
                </div>
                <button onClick={openNew} className="btn-primary flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 w-full sm:w-auto">
                    <Plus size={18} /> เพิ่มลูกค้า
                </button>
            </div>

            {/* Search */}
            <div className="glass-card p-3 sm:p-4">
                <div className="relative w-full sm:w-96 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-emerald-400 transition-colors" size={18} />
                    <input
                        placeholder="ค้นหาชื่อหรือเบอร์โทร..."
                        value={search}
                        onChange={e => { setSearch(e.target.value); load(e.target.value); }}
                        className="input-field pl-icon bg-slate-900/50 border-white/10 focus:border-emerald-500/50"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16"><div className="spinner" /></div>
            ) : (
                <>
                    {/* Mobile Card View */}
                    <div className="sm:hidden space-y-3">
                        {customers.length === 0 ? (
                            <div className="glass-card p-8 text-center">
                                <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-4"><UserCheck size={28} className="text-slate-500" /></div>
                                <p className="text-slate-400 font-medium">ไม่พบลูกค้า</p>
                            </div>
                        ) : customers.map(c => (
                            <div key={c.id} className="glass-card p-4 border border-white/5">
                                <div className="flex justify-between items-start mb-2">
                                    <button onClick={() => openDetail(c)} className="text-left">
                                        <h4 className="text-emerald-400 font-semibold text-sm">{c.name}</h4>
                                    </button>
                                    <span className="inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                        {c._count?.orders ?? 0} ครั้ง
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-2 mb-3 text-xs text-slate-400">
                                    {c.phone && <span className="flex items-center gap-1"><Phone size={10} /> {c.phone}</span>}
                                    {c.lineId && <span className="flex items-center gap-1"><MessageCircle size={10} /> {c.lineId}</span>}
                                    <span>สมัคร {formatDate(c.createdAt)}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button className="flex-1 text-xs py-2 px-3 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-colors" onClick={() => openEdit(c)}>แก้ไข</button>
                                    <button className="flex-1 text-xs py-2 px-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors" onClick={() => handleDelete(c.id)}>ลบ</button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop Table */}
                    <div className="hidden sm:block glass-card overflow-hidden border border-white/5">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="py-4 px-6 text-slate-400 font-semibold text-xs tracking-wider">ชื่อลูกค้า</th>
                                    <th className="py-4 px-6 text-slate-400 font-semibold text-xs tracking-wider">เบอร์โทร</th>
                                    <th className="py-4 px-6 text-slate-400 font-semibold text-xs tracking-wider">Line ID</th>
                                    <th className="py-4 px-6 text-slate-400 font-semibold text-xs tracking-wider">ซื้อแล้ว</th>
                                    <th className="py-4 px-6 text-slate-400 font-semibold text-xs tracking-wider">วันที่สมัคร</th>
                                    <th className="py-4 px-6 text-slate-400 font-semibold text-xs tracking-wider">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {customers.length === 0 && (
                                    <tr><td colSpan={6} className="py-12 text-center text-slate-500">ไม่พบลูกค้า</td></tr>
                                )}
                                {customers.map(c => (
                                    <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="py-4 px-6">
                                            <button onClick={() => openDetail(c)} className="text-emerald-400 font-semibold text-sm hover:underline bg-transparent border-none cursor-pointer font-[inherit]">
                                                {c.name}
                                            </button>
                                        </td>
                                        <td className="py-4 px-6 text-slate-300 text-sm">{c.phone || '-'}</td>
                                        <td className="py-4 px-6 text-slate-300 text-sm">{c.lineId || '-'}</td>
                                        <td className="py-4 px-6">
                                            <span className="inline-flex px-2.5 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                {c._count?.orders ?? 0} ครั้ง
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-slate-400 text-sm">{formatDate(c.createdAt)}</td>
                                        <td className="py-4 px-6">
                                            <div className="flex gap-2">
                                                <button className="text-xs py-1.5 px-3 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-colors" onClick={() => openEdit(c)}>แก้ไข</button>
                                                <button className="text-xs py-1.5 px-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors" onClick={() => handleDelete(c.id)}>ลบ</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* Add/Edit Modal */}
            {isOpen && createPortal(
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-0 sm:p-4" onClick={() => setIsOpen(false)}>
                    <div className="glass-card w-full sm:max-w-md p-0 overflow-hidden shadow-2xl border border-white/10 max-h-full sm:max-h-[90vh] flex flex-col sm:rounded-2xl rounded-none h-full sm:h-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-5 border-b border-white/5 bg-white/[0.02]">
                            <h2 className="text-lg font-bold text-white">{editing ? 'แก้ไขลูกค้า' : 'เพิ่มลูกค้า'}</h2>
                            <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white"><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSave} className="flex-1 overflow-y-auto">
                            <div className="p-5 space-y-4">
                                {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-3 text-sm">{error}</div>}
                                <div>
                                    <label className="block text-xs text-slate-400 font-medium mb-1.5">ชื่อ *</label>
                                    <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="input-field" />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 font-medium mb-1.5">เบอร์โทร</label>
                                    <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="08X-XXX-XXXX" className="input-field" />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 font-medium mb-1.5">Line ID</label>
                                    <input value={form.lineId} onChange={e => setForm({ ...form, lineId: e.target.value })} className="input-field" />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 font-medium mb-1.5">หมายเหตุ</label>
                                    <textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} rows={2} className="input-field" />
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

            {/* Detail Modal */}
            {detailCustomer && createPortal(
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-0 sm:p-4" onClick={() => setDetailCustomer(null)}>
                    <div className="glass-card w-full sm:max-w-lg p-0 overflow-hidden shadow-2xl border border-white/10 max-h-full sm:max-h-[90vh] flex flex-col sm:rounded-2xl rounded-none h-full sm:h-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-5 border-b border-white/5 bg-white/[0.02]">
                            <h2 className="text-lg font-bold text-white">👤 {detailCustomer.name}</h2>
                            <button onClick={() => setDetailCustomer(null)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white"><X size={18} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-5">
                            <div className="flex flex-wrap gap-2 mb-4">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/50 text-xs text-slate-300 border border-white/5">
                                    <Phone size={12} /> {detailCustomer.phone || 'ไม่มีเบอร์'}
                                </span>
                                {detailCustomer.lineId && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-xs text-emerald-400 border border-emerald-500/20">
                                        <MessageCircle size={12} /> Line: {detailCustomer.lineId}
                                    </span>
                                )}
                            </div>
                            <h3 className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-3">ประวัติการซื้อ</h3>
                            {detailCustomer.orders?.length === 0 && <p className="text-slate-500 text-sm">ยังไม่มีประวัติการซื้อ</p>}
                            <div className="space-y-2 max-h-[40vh] overflow-y-auto custom-scrollbar">
                                {detailCustomer.orders?.map(o => (
                                    <div key={o.id} className="bg-white/[0.03] rounded-xl p-3 border border-white/5">
                                        <div className="flex justify-between mb-1">
                                            <span className="text-xs text-slate-400">{formatDate(o.createdAt)}</span>
                                            <span className="font-bold text-emerald-400 text-sm">฿{formatCurrency(o.total)}</span>
                                        </div>
                                        <div className="text-xs text-slate-500 truncate">
                                            {o.items.map(i => i.snake?.name).join(', ')}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
