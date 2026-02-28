import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import {
    TrendingUp, Package, ShoppingCart, DollarSign,
    AlertTriangle, ArrowUpRight, ArrowDownRight,
    Clock, Activity, Users, BarChart2, FileText,
    Zap, Egg, RefreshCw, Plus, Minus
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL;

function formatCurrency(n, currencySymbol = '฿') {
    return `${currencySymbol}${new Intl.NumberFormat('th-TH', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(n || 0)}`;
}

// Pure SVG line/area chart
function SalesChart({ data, chartDays, onChangeDays }) {
    const W = 600, H = 160, PAD = { t: 12, r: 12, b: 32, l: 50 };
    const innerW = W - PAD.l - PAD.r;
    const innerH = H - PAD.t - PAD.b;

    const maxSale = Math.max(...data.map(d => d.sales), 1);
    const pts = data.map((d, i) => ({
        x: PAD.l + (i / (data.length - 1 || 1)) * innerW,
        y: PAD.t + innerH - (d.sales / maxSale) * innerH,
        ...d,
    }));

    const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    const area = line + ` L${pts.at(-1).x.toFixed(1)},${(PAD.t + innerH).toFixed(1)} L${pts[0].x.toFixed(1)},${(PAD.t + innerH).toFixed(1)} Z`;

    const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => ({
        y: PAD.t + innerH - f * innerH,
        label: (maxSale * f / 1000).toFixed(0) + 'K',
    }));

    const xStep = data.length <= 7 ? 1 : data.length <= 14 ? 2 : 5;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem', marginBottom: '0.5rem' }}>
                {[7, 14, 30].map(d => (
                    <button key={d} onClick={() => onChangeDays(d)}
                        className={`btn btn-sm ${chartDays === d ? 'btn-primary' : 'btn-outline'}`}
                        style={{ padding: '0.15rem 0.5rem', fontSize: '0.7rem' }}>
                        {d} วัน
                    </button>
                ))}
            </div>
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
                <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
                    </linearGradient>
                </defs>
                {yTicks.map((t, i) => (
                    <g key={i}>
                        <line x1={PAD.l} y1={t.y} x2={W - PAD.r} y2={t.y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                        <text x={PAD.l - 6} y={t.y + 4} fill="#64748b" fontSize="9" textAnchor="end">{t.label}</text>
                    </g>
                ))}
                <path d={area} fill="url(#chartGrad)" />
                <path d={line} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                {pts.filter((_, i) => i % xStep === 0).map((p, i) => (
                    <text key={i} x={p.x} y={H - 4} fill="#64748b" fontSize="9" textAnchor="middle">{p.short}</text>
                ))}
                {pts.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r="3" fill="#10b981" stroke="#0f172a" strokeWidth="1.5">
                        <title>{p.day}: {formatCurrency(p.sales, data.currencySymbol)} ({p.orders} orders)</title>
                    </circle>
                ))}
            </svg>
        </div>
    );
}

// Pure SVG Pie Chart
function PieChart({ data = [], size = 160 }) {
    if (!Array.isArray(data) || data.length === 0) return <div style={{ height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '0.8rem' }}>ยังไม่มีข้อมูล</div>;
    const SIZE = size, R = size * 0.35, CTR = SIZE / 2;
    const total = data.reduce((s, d) => s + (Number(d.value) || 0), 0) || 1;
    const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#f472b6'];

    const sectors = [...data].sort((a, b) => (b.value || 0) - (a.value || 0)).reduce((acc, d, i) => {
        const val = Number(d.value) || 0;
        const angle = (val / total) * Math.PI * 2;
        const prevAngle = i === 0 ? -Math.PI / 2 : acc[i - 1].endAngle;
        const nextAngle = prevAngle + angle;
        const x1 = CTR + R * Math.cos(prevAngle);
        const y1 = CTR + R * Math.sin(prevAngle);
        const x2 = CTR + R * Math.cos(nextAngle);
        const y2 = CTR + R * Math.sin(nextAngle);
        const largeArc = angle > Math.PI ? 1 : 0;
        const path = `M${CTR},${CTR} L${x1},${y1} A${R},${R} 0 ${largeArc} 1 ${x2},${y2} Z`;
        acc.push({ path, color: colors[i % colors.length], ...d, value: val, endAngle: nextAngle });
        return acc;
    }, []);

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
                {sectors.map((s, i) => (
                    <path key={i} d={s.path} fill={s.color} stroke="#0f172a" strokeWidth="2">
                        <title>{s.name}: {s.value}</title>
                    </path>
                ))}
                <circle cx={CTR} cy={CTR} r={R * 0.6} fill="#1e293b" />
            </svg>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', minWidth: '100px' }}>
                {sectors.slice(0, 5).map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem' }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                        <span style={{ color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '80px' }}>{s.name}</span>
                        <span style={{ color: '#f8fafc', fontWeight: 600 }}>{((s.value / total) * 100).toFixed(0)}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function Dashboard() {
    const navigate = useNavigate();
    const { getToken } = useAuth();
    const { socket } = useSocket();
    const [stats, setStats] = useState(null);
    const [recentOrders, setRecentOrders] = useState([]);
    const [topSelling, setTopSelling] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [chartDays, setChartDays] = useState(7);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [settings, setSettings] = useState({});

    const authHeaders = () => ({ Authorization: `Bearer ${getToken()}` });

    const loadChart = useCallback(async (days) => {
        const res = await fetch(`${API}/dashboard/sales-chart?days=${days}`, { headers: authHeaders() });
        if (res.ok) setChartData(await res.json());
    }, []);

    const fetchDashboardData = useCallback(async (showLoading = true) => {
        if (showLoading) setLoading(true);
        else setRefreshing(true);

        try {
            const [statsRes, ordersRes, topRes, settingsRes] = await Promise.all([
                fetch(`${API}/dashboard/stats`, { headers: authHeaders() }),
                fetch(`${API}/dashboard/recent-orders`, { headers: authHeaders() }),
                fetch(`${API}/dashboard/top-selling`, { headers: authHeaders() }),
                fetch(`${API}/settings`, { headers: authHeaders() }),
            ]);
            if (statsRes.ok) setStats(await statsRes.json());
            if (ordersRes.ok) setRecentOrders(await ordersRes.json());
            if (topRes.ok) setTopSelling(await topRes.json());
            if (settingsRes.ok) setSettings(await settingsRes.json());
            await loadChart(chartDays);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [chartDays, loadChart]);

    useEffect(() => {
        fetchDashboardData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Socket Integration for Real-time Refresh
    useEffect(() => {
        if (!socket) return;

        const handleUpdate = () => {
            fetchDashboardData(false); // Refresh silently
        };

        socket.on('new_order', handleUpdate);
        socket.on('order_status_changed', handleUpdate);
        socket.on('low_stock_alert', handleUpdate);
        socket.on('sales_target_reached', handleUpdate);

        return () => {
            socket.off('new_order', handleUpdate);
            socket.off('order_status_changed', handleUpdate);
            socket.off('low_stock_alert', handleUpdate);
            socket.off('sales_target_reached', handleUpdate);
        };
    }, [socket, fetchDashboardData]);

    async function handleChangeDays(d) {
        setChartDays(d);
        await loadChart(d);
    }

    // Pass settings to chart for symbols
    chartData.currencySymbol = settings.currency_symbol;

    // Daily Sales Target calculation
    const isTargetEnabled = settings.notify_sales_target === 'true';
    const rawTarget = Number(settings.daily_target) || 0;
    const progressPercent = Math.min(((stats?.todaySales || 0) / (rawTarget || 1)) * 100, 100);

    const statCards = [
        {
            title: 'ยอดขายวันนี้',
            value: stats?.todaySales || 0,
            format: 'currency',
            icon: DollarSign,
            color: 'emerald',
            sub: `${stats?.todayOrderCount || 0} ออเดอร์`,
            growth: stats?.growth != null ? stats.growth : 0,
            hasTarget: isTargetEnabled,
            targetDisplay: `${formatCurrency(stats?.todaySales, settings.currency_symbol)} / ${formatCurrency(rawTarget, settings.currency_symbol)}`,
            progress: progressPercent
        },
        {
            title: 'กำไรสุทธิเดือนนี้',
            value: stats?.monthNetProfit || 0,
            format: 'currency',
            icon: TrendingUp,
            color: 'blue',
            sub: `รายได้เดือนนี้ ${formatCurrency(stats?.monthSales, settings.currency_symbol)}`
        },
        {
            title: 'งูในสต็อก',
            value: stats?.totalStock || 0,
            format: 'number',
            icon: Package,
            color: 'violet',
            suffix: ' ตัว',
            sub: `${stats?.totalSnakes || 0} รายการสินค้า`
        },
        {
            title: 'สต็อกใกล้หมด',
            value: stats?.lowStock || 0,
            format: 'number',
            icon: AlertTriangle,
            color: 'amber',
            suffix: ' รายการ',
            sub: stats?.lowStock > 0 ? '⚠️ ควรเติมเร็วๆ นี้' : '✅ ปกติ'
        },
        {
            title: 'รายจ่ายเดือนนี้',
            value: stats?.monthExpenses || 0,
            format: 'currency',
            icon: DollarSign,
            color: 'red',
            sub: `รวมรายจ่ายในเดือน ${new Date().toLocaleDateString('th-TH', { month: 'long' })}`
        },
    ];

    if (loading) {
        return (
            <div className="page" style={{ paddingTop: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(240px, 100%),1fr))', gap: '1rem', marginBottom: '1rem' }}>
                    {[1, 2, 3, 4, 5].map(i => <div key={i} className="card" style={{ height: 100, background: 'rgba(255,255,255,0.03)' }} />)}
                </div>
                <div className="loading-center" style={{ padding: '4rem' }}><div className="spinner" /></div>
            </div>
        );
    }

    const gradients = {
        emerald: 'rgba(16,185,129,0.08)', blue: 'rgba(59,130,246,0.08)',
        violet: 'rgba(139,92,246,0.08)', amber: 'rgba(245,158,11,0.08)',
        red: 'rgba(239,68,68,0.08)'
    };
    const iconColors = {
        emerald: '#10b981', blue: '#3b82f6', violet: '#8b5cf6', amber: '#f59e0b', red: '#ef4444'
    };

    const maxSold = Math.max(...topSelling.map(s => s.totalSold || 0), 1);

    return (
        <div className="page" style={{ paddingBottom: '3rem' }}>

            {/* Header & Quick Actions */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(59,130,246,0.1) 100%)',
                borderRadius: '1.5rem',
                padding: '1.5rem',
                marginBottom: '1.5rem',
                border: '1px solid rgba(255,255,255,0.05)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{ position: 'absolute', top: '-10%', right: '-5%', opacity: 0.1 }}>
                    <Activity size={200} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem', position: 'relative', zIndex: 1 }}>
                    <div style={{ minWidth: '240px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                            <h1 style={{ color: '#f8fafc', fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>สวัสดี, คุณ{getToken() ? 'แอดมิน' : 'พนักงาน'} 👋</h1>
                        </div>
                        <p style={{ color: '#94a3b8', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                            <Clock size={14} className="text-emerald-500" />
                            {new Date().toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            <span style={{ color: '#475569' }}>•</span>
                            <span>เริ่มรอบขาย {settings.reset_time || '00:00'}</span>
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <button onClick={() => navigate('/pos')} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.75rem 1.25rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(16,185,129,0.2)' }}>
                            <ShoppingCart size={18} /> เปิดการขาย (POS)
                        </button>
                        <button onClick={() => navigate('/inventory')} className="btn btn-emerald" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.75rem 1.25rem', borderRadius: '12px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981' }}>
                            <Plus size={18} /> เพิ่มงูใหม่
                        </button>
                        <button onClick={() => navigate('/expenses')} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.75rem 1.25rem', borderRadius: '12px', color: '#f8fafc' }}>
                            <Minus size={18} /> บันทึกรายจ่าย
                        </button>
                        <button
                            onClick={() => fetchDashboardData(false)}
                            className={`btn btn-icon ${refreshing ? 'loading' : ''}`}
                            style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            title="รีเฟรชข้อมูล"
                        >
                            <RefreshCw size={20} style={{ color: '#94a3b8' }} className={refreshing ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="stats-grid" style={{
                display: 'grid',
                gap: '1rem',
                marginBottom: '1.5rem',
            }}>
                <style>{`
                    .stats-grid { 
                        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); 
                    }
                    
                    .dashboard-grid { grid-template-columns: 2fr 1fr; }
                    @media (max-width: 1280px) { .dashboard-grid { grid-template-columns: 1fr; } }
                `}</style>
                {statCards.map((card, i) => (
                    <div key={i} className="card" style={{ background: gradients[card.color], border: `1px solid ${iconColors[card.color]}22`, padding: '1.1rem 1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
                            <card.icon size={20} style={{ color: iconColors[card.color] }} />
                            {card.growth !== undefined && (
                                <span style={{
                                    fontSize: '0.7rem',
                                    fontWeight: 600,
                                    color: card.growth >= 0 ? '#10b981' : '#ef4444',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '2px',
                                    background: card.growth >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                    padding: '2px 6px',
                                    borderRadius: '12px'
                                }}>
                                    {card.growth >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                                    {Math.abs(card.growth).toFixed(1)}%
                                </span>
                            )}
                        </div>
                        <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.2rem' }}>{card.title}</p>

                        {card.hasTarget ? (
                            <div style={{ marginBottom: '0.2rem' }}>
                                <p style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', margin: 0, marginBottom: '0.2rem' }}>{card.targetDisplay}</p>
                                <div style={{ background: 'rgba(255,255,255,0.1)', height: '4px', borderRadius: '4px', overflow: 'hidden', marginBottom: '0.25rem' }}>
                                    <div style={{ width: `${card.progress}%`, height: '100%', background: iconColors[card.color] }} />
                                </div>
                            </div>
                        ) : (
                            <p style={{ fontSize: '1.3rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                                {card.format === 'currency' ? formatCurrency(card.value, settings.currency_symbol) : card.value.toLocaleString()}{card.suffix || ''}
                            </p>
                        )}

                        <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.25rem' }}>{card.sub}</p>
                    </div>
                ))}
            </div>

            {/* 2-Column Grid */}
            <div className="dashboard-grid" style={{
                display: 'grid',
                gap: '1rem',
                marginBottom: '1rem'
            }}>
                {/* Left Column: Analytics */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="card" style={{ padding: '1.25rem' }}>
                        <h2 style={{ color: '#f8fafc', fontWeight: 600, fontSize: '0.95rem', margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <DollarSign size={16} style={{ color: '#10b981' }} /> รายได้ {chartDays} วันล่าสุด
                        </h2>
                        <SalesChart data={chartData} chartDays={chartDays} onChangeDays={handleChangeDays} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: '1rem' }}>
                        <div className="card" style={{ padding: '1.25rem' }}>
                            <h2 style={{ color: '#f8fafc', fontWeight: 600, fontSize: '0.95rem', margin: '0 0 0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                🏆 สินค้าขายดี
                            </h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                {topSelling.slice(0, 5).map((s, i) => (
                                    <div key={s.id || i} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                        <span style={{ fontSize: '0.8rem', color: '#475569', width: 20 }}>{i + 1}.</span>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: '0.8rem', color: '#f1f5f9', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name || 'Unknown'}</div>
                                            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 4, height: 4, marginTop: 3 }}>
                                                <div style={{ width: `${((s.totalSold || 0) / maxSold) * 100}%`, height: '100%', background: '#3b82f6', borderRadius: 4 }} />
                                            </div>
                                        </div>
                                        <span style={{ fontSize: '0.78rem', color: '#3b82f6', fontWeight: 600 }}>{s.totalSold || 0}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="card" style={{ padding: '1.25rem' }}>
                            <h2 style={{ color: '#f8fafc', fontWeight: 600, fontSize: '0.95rem', margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                📊 ยอดขายตามหมวดหมู่
                            </h2>
                            <PieChart data={stats?.categorySales} />
                        </div>
                    </div>

                    {/* Recent Orders (moved here for width) */}
                    <div className="card" style={{ padding: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h2 style={{ color: '#f8fafc', fontWeight: 600, fontSize: '0.95rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <ShoppingCart size={16} style={{ color: '#3b82f6' }} /> ออเดอร์ล่าสุด
                            </h2>
                            <button onClick={() => navigate('/orders')} className="btn btn-outline btn-xs" style={{ fontSize: '0.7rem' }}>ดูทั้งหมด</button>
                        </div>
                        {recentOrders.length === 0
                            ? <div style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>ยังไม่มีออเดอร์</div>
                            : (
                                <div className="table-container" style={{ overflowX: 'auto' }}>
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>ออเดอร์</th>
                                                <th>ลูกค้า</th>
                                                <th>งู</th>
                                                <th>ยอดรวม</th>
                                                <th>สถานะ</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recentOrders.slice(0, 5).map(o => (
                                                <tr key={o.id} onClick={() => navigate(`/orders/${o.id}`)} style={{ cursor: 'pointer' }}>
                                                    <td style={{ fontWeight: 600, color: '#10b981', fontSize: '0.8rem' }}>#{o.orderNo?.slice(-6) || o.id.slice(0, 6)}</td>
                                                    <td style={{ fontSize: '0.8rem', color: '#f8fafc' }}>
                                                        {o.customer?.name || (o.customerId ? 'ลูกค้าทั่วไป' : 'วอล์คอิน')}
                                                    </td>
                                                    <td style={{ maxWidth: '200px' }}>
                                                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.75rem' }}>
                                                            {o.items?.map(i => i.snake?.name).join(', ') || '-'}
                                                        </div>
                                                    </td>
                                                    <td style={{ fontWeight: 700, fontSize: '0.8rem' }}>{formatCurrency(o.total, settings.currency_symbol)}</td>
                                                    <td>
                                                        <span className={`badge ${o.status === 'completed' ? 'badge-success' : 'badge-gray'}`} style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                                                            {o.status === 'completed' ? 'สำเร็จ' : 'รอ'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )
                        }
                    </div>
                </div>

                {/* Right Column: Operations & Specialized Widgets */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="card" style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)' }}>
                        <h3 style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0 0 0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Clock size={14} style={{ color: '#10b981' }} /> การจัดการวันนี้
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>ให้อาหารแล้ว</span>
                                <span style={{ fontWeight: 600, color: '#10b981', fontSize: '0.85rem' }}>{stats?.dailyTasks?.fed || 0} ตัว</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>ลอกคราบแล้ว</span>
                                <span style={{ fontWeight: 600, color: '#f59e0b', fontSize: '0.85rem' }}>{stats?.dailyTasks?.shed || 0} ตัว</span>
                            </div>
                            <p style={{ fontSize: '0.65rem', color: '#475569', textAlign: 'right', marginTop: '0.25rem' }}>
                                ดูแลแล้ว {stats?.dailyTasks?.handledSnakes || 0} / {stats?.totalSnakes || 0} ตัว
                            </p>
                        </div>
                    </div>

                    {stats?.lowStock > 0 && (
                        <div className="card" style={{ padding: '1.25rem', border: '1px solid rgba(245,158,11,0.2)' }}>
                            <h2 style={{ color: '#f8fafc', fontWeight: 600, fontSize: '0.95rem', margin: '0 0 0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <AlertTriangle size={16} style={{ color: '#f59e0b' }} /> รายการสินค้าใกล้หมด
                            </h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                {stats?.lowStockList?.map(s => (
                                    <div key={s.id} onClick={() => navigate(`/snakes/${s.id}`)} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', borderRadius: '6px', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.1)' }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: '0.8rem', color: '#f8fafc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                                        </div>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '2px 8px', borderRadius: '10px' }}>
                                            เหลือ {s.stock}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => navigate('/inventory')} className="btn btn-outline btn-xs" style={{ width: '100%', marginTop: '0.75rem', fontSize: '0.7rem' }}>จัดการสต็อก</button>
                        </div>
                    )}

                    <div className="card" style={{ padding: '1.25rem' }}>
                        <h2 style={{ color: '#f8fafc', fontWeight: 600, fontSize: '0.95rem', margin: '0 0 0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Egg size={16} style={{ color: '#f59e0b' }} /> รายการรอฟัก (Incubation)
                        </h2>
                        {stats?.breedingSummary?.incubation?.length === 0 && <p style={{ color: '#64748b', fontSize: '0.8rem' }}>ไม่มีชุดไข่ที่กำลังฟัก</p>}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {stats?.breedingSummary?.incubation?.slice(0, 5).map(item => (
                                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem', borderRadius: '8px', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.1)' }}>
                                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Egg size={16} style={{ color: '#f59e0b' }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.8rem', color: '#f8fafc', fontWeight: 600 }}>{item.female || 'แม่พันธุ์'}</div>
                                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>ฟักแล้ว {item.daysIncubated} วัน</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f59e0b' }}>{Math.max(0, 60 - item.daysIncubated)}</div>
                                        <div style={{ fontSize: '0.6rem', color: '#64748b' }}>วัน</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="card" style={{ padding: '1.25rem' }}>
                        <h2 style={{ color: '#f8fafc', fontWeight: 600, fontSize: '0.95rem', margin: '0 0 0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <AlertTriangle size={16} style={{ color: '#ef4444' }} /> แจ้งเตือนสุขภาพงู
                        </h2>
                        {stats?.overdueFeeding?.length === 0 && <p style={{ color: '#10b981', fontSize: '0.8rem' }}>✅ สุขภาพดีเยี่ยม</p>}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            {stats?.overdueFeeding?.slice(0, 5).map(s => (
                                <div key={s.id} onClick={() => navigate(`/snakes/${s.id}`)} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', borderRadius: '6px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.1)' }}>
                                    <span style={{ fontSize: '0.8rem', color: '#fca5a5' }}>{s.name}</span>
                                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{Math.floor((new Date() - new Date(s.lastFed)) / (1000 * 60 * 60 * 24))} วัน</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="card" style={{ padding: '1.25rem' }}>
                        <h2 style={{ color: '#f8fafc', fontWeight: 600, fontSize: '0.95rem', margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Zap size={16} style={{ color: '#8b5cf6' }} /> สัดส่วนยีน (Morphs)
                        </h2>
                        <PieChart data={stats?.geneticStats} size={130} />
                    </div>
                </div>
            </div>
        </div>
    );
}
