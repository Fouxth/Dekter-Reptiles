import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FileText, Download, Calendar, Clock } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

function formatCurrency(n) { return (n || 0).toLocaleString('th-TH', { minimumFractionDigits: 0 }); }
function formatDate(d) { return d ? new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'; }
function formatTime(d) { return d ? new Date(d).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '-'; }

function exportCSV(orders, filename) {
    const headers = ['วันที่', 'เวลา', 'Order No', 'รายการสินค้า', 'ลูกค้า', 'พนักงาน', 'ยอดรวม', 'ส่วนลด', 'ยอดสุทธิ', 'ช่องทางชำระ'];
    const rows = orders.map(o => [
        formatDate(o.createdAt), formatTime(o.createdAt), o.orderNo?.slice(-10) || o.id,
        o.items.map(i => `${i.snake?.name}(x${i.quantity})`).join(' | '),
        o.customer?.name || '-', o.user?.name || '-', o.subtotal || o.total, o.discount || 0, o.total,
        { cash: 'เงินสด', transfer: 'โอน', card: 'บัตร' }[o.paymentMethod] || o.paymentMethod || '-',
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
}

export default function Reports() {
    const { getToken } = useAuth();
    const today = new Date().toISOString().slice(0, 10);
    const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);

    const [startDate, setStartDate] = useState(firstDay);
    const [endDate, setEndDate] = useState(today);
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loaded, setLoaded] = useState(false);

    const headers = () => ({ Authorization: `Bearer ${getToken()}` });

    async function fetchReport() {
        setLoading(true);
        const res = await fetch(`${API}/dashboard/report?startDate=${startDate}&endDate=${endDate}`, { headers: headers() });
        if (res.ok) { setReport(await res.json()); setLoaded(true); }
        setLoading(false);
    }

    useEffect(() => { fetchReport(); }, []);

    function handleExport() {
        if (!report?.orders?.length) return;
        exportCSV(report.orders, `SnakePOS-Report-${startDate}-to-${endDate}.csv`);
    }

    const paymentLabel = (m) => ({ cash: 'เงินสด', transfer: 'โอน', card: 'บัตร' }[m] || m);

    return (
        <div className="space-y-4 sm:space-y-6 animate-fade-in p-1 sm:p-2">
            {/* Header */}
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
                    <FileText size={24} className="text-emerald-400" /> รายงานการขาย
                </h1>
                <p className="text-slate-400 mt-1 text-sm sm:text-base">สรุปยอดขายตามช่วงเวลาที่เลือก</p>
            </div>

            {/* Filter Bar */}
            <div className="glass-card p-3 sm:p-4 flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
                    <div className="flex-1 sm:flex-none">
                        <label className="block text-xs text-slate-400 font-medium mb-1.5">ตั้งแต่วันที่</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input-field w-full sm:w-40" />
                    </div>
                    <div className="flex-1 sm:flex-none">
                        <label className="block text-xs text-slate-400 font-medium mb-1.5">ถึงวันที่</label>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input-field w-full sm:w-40" />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {[
                            { label: 'วันนี้', onClick: () => { const d = today; setStartDate(d); setEndDate(d); } },
                            { label: 'สัปดาห์นี้', onClick: () => { const d = new Date(); const start = new Date(d); start.setDate(d.getDate() - d.getDay()); setStartDate(start.toISOString().slice(0, 10)); setEndDate(d.toISOString().slice(0, 10)); } },
                            { label: 'เดือนนี้', onClick: () => { const d = new Date(); const start = new Date(d.getFullYear(), d.getMonth(), 1); setStartDate(start.toISOString().slice(0, 10)); setEndDate(d.toISOString().slice(0, 10)); } },
                        ].map(p => (
                            <button key={p.label} onClick={p.onClick} className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-300 hover:bg-white/10 transition-colors">{p.label}</button>
                        ))}
                    </div>
                </div>
                <button onClick={fetchReport} disabled={loading} className="btn-primary w-full sm:w-auto sm:self-end flex items-center justify-center gap-2">
                    {loading ? 'กำลังโหลด...' : '🔍 ดูรายงาน'}
                </button>
            </div>

            {loaded && report && (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        {[
                            { label: 'ยอดขายรวม', value: `฿${formatCurrency(report.totalRevenue)}`, color: 'emerald' },
                            { label: 'ส่วนลดรวม', value: `฿${formatCurrency(report.totalDiscount)}`, color: 'red' },
                            { label: 'จำนวนออเดอร์', value: `${report.orderCount}`, color: 'blue' },
                            { label: 'จำนวนสินค้า', value: `${report.totalItems} ตัว`, color: 'violet' },
                        ].map(c => (
                            <div key={c.label} className="glass-card p-3 sm:p-4 border border-white/5">
                                <p className="text-[10px] sm:text-xs text-slate-500 font-medium mb-1">{c.label}</p>
                                <p className={`text-lg sm:text-xl font-bold text-${c.color}-400 truncate`}>{c.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Export */}
                    <div className="flex justify-end">
                        <button onClick={handleExport} disabled={!report.orders.length} className="btn-primary flex items-center gap-2 text-sm">
                            <Download size={15} /> Export CSV
                        </button>
                    </div>

                    {/* Orders */}
                    {report.orders.length === 0 ? (
                        <div className="glass-card p-8 text-center text-slate-500">ไม่มีข้อมูลในช่วงเวลาที่เลือก</div>
                    ) : (
                        <>
                            {/* Mobile Card View */}
                            <div className="sm:hidden space-y-3">
                                {report.orders.map(o => (
                                    <div key={o.id} className="glass-card p-4 border border-white/5">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="text-xs text-emerald-400 font-mono">#{o.orderNo?.slice(-8) || o.id}</p>
                                                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><Calendar size={10} /> {formatDate(o.createdAt)} {formatTime(o.createdAt)}</p>
                                            </div>
                                            <p className="font-bold text-emerald-400 text-sm">฿{formatCurrency(o.total)}</p>
                                        </div>
                                        <div className="text-xs text-slate-400 mb-2 line-clamp-2">
                                            {o.items.map(i => `${i.snake?.name} ×${i.quantity}`).join(', ')}
                                        </div>
                                        <div className="flex flex-wrap gap-2 text-[10px]">
                                            {o.customer?.name && <span className="px-2 py-0.5 rounded-full bg-white/5 text-slate-400">{o.customer.name}</span>}
                                            <span className="px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20">{paymentLabel(o.paymentMethod)}</span>
                                            {o.discount > 0 && <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">-฿{formatCurrency(o.discount)}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop Table */}
                            <div className="hidden sm:block glass-card overflow-hidden border border-white/5">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-white/10">
                                                <th className="py-4 px-4 text-slate-400 font-semibold text-xs tracking-wider">วันที่/เวลา</th>
                                                <th className="py-4 px-4 text-slate-400 font-semibold text-xs tracking-wider">Order No</th>
                                                <th className="py-4 px-4 text-slate-400 font-semibold text-xs tracking-wider">รายการ</th>
                                                <th className="py-4 px-4 text-slate-400 font-semibold text-xs tracking-wider">ลูกค้า</th>
                                                <th className="py-4 px-4 text-slate-400 font-semibold text-xs tracking-wider">พนักงาน</th>
                                                <th className="py-4 px-4 text-slate-400 font-semibold text-xs tracking-wider text-right">ยอดรวม</th>
                                                <th className="py-4 px-4 text-slate-400 font-semibold text-xs tracking-wider text-right">ส่วนลด</th>
                                                <th className="py-4 px-4 text-slate-400 font-semibold text-xs tracking-wider text-right">สุทธิ</th>
                                                <th className="py-4 px-4 text-slate-400 font-semibold text-xs tracking-wider">ชำระ</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {report.orders.map(o => (
                                                <tr key={o.id} className="hover:bg-white/[0.02] transition-colors">
                                                    <td className="py-3 px-4 text-xs text-slate-400 whitespace-nowrap">{formatDate(o.createdAt)}<br /><span className="text-slate-600">{formatTime(o.createdAt)}</span></td>
                                                    <td className="py-3 px-4 font-mono text-xs text-emerald-400">#{o.orderNo?.slice(-8) || o.id}</td>
                                                    <td className="py-3 px-4 text-xs text-slate-300 max-w-[200px]">{o.items.map(i => <span key={i.id} className="block">{i.snake?.name} <span className="text-slate-500">×{i.quantity}</span></span>)}</td>
                                                    <td className="py-3 px-4 text-xs text-slate-300">{o.customer?.name || '-'}</td>
                                                    <td className="py-3 px-4 text-xs text-slate-300">{o.user?.name || '-'}</td>
                                                    <td className="py-3 px-4 text-xs text-slate-400 text-right">฿{formatCurrency(o.subtotal || o.total)}</td>
                                                    <td className="py-3 px-4 text-xs text-red-400 text-right">{o.discount > 0 ? `-฿${formatCurrency(o.discount)}` : '-'}</td>
                                                    <td className="py-3 px-4 text-sm font-bold text-emerald-400 text-right">฿{formatCurrency(o.total)}</td>
                                                    <td className="py-3 px-4"><span className="inline-flex px-2 py-0.5 text-[10px] font-medium rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20">{paymentLabel(o.paymentMethod)}</span></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="bg-emerald-500/5 font-bold border-t border-white/10">
                                                <td colSpan={5} className="py-3 px-4 text-xs text-slate-400 text-right">รวมทั้งหมด</td>
                                                <td className="py-3 px-4 text-xs text-slate-400 text-right">฿{formatCurrency(report.orders.reduce((s, o) => s + (o.subtotal || o.total), 0))}</td>
                                                <td className="py-3 px-4 text-xs text-red-400 text-right">-฿{formatCurrency(report.totalDiscount)}</td>
                                                <td className="py-3 px-4 text-sm text-emerald-400 text-right">฿{formatCurrency(report.totalRevenue)}</td>
                                                <td />
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
}
