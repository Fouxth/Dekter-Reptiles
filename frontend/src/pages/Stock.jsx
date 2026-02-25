import { useState, useEffect } from 'react';
import {
    Search,
    Package,
    AlertTriangle,
    Boxes,
    TrendingUp,
    Plus,
    Minus,
    Clock
} from 'lucide-react';
import { createPortal } from 'react-dom';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export default function Stock() {
    const [snakes, setSnakes] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => { fetchData(); }, []);
    useEffect(() => { if (activeTab === 'history') fetchLogs(); }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/snakes`);
            if (res.ok) setSnakes(await res.json());
        } catch (error) { console.error('Failed to fetch snakes:', error); }
        finally { setLoading(false); }
    };

    const fetchLogs = async () => {
        try {
            const res = await fetch(`${API}/stock-logs`);
            if (res.ok) setLogs(await res.json());
        } catch (error) { console.error('Failed to fetch stock logs:', error); }
    };

    const adjustStock = async (snake, change) => {
        if (snake.stock + change < 0) return;
        setSnakes(prev => prev.map(s => s.id === snake.id ? { ...s, stock: s.stock + change } : s));
        try {
            const res = await fetch(`${API}/stock-logs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    snakeId: snake.id, change, reason: 'adjustment',
                    note: change > 0 ? 'เพิ่มสต็อกแบบด่วน' : 'ลดสต็อกแบบด่วน'
                })
            });
            if (!res.ok) fetchData();
            else if (activeTab === 'history') fetchLogs();
        } catch (error) { console.error('Error adjusting stock:', error); fetchData(); }
    };

    const formatCurrency = (amount) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(amount);
    const formatDate = (date) => new Date(date).toLocaleString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    const totalProducts = snakes.length;
    const lowStockCount = snakes.filter(s => s.stock > 0 && s.stock <= 3).length;
    const outOfStockCount = snakes.filter(s => s.stock === 0).length;
    const totalValue = snakes.reduce((sum, s) => sum + (s.price * s.stock), 0);
    const maxStock = Math.max(...snakes.map(s => s.stock), 100);

    const filteredSnakes = snakes.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.category?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.code && s.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.morph && s.morph.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    const filteredLogs = logs.filter(log => log.snake?.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const getStatus = (stock) => {
        if (stock === 0) return { label: 'หมด', class: 'text-red-400 border-red-500/30 bg-red-500/10', barClass: 'bg-red-500/50' };
        if (stock <= 3) return { label: 'ใกล้หมด', class: 'text-amber-400 border-amber-500/30 bg-amber-500/10', barClass: 'bg-amber-500/50' };
        return { label: 'ปกติ', class: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10', barClass: 'bg-emerald-500/50' };
    };

    return (
        <div className="space-y-4 sm:space-y-6 animate-fade-in p-1 sm:p-2">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">จัดการสต็อก</h1>
                <p className="text-slate-400 mt-1 text-sm sm:text-base">ติดตามและจัดการสต็อกสินค้า</p>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {[
                    { icon: Package, value: totalProducts, label: 'สินค้าทั้งหมด', color: 'emerald' },
                    { icon: AlertTriangle, value: lowStockCount, label: 'สินค้าใกล้หมด', color: 'amber' },
                    { icon: Boxes, value: outOfStockCount, label: 'สินค้าหมด', color: 'red' },
                    { icon: TrendingUp, value: formatCurrency(totalValue), label: 'มูลค่าสต็อก', color: 'blue' },
                ].map(({ icon: Icon, value, label, color }) => (
                    <div key={label} className={`glass-card p-3 sm:p-5 flex items-center gap-3 sm:gap-4 border border-${color}-500/10`}>
                        <div className={`p-2 sm:p-3 bg-${color}-500/10 rounded-xl`}>
                            <Icon size={20} className={`text-${color}-400`} />
                        </div>
                        <div className="min-w-0">
                            <p className={`text-lg sm:text-2xl font-bold text-${color === 'emerald' ? 'white' : color + '-400'} tracking-tight truncate`}>{value}</p>
                            <p className="text-slate-400 text-[10px] sm:text-sm font-medium mt-0.5">{label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tabs & Search */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                <div className="flex bg-slate-900/50 p-1 rounded-xl border border-white/5 w-full sm:w-auto">
                    <button onClick={() => setActiveTab('overview')} className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'overview' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                        ภาพรวม
                    </button>
                    <button onClick={() => setActiveTab('history')} className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'history' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                        ประวัติ
                    </button>
                </div>
                <div className="relative w-full sm:w-80 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-emerald-400 transition-colors" size={18} />
                    <input type="text" placeholder="ค้นหาสินค้า..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                        className="input-field pl-icon bg-slate-900/50 border-white/10 focus:border-emerald-500/50" />
                </div>
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <>
                    {/* Mobile Card View */}
                    <div className="sm:hidden space-y-3">
                        {loading && snakes.length === 0 ? (
                            <div className="flex items-center justify-center py-12"><div className="spinner" /></div>
                        ) : filteredSnakes.length === 0 ? (
                            <div className="glass-card p-8 text-center text-slate-500">ไม่พบสินค้า</div>
                        ) : filteredSnakes.map(snake => {
                            const status = getStatus(snake.stock);
                            return (
                                <div key={snake.id} className="glass-card p-4 border border-white/5">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="text-white font-medium text-sm">{snake.name}</h4>
                                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                                {snake.code && <span className="text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">{snake.code}</span>}
                                                <span className="text-xs text-slate-500">{snake.category?.name || 'ไม่มีหมวดหมู่'}</span>
                                            </div>
                                        </div>
                                        <span className={`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full border ${status.class}`}>
                                            {status.label}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 mt-2 mb-3">
                                        <div>
                                            <span className="text-[10px] text-slate-500 block">ทุน</span>
                                            <span className="text-xs font-medium text-red-400">{snake.cost ? formatCurrency(snake.cost) : '-'}</span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-slate-500 block">ขาย</span>
                                            <span className="text-xs font-medium text-emerald-400">{formatCurrency(snake.price)}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] text-slate-500 block">คงเหลือ</span>
                                            <span className="text-sm font-bold text-white">{snake.stock}</span>
                                        </div>
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-2 mb-3">
                                        <div className={`h-full rounded-full transition-all duration-500 ${status.barClass}`}
                                            style={{ width: `${Math.min((snake.stock / (maxStock > 0 ? maxStock : 100)) * 100, 100)}%` }} />
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => adjustStock(snake, 1)}
                                            className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium active:scale-95 transition-all">
                                            <Plus size={14} /> เพิ่ม
                                        </button>
                                        <button onClick={() => adjustStock(snake, -1)} disabled={snake.stock <= 0}
                                            className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium disabled:opacity-40 active:scale-95 transition-all">
                                            <Minus size={14} /> ลด
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Desktop Table */}
                    <div className="hidden sm:block glass-card overflow-hidden border border-white/5">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className="py-4 px-4 text-slate-400 font-semibold text-xs tracking-wider">#</th>
                                        <th className="py-4 px-4 text-slate-400 font-semibold text-xs tracking-wider">Code</th>
                                        <th className="py-4 px-4 text-slate-400 font-semibold text-xs tracking-wider">สินค้า</th>
                                        <th className="py-4 px-4 text-slate-400 font-semibold text-xs tracking-wider text-right">ทุน</th>
                                        <th className="py-4 px-4 text-slate-400 font-semibold text-xs tracking-wider text-right">ขาย</th>
                                        <th className="py-4 px-4 text-slate-400 font-semibold text-xs tracking-wider text-center">สถานะ</th>
                                        <th className="py-4 px-4 text-slate-400 font-semibold text-xs tracking-wider text-center">คงเหลือ</th>
                                        <th className="py-4 px-4 text-slate-400 font-semibold text-xs tracking-wider text-center w-32">จัดการ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredSnakes.map((snake, i) => {
                                        const status = getStatus(snake.stock);
                                        const pct = Math.min((snake.stock / (maxStock > 0 ? maxStock : 100)) * 100, 100);
                                        return (
                                            <tr key={snake.id} className="hover:bg-white/[0.02] transition-colors">
                                                <td className="py-3 px-4 text-slate-500 text-sm">{i + 1}</td>
                                                <td className="py-3 px-4">
                                                    {snake.code ? <span className="text-blue-400 text-sm font-medium">{snake.code}</span> : <span className="text-slate-600 text-sm">-</span>}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="text-white text-sm font-medium">{snake.name}</span>
                                                    <span className="block text-xs text-slate-500 mt-0.5">{snake.category?.name || 'ไม่มีหมวดหมู่'}</span>
                                                </td>
                                                <td className="py-3 px-4 text-right text-red-400 text-sm font-medium">{snake.cost ? formatCurrency(snake.cost) : '-'}</td>
                                                <td className="py-3 px-4 text-right text-emerald-400 text-sm font-medium">{formatCurrency(snake.price)}</td>
                                                <td className="py-3 px-4 text-center">
                                                    <span className={`inline-flex px-2 py-0.5 text-[10px] font-medium rounded-full border ${status.class}`}>{status.label}</span>
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <span className="text-sm font-bold text-white">{snake.stock}</span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        <button onClick={() => adjustStock(snake, 1)} className="w-7 h-7 rounded border border-white/10 bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-95">
                                                            <Plus size={14} />
                                                        </button>
                                                        <button onClick={() => adjustStock(snake, -1)} disabled={snake.stock <= 0}
                                                            className="w-7 h-7 rounded border border-white/10 bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50 active:scale-95">
                                                            <Minus size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
                <>
                    {/* Mobile Card View */}
                    <div className="sm:hidden space-y-3">
                        {logs.length === 0 ? (
                            <div className="glass-card p-8 text-center text-slate-500">ไม่มีประวัติการเคลื่อนไหว</div>
                        ) : filteredLogs.map(log => {
                            const isAdd = log.change > 0;
                            return (
                                <div key={log.id} className="glass-card p-4 border border-white/5">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="text-white font-medium text-sm">{log.snake?.name || 'ลบแล้ว'}</h4>
                                        <span className={`text-sm font-bold ${isAdd ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {isAdd ? '+' : ''}{log.change}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-slate-500">
                                        <div className="flex items-center gap-1"><Clock size={12} /> {formatDate(log.createdAt)}</div>
                                        <span className={`inline-flex px-2 py-0.5 text-[10px] font-medium rounded-full border ${isAdd ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : 'text-red-400 border-red-500/30 bg-red-500/10'}`}>
                                            {isAdd ? 'รับเข้า' : 'จ่ายออก'}
                                        </span>
                                    </div>
                                    {log.note && <p className="text-xs text-slate-500 mt-2">{log.note}</p>}
                                </div>
                            );
                        })}
                    </div>

                    {/* Desktop Table */}
                    <div className="hidden sm:block glass-card overflow-hidden border border-white/5">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className="py-4 px-6 text-slate-400 font-semibold text-xs tracking-wider">วันเวลา</th>
                                        <th className="py-4 px-6 text-slate-400 font-semibold text-xs tracking-wider">สินค้า</th>
                                        <th className="py-4 px-6 text-slate-400 font-semibold text-xs tracking-wider text-center">ประเภท</th>
                                        <th className="py-4 px-6 text-slate-400 font-semibold text-xs tracking-wider text-center">จำนวน</th>
                                        <th className="py-4 px-6 text-slate-400 font-semibold text-xs tracking-wider">หมายเหตุ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {logs.length === 0 ? (
                                        <tr><td colSpan="5" className="py-12 text-center text-slate-500">ไม่มีประวัติการเคลื่อนไหว</td></tr>
                                    ) : filteredLogs.map(log => {
                                        const isAdd = log.change > 0;
                                        return (
                                            <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                                                <td className="py-4 px-6 text-sm text-slate-400 whitespace-nowrap"><Clock size={14} className="inline mr-2 opacity-50" />{formatDate(log.createdAt)}</td>
                                                <td className="py-4 px-6 text-white text-sm font-medium">{log.snake?.name || 'ลบแล้ว'}</td>
                                                <td className="py-4 px-6 text-center">
                                                    <span className={`inline-flex px-2 py-0.5 text-[10px] font-medium rounded-full border ${isAdd ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : 'text-red-400 border-red-500/30 bg-red-500/10'}`}>
                                                        {isAdd ? 'รับเข้า' : 'จ่ายออก'}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-center"><span className={`text-sm font-bold ${isAdd ? 'text-emerald-400' : 'text-red-400'}`}>{isAdd ? '+' : ''}{log.change}</span></td>
                                                <td className="py-4 px-6 text-sm text-slate-400">{log.note || (log.reason === 'sale' ? 'การขาย (POS)' : log.reason === 'adjustment' ? 'ปรับปรุงด้วยมือ' : log.reason)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
