import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    Search,
    Receipt,
    Eye,
    X,
    Calendar,
    Filter,
    CheckCircle,
    Clock,
    XCircle
} from 'lucide-react';

export default function Orders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const response = await fetch('/api/orders');
            if (response.ok) {
                setOrders(await response.json());
            }
        } catch (error) {
            console.error('Failed to fetch orders:', error);
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

    const formatDate = (date) => {
        return new Date(date).toLocaleString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDateShort = (date) => {
        return new Date(date).toLocaleString('th-TH', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch = order.orderNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.items?.some(item => item.snake?.name.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesStatus = !statusFilter || order.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusConfig = (status) => {
        const configs = {
            completed: { label: 'สำเร็จ', icon: CheckCircle, class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
            pending: { label: 'รอดำเนินการ', icon: Clock, class: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
            cancelled: { label: 'ยกเลิก', icon: XCircle, class: 'bg-red-500/10 text-red-400 border-red-500/20' }
        };
        return configs[status] || configs.pending;
    };

    const getPaymentLabel = (method) => {
        const labels = {
            cash: 'เงินสด',
            transfer: 'โอนเงิน',
            card: 'บัตรเครดิต'
        };
        return labels[method] || method;
    };

    // Calculate summary stats
    const totalRevenue = orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.total, 0);
    const completedOrders = orders.filter(o => o.status === 'completed').length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;

    return (
        <div className="space-y-4 sm:space-y-6 animate-fade-in p-1 sm:p-2">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">ประวัติการขาย</h1>
                    <p className="text-slate-400 mt-1 flex items-center gap-2 text-sm sm:text-base">
                        <Receipt size={14} className="text-emerald-400" />
                        รายการออเดอร์ทั้งหมด {orders.length} รายการ
                    </p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="glass-card p-4 sm:p-5 flex items-center gap-3 sm:gap-4 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-12 sm:p-16 bg-emerald-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 transition-transform group-hover:scale-150 duration-700" />
                    <div className="p-2.5 sm:p-3 bg-emerald-500/10 rounded-lg sm:rounded-xl">
                        <Receipt size={20} className="text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-[10px] sm:text-xs uppercase tracking-wider font-semibold mb-0.5 sm:mb-1">รายได้รวม</p>
                        <p className="text-xl sm:text-2xl font-bold text-white tracking-tight">{formatCurrency(totalRevenue)}</p>
                    </div>
                </div>
                <div className="glass-card p-4 sm:p-5 flex items-center gap-3 sm:gap-4 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-12 sm:p-16 bg-blue-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 transition-transform group-hover:scale-150 duration-700" />
                    <div className="p-2.5 sm:p-3 bg-blue-500/10 rounded-lg sm:rounded-xl">
                        <CheckCircle size={20} className="text-blue-400" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-[10px] sm:text-xs uppercase tracking-wider font-semibold mb-0.5 sm:mb-1">ออเดอร์สำเร็จ</p>
                        <p className="text-xl sm:text-2xl font-bold text-white tracking-tight">{completedOrders} รายการ</p>
                    </div>
                </div>
                <div className="glass-card p-4 sm:p-5 flex items-center gap-3 sm:gap-4 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-12 sm:p-16 bg-amber-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 transition-transform group-hover:scale-150 duration-700" />
                    <div className="p-2.5 sm:p-3 bg-amber-500/10 rounded-lg sm:rounded-xl">
                        <Clock size={20} className="text-amber-400" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-[10px] sm:text-xs uppercase tracking-wider font-semibold mb-0.5 sm:mb-1">รอดำเนินการ</p>
                        <p className="text-xl sm:text-2xl font-bold text-white tracking-tight">{pendingOrders} รายการ</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="glass-card p-3 sm:p-4 flex flex-col gap-3 sm:flex-row sm:gap-4 sm:justify-between sm:items-center">
                <div className="relative w-full sm:w-96 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-emerald-400 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="ค้นหาเลขที่ออเดอร์, สินค้า..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input-field pl-icon bg-slate-900/50 border-white/10 focus:border-emerald-500/50"
                    />
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-none">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="input-field pl-icon w-full sm:w-48 bg-slate-900/50 border-white/10 appearance-none cursor-pointer hover:border-emerald-500/30 transition-colors"
                        >
                            <option value="">ทุกสถานะ</option>
                            <option value="completed">สำเร็จ</option>
                            <option value="pending">รอดำเนินการ</option>
                            <option value="cancelled">ยกเลิก</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Orders - Mobile Card View */}
            <div className="sm:hidden space-y-3">
                {loading ? (
                    [...Array(4)].map((_, i) => (
                        <div key={i} className="glass-card p-4 animate-pulse">
                            <div className="flex justify-between mb-3">
                                <div className="h-4 w-24 bg-white/10 rounded"></div>
                                <div className="h-4 w-16 bg-white/10 rounded"></div>
                            </div>
                            <div className="h-3 w-3/4 bg-white/10 rounded mb-2"></div>
                            <div className="h-5 w-1/2 bg-white/10 rounded"></div>
                        </div>
                    ))
                ) : filteredOrders.length === 0 ? (
                    <div className="glass-card p-8 text-center">
                        <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-4">
                            <Receipt size={28} className="text-slate-500" />
                        </div>
                        <p className="text-slate-400 font-medium">ไม่พบรายการออเดอร์</p>
                        <p className="text-slate-500 text-sm mt-1">ลองเปลี่ยนเงื่อนไขการค้นหา</p>
                    </div>
                ) : (
                    filteredOrders.map((order) => {
                        const statusConfig = getStatusConfig(order.status);
                        const StatusIcon = statusConfig.icon;

                        return (
                            <div
                                key={order.id}
                                className="glass-card p-3 border border-white/5 hover:border-white/10 transition-colors cursor-pointer active:scale-[0.99]"
                                onClick={() => setSelectedOrder(order)}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-mono text-emerald-400 text-sm font-medium">
                                        #{order.orderNo?.slice(-8) || order.id}
                                    </span>
                                    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${statusConfig.class}`}>
                                        <StatusIcon size={10} />
                                        {statusConfig.label}
                                    </div>
                                </div>

                                <p className="text-slate-300 text-xs line-clamp-1 mb-2">
                                    {order.items?.map(item => item.snake?.name || 'สินค้า').join(', ')}
                                </p>

                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-white text-sm">{formatCurrency(order.total)}</span>
                                    <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                                        <Calendar size={12} />
                                        {formatDateShort(order.createdAt)}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                                    <span className="text-xs text-slate-500">{getPaymentLabel(order.paymentMethod)}</span>
                                    <span className="text-xs text-slate-500">{order.items?.length || 0} รายการ</span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Orders Table - Desktop */}
            <div className="hidden sm:block glass-card overflow-hidden border border-white/5 bg-slate-900/40">
                {loading ? (
                    <div className="p-8 space-y-4">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="flex gap-4 animate-pulse">
                                <div className="h-4 w-24 bg-white/5 rounded"></div>
                                <div className="h-4 flex-1 bg-white/5 rounded"></div>
                                <div className="h-4 w-20 bg-white/5 rounded"></div>
                            </div>
                        ))}
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                        <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mb-4 ring-1 ring-white/10">
                            <Receipt size={32} className="opacity-50" />
                        </div>
                        <p className="text-lg font-medium">ไม่พบรายการออเดอร์</p>
                        <p className="text-sm opacity-60 mt-1">ลองเปลี่ยนเงื่อนไขการค้นหา</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10 bg-white/[0.02]">
                                    <th className="text-left py-4 px-4 lg:px-6 text-slate-400 font-semibold text-xs uppercase tracking-wider">Order ID</th>
                                    <th className="text-left py-4 px-4 lg:px-6 text-slate-400 font-semibold text-xs uppercase tracking-wider">รายการสินค้า</th>
                                    <th className="text-left py-4 px-4 lg:px-6 text-slate-400 font-semibold text-xs uppercase tracking-wider">ยอดรวม</th>
                                    <th className="text-left py-4 px-4 lg:px-6 text-slate-400 font-semibold text-xs uppercase tracking-wider hidden lg:table-cell">ชำระเงิน</th>
                                    <th className="text-left py-4 px-4 lg:px-6 text-slate-400 font-semibold text-xs uppercase tracking-wider">สถานะ</th>
                                    <th className="text-left py-4 px-4 lg:px-6 text-slate-400 font-semibold text-xs uppercase tracking-wider hidden xl:table-cell">วันที่</th>
                                    <th className="text-right py-4 px-4 lg:px-6 text-slate-400 font-semibold text-xs uppercase tracking-wider">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredOrders.map((order, index) => {
                                    const statusConfig = getStatusConfig(order.status);
                                    const StatusIcon = statusConfig.icon;

                                    return (
                                        <tr
                                            key={order.id}
                                            className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
                                            onClick={() => setSelectedOrder(order)}
                                            style={{ animationDelay: `${index * 0.05}s` }}
                                        >
                                            <td className="py-4 px-4 lg:px-6">
                                                <span className="font-mono text-emerald-400 font-medium group-hover:text-emerald-300 text-sm">
                                                    #{order.orderNo?.slice(-8) || order.id}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 lg:px-6">
                                                <div className="flex flex-col">
                                                    <span className="text-white text-sm font-medium line-clamp-1 max-w-[150px] lg:max-w-none">
                                                        {order.items?.map(item => item.snake?.name || 'สินค้า').join(', ')}
                                                    </span>
                                                    <span className="text-xs text-slate-500 mt-0.5">
                                                        {order.items?.length || 0} รายการ
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 lg:px-6 text-white font-bold text-sm">
                                                {formatCurrency(order.total)}
                                            </td>
                                            <td className="py-4 px-4 lg:px-6 text-slate-400 text-sm hidden lg:table-cell">
                                                {getPaymentLabel(order.paymentMethod)}
                                            </td>
                                            <td className="py-4 px-4 lg:px-6">
                                                <div className={`inline-flex items-center gap-1.5 px-2 lg:px-2.5 py-1 rounded-full text-[10px] lg:text-xs font-medium border ${statusConfig.class}`}>
                                                    <StatusIcon size={12} />
                                                    {statusConfig.label}
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 lg:px-6 text-slate-400 text-xs hidden xl:table-cell">
                                                <div className="flex items-center gap-2">
                                                    <Calendar size={14} />
                                                    {formatDate(order.createdAt)}
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 lg:px-6 text-right">
                                                <button className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 hover:bg-emerald-500 hover:text-white transition-all ml-auto group-hover:bg-white/10">
                                                    <Eye size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Order Detail Modal */}
            {selectedOrder && createPortal(
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-3 sm:p-4">
                    <div className="bg-black/80 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl border border-white/10 scale-100 animate-slide-in max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-white/5 bg-white/[0.02] shrink-0">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="p-1.5 sm:p-2 bg-emerald-500/10 rounded-lg">
                                    <Receipt size={18} className="text-emerald-400" />
                                </div>
                                <div>
                                    <h2 className="text-base sm:text-lg font-bold text-white">รายละเอียดออเดอร์</h2>
                                    <p className="text-[10px] sm:text-xs font-mono text-slate-400 mt-0.5">#{selectedOrder.orderNo?.slice(-8) || selectedOrder.id}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-4 sm:p-6 bg-slate-900/40 overflow-y-auto flex-1">
                            {/* Summary Grid */}
                            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                                <div className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-white/5 border border-white/5">
                                    <span className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-wide">สถานะ : </span>
                                    <div className={`mt-1 inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium ${selectedOrder.status === 'completed' ? 'text-emerald-400' :
                                        selectedOrder.status === 'pending' ? 'text-amber-400' : 'text-red-400'
                                        }`}>
                                        {getStatusConfig(selectedOrder.status).label}
                                    </div>
                                </div>
                                <div className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-white/5 border border-white/5">
                                    <span className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-wide">การชำระเงิน : </span>
                                    <div className={`mt-1 inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium ${selectedOrder.status === 'completed' ? 'text-emerald-400' :
                                        selectedOrder.status === 'pending' ? 'text-amber-400' : 'text-red-400'
                                        }`}>
                                        {getPaymentLabel(selectedOrder.paymentMethod)}
                                    </div>
                                </div>
                            </div>

                            {/* Order Items */}
                            <div className="mb-4 sm:mb-6">
                                <h3 className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 sm:mb-3 pl-1">รายการสินค้า</h3>
                                <div className="space-y-2 bg-slate-900/50 rounded-xl p-2 border border-white/5 max-h-48 sm:max-h-64 overflow-y-auto custom-scrollbar">
                                    {selectedOrder.items?.map((item, index) => (
                                        <div key={index} className="flex justify-between items-center p-2 rounded-lg hover:bg-white/5 transition-colors">
                                            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-slate-800 flex items-center justify-center text-sm sm:text-lg border border-white/5 flex-shrink-0">
                                                    🐍
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-white text-xs sm:text-sm font-medium truncate">{item.snake?.name || 'สินค้า'}</p>
                                                    <p className="text-slate-400 text-[10px] sm:text-xs">{formatCurrency(item.price)} x {item.quantity}</p>
                                                </div>
                                            </div>
                                            <span className="font-semibold text-white text-xs sm:text-sm flex-shrink-0 ml-2">
                                                {formatCurrency(item.price * item.quantity)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Total Footer */}
                            <div className="bg-emerald-500/10 rounded-xl p-3 sm:p-4 border border-emerald-500/20 flex justify-between items-center">
                                <span className="text-slate-300 font-medium text-sm">ยอดรวมทั้งสิ้น</span>
                                <span className="font-bold text-xl sm:text-2xl text-emerald-400">{formatCurrency(selectedOrder.total)}</span>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
