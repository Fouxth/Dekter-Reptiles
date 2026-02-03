import { useState, useEffect } from 'react';
import {
    TrendingUp,
    Package,
    ShoppingCart,
    DollarSign,
    AlertTriangle,
    ArrowUpRight,
    ArrowDownRight,
    Clock,
    Activity
} from 'lucide-react';

export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const [recentOrders, setRecentOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [statsRes, ordersRes] = await Promise.all([
                fetch('/api/dashboard/stats'),
                fetch('/api/dashboard/recent-orders')
            ]);

            if (statsRes.ok && ordersRes.ok) {
                setStats(await statsRes.json());
                setRecentOrders(await ordersRes.json());
            }
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('th-TH', {
            style: 'currency',
            currency: 'THB'
        }).format(amount);
    };

    const statCards = [
        {
            title: 'ยอดขายวันนี้',
            value: stats?.todaySales || 0,
            format: 'currency',
            icon: DollarSign,
            color: 'emerald',
            change: '+12%',
            positive: true
        },
        {
            title: 'ออเดอร์วันนี้',
            value: stats?.todayOrderCount || 0,
            format: 'number',
            icon: ShoppingCart,
            color: 'blue',
            change: '+5',
            positive: true
        },
        {
            title: 'สินค้าทั้งหมด',
            value: stats?.totalSnakes || 0,
            format: 'number',
            icon: Package,
            color: 'violet',
            suffix: ' ตัว'
        },
        {
            title: 'สต็อกใกล้หมด',
            value: stats?.lowStock || 0,
            format: 'number',
            icon: AlertTriangle,
            color: 'amber',
            suffix: ' รายการ'
        }
    ];

    if (loading) {
        return (
            <div className="space-y-4 sm:space-y-6 p-1 sm:p-2">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="glass-card p-4 sm:p-6 h-28 sm:h-32 animate-pulse">
                            <div className="h-4 w-20 sm:w-24 bg-white/10 rounded mb-3 sm:mb-4"></div>
                            <div className="h-6 sm:h-8 w-24 sm:w-32 bg-white/10 rounded"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6 animate-fade-in p-1 sm:p-2">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:justify-between sm:items-center">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">แดชบอร์ด</h1>
                    <p className="text-slate-400 mt-1 flex items-center gap-2 text-sm sm:text-base">
                        <Activity size={14} className="text-emerald-400" />
                        ภาพรวมระบบ Snake POS วันนี้
                    </p>
                </div>
                <div className="px-3 sm:px-4 py-2 glass-card-light rounded-xl sm:rounded-2xl flex items-center gap-2 sm:gap-3 w-fit">
                    <div className="p-1.5 sm:p-2 bg-emerald-500/10 rounded-lg sm:rounded-xl">
                        <Clock size={16} className="text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-wider font-bold">Today</p>
                        <p className="text-xs sm:text-sm font-semibold text-white">
                            {new Date().toLocaleDateString('th-TH', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short'
                            })}
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {statCards.map((card, index) => {
                    const gradients = {
                        emerald: 'from-emerald-500/20 to-emerald-600/5 hover:from-emerald-500/30 hover:to-emerald-600/10 border-emerald-500/20',
                        blue: 'from-blue-500/20 to-blue-600/5 hover:from-blue-500/30 hover:to-blue-600/10 border-blue-500/20',
                        violet: 'from-violet-500/20 to-violet-600/5 hover:from-violet-500/30 hover:to-violet-600/10 border-violet-500/20',
                        amber: 'from-amber-500/20 to-amber-600/5 hover:from-amber-500/30 hover:to-amber-600/10 border-amber-500/20'
                    };

                    const iconColors = {
                        emerald: 'text-emerald-400 bg-emerald-500/10',
                        blue: 'text-blue-400 bg-blue-500/10',
                        violet: 'text-violet-400 bg-violet-500/10',
                        amber: 'text-amber-400 bg-amber-500/10'
                    };

                    return (
                        <div
                            key={index}
                            className={`glass-card p-3.5 sm:p-5 transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br ${gradients[card.color]} border group`}
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            <div className="flex justify-between items-start mb-2 sm:mb-4">
                                <div className={`w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center ${iconColors[card.color]} group-hover:scale-110 transition-transform duration-300`}>
                                    <card.icon size={18} className="sm:hidden" />
                                    <card.icon size={24} className="hidden sm:block" />
                                </div>
                                {card.change && (
                                    <div className={`hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] sm:text-xs font-medium ${card.positive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                        {card.positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                        {card.change}
                                    </div>
                                )}
                            </div>
                            <div>
                                <h3 className="text-slate-400 text-xs sm:text-sm font-medium mb-0.5 sm:mb-1 truncate">{card.title}</h3>
                                <p className="text-lg sm:text-2xl font-bold text-white tracking-tight">
                                    {card.format === 'currency'
                                        ? formatCurrency(card.value)
                                        : card.value.toLocaleString()}
                                    <span className="text-[10px] sm:text-sm font-normal text-slate-500 ml-0.5 sm:ml-1">{card.suffix}</span>
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Analytics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Revenue Summary */}
                <div className="lg:col-span-2 glass-card p-4 sm:p-6 border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-24 sm:p-32 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                    <h3 className="text-base sm:text-lg font-bold text-white mb-4 sm:mb-6 flex items-center gap-2">
                        <TrendingUp size={18} className="text-emerald-400" />
                        ภาพรวมรายได้
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                            <p className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-wider mb-1 sm:mb-2">ยอดขายสัปดาห์นี้</p>
                            <p className="text-lg sm:text-2xl font-bold text-white">{formatCurrency(stats?.weekSales || 0)}</p>
                        </div>
                        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                            <p className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-wider mb-1 sm:mb-2">ยอดขายเดือนนี้</p>
                            <p className="text-lg sm:text-2xl font-bold text-white">{formatCurrency(stats?.monthSales || 0)}</p>
                        </div>
                        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                            <p className="text-[10px] sm:text-xs text-emerald-400 uppercase tracking-wider mb-1 sm:mb-2">รายได้รวมทั้งหมด</p>
                            <p className="text-lg sm:text-2xl font-bold text-emerald-400">{formatCurrency(stats?.totalRevenue || 0)}</p>
                        </div>
                    </div>
                </div>

                {/* Quick Info */}
                <div className="glass-card p-4 sm:p-6 border-white/5 flex flex-col justify-center">
                    <div className="text-center relative">
                        <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto bg-gradient-to-tr from-emerald-500/20 to-blue-500/20 rounded-full flex items-center justify-center mb-3 sm:mb-4 ring-1 ring-white/10">
                            <div className="text-center">
                                <p className="text-2xl sm:text-3xl font-bold text-white">{stats?.totalOrders || 0}</p>
                                <p className="text-[9px] sm:text-xs text-slate-400 uppercase tracking-wide mt-0.5 sm:mt-1">ออเดอร์ทั้งหมด</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-white/5">
                                <span className="text-xs sm:text-sm text-slate-400">สต็อกคงเหลือ</span>
                                <span className="text-xs sm:text-sm font-bold text-white">{stats?.totalStock || 0} ตัว</span>
                            </div>
                            <div className="flex justify-between items-center p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-white/5">
                                <span className="text-xs sm:text-sm text-slate-400">สินค้าขายดี</span>
                                <span className="text-xs sm:text-sm font-bold text-emerald-400">Corn Snake</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Orders */}
            <div className="glass-card p-4 sm:p-6 border-white/5">
                <div className="flex justify-between items-center mb-4 sm:mb-6">
                    <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                        <ShoppingCart size={18} className="text-blue-400" />
                        ออเดอร์ล่าสุด
                    </h3>
                    <a href="/orders" className="text-xs sm:text-sm font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors">
                        ดูทั้งหมด <ArrowUpRight size={14} />
                    </a>
                </div>

                {recentOrders.length === 0 ? (
                    <div className="text-center py-10 sm:py-12 bg-white/5 rounded-xl sm:rounded-2xl border border-dashed border-white/10">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                            <ShoppingCart size={20} className="text-slate-500" />
                        </div>
                        <p className="text-slate-400 text-sm">ยังไม่มีรายการสั่งซื้อเข้ามา</p>
                    </div>
                ) : (
                    <>
                        {/* Mobile Card View */}
                        <div className="sm:hidden space-y-3">
                            {recentOrders.slice(0, 5).map((order) => (
                                <div key={order.id} className="bg-white/5 rounded-xl p-3 border border-white/5">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-mono text-emerald-400 text-sm font-medium">#{order.orderNo?.slice(-8) || order.id}</span>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${order.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                                            order.status === 'pending' ? 'bg-amber-500/10 text-amber-400' :
                                                'bg-red-500/10 text-red-400'
                                            }`}>
                                            {order.status === 'completed' ? 'สำเร็จ' :
                                                order.status === 'pending' ? 'รอดำเนินการ' : 'ยกเลิก'}
                                        </span>
                                    </div>
                                    <p className="text-slate-300 text-xs line-clamp-1 mb-2">
                                        {order.items?.map(item => item.snake?.name).join(', ') || '-'}
                                    </p>
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-white text-sm">{formatCurrency(order.total)}</span>
                                        <span className="text-slate-500 text-xs">
                                            {new Date(order.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden sm:block overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className="text-left py-3 sm:py-4 px-3 sm:px-4 text-slate-400 font-semibold text-xs uppercase tracking-wider">Order ID</th>
                                        <th className="text-left py-3 sm:py-4 px-3 sm:px-4 text-slate-400 font-semibold text-xs uppercase tracking-wider">Items</th>
                                        <th className="text-left py-3 sm:py-4 px-3 sm:px-4 text-slate-400 font-semibold text-xs uppercase tracking-wider">Total</th>
                                        <th className="text-left py-3 sm:py-4 px-3 sm:px-4 text-slate-400 font-semibold text-xs uppercase tracking-wider">Status</th>
                                        <th className="text-left py-3 sm:py-4 px-3 sm:px-4 text-slate-400 font-semibold text-xs uppercase tracking-wider">Time</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {recentOrders.slice(0, 5).map((order) => (
                                        <tr key={order.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="py-3 sm:py-4 px-3 sm:px-4">
                                                <span className="font-mono text-emerald-400 text-sm group-hover:text-emerald-300">#{order.orderNo?.slice(-8) || order.id}</span>
                                            </td>
                                            <td className="py-3 sm:py-4 px-3 sm:px-4">
                                                <div className="flex items-center gap-2 sm:gap-3">
                                                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded bg-slate-700/50 flex items-center justify-center text-[10px] sm:text-xs text-slate-400">
                                                        {order.items?.length || 0}
                                                    </div>
                                                    <span className="text-slate-300 text-xs sm:text-sm line-clamp-1 max-w-[120px] sm:max-w-none">
                                                        {order.items?.map(item => item.snake?.name).join(', ') || '-'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-3 sm:py-4 px-3 sm:px-4">
                                                <span className="font-bold text-white text-xs sm:text-sm">
                                                    {formatCurrency(order.total)}
                                                </span>
                                            </td>
                                            <td className="py-3 sm:py-4 px-3 sm:px-4">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${order.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                                                    order.status === 'pending' ? 'bg-amber-500/10 text-amber-400' :
                                                        'bg-red-500/10 text-red-400'
                                                    }`}>
                                                    {order.status === 'completed' ? 'สำเร็จ' :
                                                        order.status === 'pending' ? 'รอดำเนินการ' : 'ยกเลิก'}
                                                </span>
                                            </td>
                                            <td className="py-3 sm:py-4 px-3 sm:px-4 text-slate-400 text-xs sm:text-sm">
                                                {new Date(order.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
