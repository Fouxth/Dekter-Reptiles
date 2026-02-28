import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Package, LogOut, Mail, Phone, MapPin, Clock, ChevronRight, Loader2, ShoppingBag, Truck, AlertCircle, FileSearch, CheckCircle2 } from 'lucide-react';
import { getCustomerOrders } from '../services/api';
import { useCustomerAuth } from '../contexts/CustomerAuthContext';
import SEO from '../components/SEO';

const Profile = () => {
    const { customer, logout, loading: authLoading } = useCustomerAuth();
    const [orders, setOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (!authLoading && !customer) {
            navigate('/login');
            return;
        }

        const fetchOrders = async () => {
            if (customer) {
                try {
                    const data = await getCustomerOrders();
                    setOrders(data);
                } catch (error) {
                    console.error("Error fetching orders:", error);
                } finally {
                    setLoadingOrders(false);
                }
            }
        };

        fetchOrders();
    }, [customer, authLoading, navigate]);

    if (authLoading || (customer && loadingOrders)) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center">
                <Loader2 className="animate-spin text-sky-500 mb-4" size={48} />
                <h3 className="text-xl font-bold text-stone-200">กำลังโหลดข้อมูลส่วนตัว...</h3>
            </div>
        );
    }

    if (!customer) return null;

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 }).format(price);
    };

    const getStatusConfig = (status) => {
        switch (status) {
            case 'completed': return { label: 'สำเร็จ', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10', icon: CheckCircle2 };
            case 'pending_payment': return { label: 'รอชำระเงิน', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10', icon: Clock };
            case 'awaiting_verification': return { label: 'รอตรวจสอบ', color: 'text-sky-400 border-sky-500/30 bg-sky-500/10', icon: FileSearch };
            case 'processing': return { label: 'กำลังเตรียมของ', color: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10', icon: Package };
            case 'shipping': return { label: 'กำลังจัดส่ง', color: 'text-purple-400 border-purple-500/30 bg-purple-500/10', icon: Truck };
            case 'cancelled': return { label: 'ยกเลิก', color: 'text-red-400 border-red-500/30 bg-red-500/10', icon: LogOut };
            case 'rejected': return { label: 'สลิปไม่ถูกต้อง', color: 'text-rose-400 border-rose-500/30 bg-rose-500/10', icon: AlertCircle };
            default: return { label: status, color: 'text-stone-400 border-stone-500/30 bg-stone-500/10', icon: Clock };
        }
    };

    return (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">
            <SEO title="โปรไฟล์ของฉัน" description="จัดการข้อมูลส่วนตัวและดูประวัติการสั่งซื้อของคุณที่ Dexter Reptiles" noindex={true} />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
                <div>
                    <div className="text-sky-500 font-bold tracking-widest uppercase text-sm mb-2">Customer Profile</div>
                    <h1 className="text-4xl font-light text-stone-100 italic">สวัสดีคุณ, <span className="font-bold text-sky-400 not-italic">{customer.name}</span></h1>
                </div>
                <button
                    onClick={() => { logout(); navigate('/'); }}
                    className="flex items-center gap-2 bg-stone-900/50 hover:bg-red-500/10 hover:text-red-400 text-stone-400 border border-white/5 hover:border-red-500/30 px-6 py-3 rounded-2xl transition-all duration-300 font-bold uppercase tracking-widest text-xs"
                >
                    <LogOut size={16} /> ออกจากระบบ
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Info Sidebar */}
                <div className="space-y-6">
                    <section className="glass-dark p-8 rounded-[2rem] border border-white/10 shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-sky-500/10 transition-colors"></div>
                        <h3 className="text-xl font-bold text-stone-100 mb-8 flex items-center gap-3">
                            <span className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-500"><User size={20} /></span>
                            ข้อมูลส่วนตัว
                        </h3>

                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="p-2 rounded-lg bg-white/5 text-stone-500 mt-0.5"><Mail size={16} /></div>
                                <div>
                                    <span className="block text-[0.65rem] uppercase tracking-widest text-stone-500 mb-0.5">อีเมล</span>
                                    <span className="text-stone-200 font-medium">{customer.email}</span>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="p-2 rounded-lg bg-white/5 text-stone-500 mt-0.5"><Phone size={16} /></div>
                                <div>
                                    <span className="block text-[0.65rem] uppercase tracking-widest text-stone-500 mb-0.5">เบอร์โทรศัพท์</span>
                                    <span className="text-stone-200 font-medium">{customer.phone || 'ไม่ระบุ'}</span>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="p-2 rounded-lg bg-white/5 text-stone-500 mt-0.5 font-bold text-[10px] flex items-center justify-center w-8 h-8">L</div>
                                <div>
                                    <span className="block text-[0.65rem] uppercase tracking-widest text-stone-500 mb-0.5">Line ID</span>
                                    <span className="text-stone-200 font-medium">{customer.lineId || 'ไม่ระบุ'}</span>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="p-2 rounded-lg bg-white/5 text-stone-500 mt-1"><MapPin size={16} /></div>
                                <div>
                                    <span className="block text-[0.65rem] uppercase tracking-widest text-stone-500 mb-0.5">ที่อยู่จัดส่ง</span>
                                    <span className="text-stone-300 text-sm leading-relaxed">{customer.address || 'ยังไม่ได้ระบุที่อยู่'}</span>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Orders Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    <section className="glass-dark p-8 rounded-[2rem] border border-white/10 shadow-xl min-h-[400px]">
                        <h3 className="text-xl font-bold text-stone-100 mb-8 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-500"><Package size={20} /></span>
                                ประวัติการสั่งซื้อ
                            </div>
                            <span className="text-xs font-normal text-stone-500 uppercase tracking-widest">{orders.length} รายการ</span>
                        </h3>

                        {orders.length > 0 ? (
                            <div className="space-y-6">
                                {orders.map(order => (
                                    <div key={order.id} className="group glass bg-stone-900/40 p-6 rounded-3xl border border-white/5 hover:border-sky-500/30 transition-all duration-300">
                                        <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-stone-400 group-hover:bg-sky-500/10 group-hover:text-sky-500 transition-colors">
                                                    <ShoppingBag size={24} />
                                                </div>
                                                <div>
                                                    <div className="text-stone-200 font-bold text-md flex flex-wrap items-center gap-2">
                                                        #{order.orderNo?.slice(-8) || order.id}
                                                        {(() => {
                                                            const config = getStatusConfig(order.status);
                                                            const StatusIcon = config.icon;
                                                            return (
                                                                <span className={`text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full border font-bold flex items-center gap-1.5 ${config.color}`}>
                                                                    <StatusIcon size={12} /> {config.label}
                                                                </span>
                                                            );
                                                        })()}
                                                    </div>
                                                    <div className="text-stone-500 text-xs mt-1 flex items-center gap-1.5 font-medium">
                                                        <Clock size={12} /> {formatDate(order.createdAt)}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right flex flex-col justify-center">
                                                <div className="text-[10px] text-stone-500 uppercase tracking-widest mb-1">ยอดรวมสุทธิ</div>
                                                <div className="text-xl font-bold text-sky-400 tracking-tight">{formatPrice(order.total)}</div>
                                            </div>
                                        </div>

                                        {/* Tracking Section */}
                                        {order.trackingNo && (
                                            <div className="mb-4 bg-sky-500/5 border border-sky-500/10 rounded-2xl p-4 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-sky-500/10 rounded-xl text-sky-400">
                                                        <Truck size={18} />
                                                    </div>
                                                    <div>
                                                        <span className="block text-[8px] uppercase tracking-[0.2em] font-bold text-sky-500/50">Tracking Number</span>
                                                        <span className="text-stone-200 font-mono font-bold tracking-wider">{order.trackingNo}</span>
                                                    </div>
                                                </div>
                                                <button className="text-[10px] font-bold text-sky-400 border border-sky-500/30 px-3 py-1.5 rounded-lg hover:bg-sky-500 hover:text-stone-950 transition-all uppercase tracking-widest">
                                                    คัดลอก
                                                </button>
                                            </div>
                                        )}

                                        {/* Rejected Message */}
                                        {order.status === 'rejected' && (
                                            <div className="mb-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl p-4 flex items-center gap-3 text-rose-400">
                                                <AlertCircle size={18} />
                                                <div className="text-xs">
                                                    <span className="font-bold block">การตรวจสอบสลิปล้มเหลว</span>
                                                    <span className="opacity-70">กรุณาตรวจสอบความถูกต้องของสลิปและติดต่อแอดมิน หรือสั่งซื้อใหม่อีกครั้ง</span>
                                                </div>
                                            </div>
                                        )}

                                        <div className="bg-stone-950/30 rounded-2xl p-4 border border-white/5">
                                            <div className="flex flex-wrap gap-3">
                                                {order.items.map(item => {
                                                    const API = import.meta.env.VITE_API_URL;
                                                    const BASE_URL = API.replace('/api', '');
                                                    const imageUrl = item.snake?.customerImage
                                                        ? (item.snake.customerImage.startsWith('http') ? item.snake.customerImage : `${BASE_URL}${item.snake.customerImage}`)
                                                        : (item.snake?.adminImage ? (item.snake.adminImage.startsWith('http') ? item.snake.adminImage : `${BASE_URL}${item.snake.adminImage}`) : null);

                                                    return (
                                                        <div key={item.id} className="flex items-center gap-3 bg-stone-900/50 pr-4 rounded-xl border border-white/5 group/item">
                                                            {imageUrl ? (
                                                                <img src={imageUrl} alt={item.snake?.name} className="w-12 h-12 object-cover rounded-l-xl opacity-80 group-hover/item:opacity-100 transition-opacity" />
                                                            ) : (
                                                                <div className="w-12 h-12 bg-white/5 flex items-center justify-center rounded-l-xl"><Package size={16} /></div>
                                                            )}
                                                            <div className="text-xs">
                                                                <div className="font-bold text-stone-200">{item.snake?.name || 'สินค้า'}</div>
                                                                <div className="text-stone-500">{item.quantity} x {formatPrice(item.price)}</div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="w-20 h-20 bg-stone-900 rounded-full flex items-center justify-center mb-6 border border-white/5 opacity-50">
                                    <ShoppingBag className="text-stone-500" size={32} />
                                </div>
                                <h4 className="text-xl font-bold text-stone-300 mb-2">ยังไม่มีประวัติการสั่งซื้อ</h4>
                                <p className="text-stone-500 mb-8 max-w-xs">เริ่มเลือกช้อปงูตัวโปรดของคุณ และคำสั่งซื้อจะปรากฏที่นี่</p>
                                <button
                                    onClick={() => navigate('/shop')}
                                    className="px-8 py-3 bg-sky-500/10 text-sky-400 border border-sky-500/30 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-sky-500 hover:text-stone-950 transition-all shadow-[0_0_15px_rgba(14,165,233,0.1)] hover:shadow-[0_0_20px_rgba(14,165,233,0.3)]"
                                >
                                    ไปที่ร้านค้า
                                </button>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </main>
    );
};

export default Profile;
