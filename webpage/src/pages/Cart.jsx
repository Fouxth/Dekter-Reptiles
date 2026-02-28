import React, { useState, useEffect } from 'react';
import { ShoppingCart, Trash2, CheckCircle2, Loader2, User, Phone, FileText, ArrowRight, MapPin, Clock } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useCustomerAuth } from '../contexts/CustomerAuthContext';
import SEO from '../components/SEO';
import { getSystemSettings, createOrder } from '../services/api';
import generatePayload from 'promptpay-qr';
import { QRCodeSVG } from 'qrcode.react';
import BankBadge from '../components/BankBadge';

const formatPrice = (price) => {
    return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 }).format(price);
};



const Cart = ({ cart, setCart, updateQuantity, removeFromCart, cartTotal, cartItemCount }) => {
    const navigate = useNavigate();
    const { customer } = useCustomerAuth();
    const [formData, setFormData] = useState({
        name: customer?.name || '',
        phone: customer?.phone || '',
        lineId: customer?.lineId || '',
        address: customer?.address || '',
        note: ''
    });
    const [paymentMethod, setPaymentMethod] = useState('transfer'); // default to transfer
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [timeLeft, setTimeLeft] = useState(null);
    const [isExpired, setIsExpired] = useState(false);
    const [settings, setSettings] = useState({
        payment_enabled: true,
        accept_cash: true,
        accept_transfer: true,
        promptpay_enabled: true,
        bank_name: '',
        qr_expiry_minutes: 15,
        enable_vat: false,
        tax_rate: 7,
        shipping_fee: 0,
        free_shipping_min: 1000
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await getSystemSettings();
                const getBool = (key, fallback) => {
                    const s = data.find(item => item.key === key);
                    return s ? s.value === 'true' : fallback;
                };
                const getText = (key, fallback) => {
                    const s = data.find(item => item.key === key);
                    return s ? s.value : fallback;
                };

                const s = {
                    payment_enabled: getBool('payment_enabled', true),
                    accept_cash: getBool('accept_cash', true),
                    accept_transfer: getBool('accept_transfer', true),
                    promptpay_enabled: getBool('promptpay_enabled', true),
                    bank_name: getText('bank_name', 'กสิกรไทย (K-Bank)'),
                    bank_account_name: getText('bank_account_name', ''),
                    bank_account_number: getText('bank_account_number', ''),
                    promptpay_id: getText('promptpay_id', ''),
                    qr_expiry_minutes: parseInt(getText('qr_expiry_minutes', '15')),
                    enable_vat: getBool('enable_vat', false),
                    tax_rate: parseFloat(getText('tax_rate', '7')) || 7,
                    shipping_fee: parseFloat(getText('shipping_fee', '0')) || 0,
                    free_shipping_min: parseFloat(getText('free_shipping_min', '1000')) || 1000
                };

                setSettings(s);

                // Default payment method if transfer is disabled
                if (!s.accept_transfer && paymentMethod === 'transfer') {
                    if (s.promptpay_enabled) setPaymentMethod('qr');
                    else if (s.accept_cash) setPaymentMethod('cash');
                }
            } catch (err) {
                console.error("Failed to fetch settings:", err);
            }
        };
        fetchSettings();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Reset timer when switching to QR or when total changes
    useEffect(() => {
        if (paymentMethod === 'qr' && settings.promptpay_id) {
            setTimeLeft(settings.qr_expiry_minutes * 60);
            setIsExpired(false);
        } else {
            setTimeLeft(null);
            setIsExpired(false);
        }
    }, [paymentMethod, cartTotal, settings.promptpay_id, settings.qr_expiry_minutes]);

    // Timer countdown logic
    useEffect(() => {
        if (timeLeft === null || timeLeft <= 0) {
            if (timeLeft === 0) setIsExpired(true);
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setIsExpired(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft]);

    const formatTimeLeft = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };
    React.useEffect(() => {
        if (customer) {
            setFormData(prev => ({
                ...prev,
                name: prev.name || customer.name || '',
                phone: prev.phone || customer.phone || '',
                lineId: prev.lineId || customer.lineId || '',
                address: prev.address || customer.address || ''
            }));
        }
    }, [customer]);

    const handleCheckout = async () => {
        if (!formData.name.trim() || !formData.phone.trim() || !formData.address.trim()) {
            setError('กรุณากรอกชื่อ เบอร์โทรศัพท์ และที่อยู่สำหรับจัดส่ง');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const orderData = {
                items: cart.map(item => ({ snakeId: Number(item.id), quantity: item.quantity })),
                paymentMethod: paymentMethod, // use state value
                customerId: customer?.id || undefined,
                shippingAddress: formData.address,
                note: `[สั่งซื้อจากหน้าเว็บ] ${customer ? '(สมาชิก)' : '(Guest)'}\nชื่อ: ${formData.name}\nเบอร์โทร: ${formData.phone}\nLine: ${formData.lineId}\n${formData.note ? `เพิ่มเติม: ${formData.note}` : ''}`
            };

            const result = await createOrder(orderData);
            setCart([]);
            navigate('/checkout-success', {
                state: {
                    orderNo: result.orderNo,
                    total: result.total,
                    orderId: result.id,
                    slipUploadToken: result.slipUploadToken,
                    paymentMethod,
                    createdAt: result.createdAt // Pass timestamp for QR expiry
                }
            });
        } catch (err) {
            console.error("Checkout failed:", err);
            setError("เกิดข้อผิดพลาดในการสั่งซื้อ ลองใหม่อีกครั้งหรือติดต่อแอดมิน");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in min-h-[70vh]">
            <SEO title="ตะกร้าสินค้า" description="ตรวจสอบรายการสั่งซื้องูและสัตว์เลื้อยคลานของคุณ" noindex={true} />

            <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-xl bg-sky-500/10 flex items-center justify-center border border-sky-500/20">
                    <ShoppingCart className="text-sky-400" size={18} />
                </div>
                <div>
                    <div className="text-sky-500 font-bold tracking-[0.2em] uppercase text-[0.5rem] opacity-80">Shopping</div>
                    <h1 className="text-xl font-light text-stone-100">ตะกร้า<span className="font-bold text-sky-400">สินค้า</span></h1>
                </div>
            </div>

            {cart.length === 0 ? (
                <div className="glass-premium rounded-2xl p-14 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-sky-500/10 via-transparent to-transparent opacity-50"></div>
                    <div className="relative z-10">
                        <div className="w-20 h-20 bg-stone-900 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5 shadow-2xl">
                            <ShoppingCart className="text-stone-600" size={32} />
                        </div>
                        <h2 className="text-xl font-light text-stone-200 mb-3">ยังไม่มีสินค้าใน<span className="font-bold text-sky-400">ตะกร้า</span></h2>
                        <p className="text-stone-500 mb-8 font-light max-w-sm mx-auto leading-relaxed text-sm">เริ่มต้นค้นหาสัตว์เลื้อยคลานตัวโปรดของคุณ</p>
                        <button
                            onClick={() => navigate('/shop')}
                            className="bg-sky-500 hover:bg-sky-400 text-stone-950 font-bold uppercase tracking-widest text-[10px] py-3 px-8 rounded-xl transition-all shadow-lg hover:shadow-sky-500/30 transform hover:-translate-y-0.5"
                        >
                            เริ่มช้อปปิ้งเลย
                        </button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Cart Items */}
                    <div className="lg:col-span-7 space-y-4">
                        {cart.map(item => {
                            const API = import.meta.env.VITE_API_URL || 'http://43.229.149.151:5000/api';
                            const BASE_URL = API.replace('/api', '');
                            const imageUrl = item.customerImage
                                ? (item.customerImage.startsWith('http') ? item.customerImage : `${BASE_URL}${item.customerImage}`)
                                : (item.adminImage ? (item.adminImage.startsWith('http') ? item.adminImage : `${BASE_URL}${item.adminImage}`) : null);

                            return (
                                <div key={item.id} className="glass-premium rounded-2xl p-3 flex flex-col sm:flex-row gap-4 items-center group transition-all duration-300 hover:border-sky-500/30">
                                    <div className="relative w-full sm:w-24 h-24 rounded-lg overflow-hidden bg-stone-950 flex-shrink-0 shadow-inner">
                                        {imageUrl ? (
                                            <img src={imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-stone-700"><ShoppingCart size={22} /></div>
                                        )}
                                    </div>
                                    <div className="flex-1 text-center sm:text-left min-w-0">
                                        <span className="inline-block px-2 py-px bg-sky-500/10 border border-sky-500/20 rounded-full text-[8px] text-sky-400 uppercase tracking-wider font-bold mb-1">{item.species}</span>
                                        <h3 className="font-semibold text-stone-100 text-sm group-hover:text-sky-400 transition-colors truncate">{item.name}</h3>
                                        <p className="text-stone-500 text-[11px] font-light truncate">{item.morph || 'Common Morph'}</p>
                                        <div className="text-base font-bold tracking-tight text-white mt-1">{formatPrice(item.price)}</div>
                                    </div>
                                    <div className="flex flex-row sm:flex-col items-center gap-3 sm:gap-2">
                                        <div className="flex items-center glass rounded-lg bg-black/30 border border-white/5">
                                            <button onClick={() => updateQuantity(item.id, -1)} className="w-7 h-7 flex items-center justify-center text-stone-500 hover:text-sky-400 transition-colors text-sm">-</button>
                                            <span className="w-7 text-center font-bold text-stone-200 text-sm tabular-nums">{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.id, 1)} className="w-7 h-7 flex items-center justify-center text-stone-500 hover:text-sky-400 transition-colors text-sm">+</button>
                                        </div>
                                        <button onClick={() => removeFromCart(item.id)} className="text-stone-700 hover:text-red-500 p-1 transition-colors" title="ลบสินค้า">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-5">
                        <div className="glass-premium p-6 rounded-2xl border border-white/10 sticky top-24 shadow-xl overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full blur-[50px] -mr-12 -mt-12"></div>

                            <div className="relative z-10">
                                <div className="text-sky-500 font-bold tracking-[0.15em] uppercase text-[0.5rem] mb-1 opacity-80">Order Overview</div>
                                <h3 className="font-light text-xl text-stone-100 mb-5">สรุป<span className="font-bold text-sky-400">คำสั่งซื้อ</span></h3>

                                <div className="space-y-3 mb-6 pb-5 border-b border-white/5">
                                    <div className="flex justify-between text-stone-400 text-sm">
                                        <span>ยอดรวมสินค้า ({cartItemCount} รายการ)</span>
                                        <span className="text-stone-100 font-medium">{formatPrice(cartTotal)}</span>
                                    </div>
                                    {settings.enable_vat && (
                                        <div className="flex justify-between text-stone-400 text-sm">
                                            <span>ภาษี (VAT {settings.tax_rate}%)</span>
                                            <span className="text-stone-100 font-medium">{formatPrice(cartTotal * settings.tax_rate / 100)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center text-stone-400 text-sm">
                                        <span>ค่าจัดส่ง</span>
                                        {cartTotal >= settings.free_shipping_min ? (
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[8px] uppercase font-bold tracking-wider text-emerald-400/80 border border-emerald-500/30 px-1.5 py-px rounded">Free</span>
                                                <span className="text-emerald-400 font-semibold text-sm">ส่งฟรี</span>
                                            </div>
                                        ) : (
                                            <span className="text-stone-100 font-medium">{formatPrice(settings.shipping_fee)}</span>
                                        )}
                                    </div>
                                    {cartTotal < settings.free_shipping_min && settings.free_shipping_min > 0 && (
                                        <div className="p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-[10px] text-emerald-400/80 text-center animate-pulse">
                                            ซื้ออีก {formatPrice(settings.free_shipping_min - cartTotal)} เพื่อรับสิทธิ์ส่งฟรี!
                                        </div>
                                    )}
                                </div>

                                {/* Customer Info */}
                                <div className="space-y-4 mb-6">
                                    <h4 className="flex items-center gap-2 text-stone-400 font-semibold uppercase tracking-wider text-[0.6rem]">
                                        <span className="w-4 h-px bg-white/10"></span>
                                        ข้อมูลผู้สั่งซื้อ
                                        <span className="w-4 h-px bg-white/10"></span>
                                    </h4>

                                    {error && (
                                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-2.5 rounded-lg text-xs animate-shake">
                                            {error}
                                        </div>
                                    )}

                                    <div className="space-y-2.5">
                                        <div className="relative group/input">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-600 group-focus-within/input:text-sky-400 transition-colors" size={14} />
                                            <input
                                                type="text"
                                                placeholder="ชื่อ - นามสกุล ผู้รับ *"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full bg-stone-950/40 border border-white/5 focus:border-sky-500/40 rounded-lg py-2.5 pl-9 pr-3 text-stone-200 placeholder-stone-600 outline-none transition-all text-sm"
                                            />
                                        </div>

                                        <div className="relative group/input">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-600 group-focus-within/input:text-sky-400 transition-colors" size={14} />
                                            <input
                                                type="tel"
                                                placeholder="เบอร์โทรศัพท์ติดต่อ *"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                className="w-full bg-stone-950/40 border border-white/5 focus:border-sky-500/40 rounded-lg py-2.5 pl-9 pr-3 text-stone-200 placeholder-stone-600 outline-none transition-all text-sm"
                                            />
                                        </div>

                                        <div className="relative group/input">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[8px] font-bold text-stone-600 group-focus-within/input:text-sky-400 transition-colors uppercase">Line</div>
                                            <input
                                                type="text"
                                                placeholder="Line ID"
                                                value={formData.lineId}
                                                onChange={(e) => setFormData({ ...formData, lineId: e.target.value })}
                                                className="w-full bg-stone-950/40 border border-white/5 focus:border-sky-500/40 rounded-lg py-2.5 pl-9 pr-3 text-stone-200 placeholder-stone-600 outline-none transition-all text-sm"
                                            />
                                        </div>

                                        <div className="relative group/input">
                                            <MapPin className="absolute top-3 left-3 text-stone-600 group-focus-within/input:text-sky-400 transition-colors" size={14} />
                                            <textarea
                                                placeholder="ที่อยู่สำหรับจัดส่ง *"
                                                value={formData.address}
                                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                rows={2}
                                                className="w-full bg-stone-950/40 border border-white/5 focus:border-sky-500/40 rounded-lg py-2.5 pl-9 pr-3 text-stone-200 placeholder-stone-600 outline-none transition-all resize-none text-sm"
                                            ></textarea>
                                        </div>

                                        <div className="relative group/input">
                                            <FileText className="absolute top-3 left-3 text-stone-600 group-focus-within/input:text-sky-400 transition-colors" size={14} />
                                            <textarea
                                                placeholder="หมายเหตุ (ที่อยู่จัดส่ง, ช่องทางติดต่อ)"
                                                value={formData.note}
                                                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                                                rows={2}
                                                className="w-full bg-stone-950/40 border border-white/5 focus:border-sky-500/40 rounded-lg py-2.5 pl-9 pr-3 text-stone-200 placeholder-stone-600 outline-none transition-all resize-none text-sm"
                                            ></textarea>
                                        </div>
                                    </div>
                                </div>

                                {!customer && (
                                    <div className="mb-5 p-3 rounded-xl bg-sky-500/5 border border-sky-500/10 text-center">
                                        <p className="text-[0.5rem] text-stone-500 mb-1 uppercase tracking-widest font-medium">Member Only</p>
                                        <Link to="/login" className="text-[10px] font-bold text-sky-400 hover:text-sky-300 uppercase tracking-wider inline-flex items-center gap-1">
                                            เข้าสู่ระบบเพื่อรับส่วนลด <ArrowRight size={10} />
                                        </Link>
                                    </div>
                                )}

                                <div>
                                    <span className="block text-[9px] text-stone-500 uppercase tracking-widest font-bold mb-3">ช่องทางการชำระเงิน</span>

                                    {!settings.payment_enabled ? (
                                        <div className="mb-4 p-3 rounded-xl bg-red-500/5 border border-red-500/10 text-center">
                                            <p className="text-xs text-red-500 font-medium">ระบบชำระเงินปิดปรับปรุงชั่วคราว</p>
                                            <p className="text-[10px] text-stone-500 mt-1">กรุณาติดต่อแอดมินก่อนทำการสั่งซื้อ</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex gap-2 mb-4">
                                                {settings.accept_transfer && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setPaymentMethod('transfer')}
                                                        className={`flex-1 p-2.5 rounded-xl border transition-all flex flex-col items-center gap-1.5 ${paymentMethod === 'transfer' ? 'bg-sky-500/10 border-sky-500 text-sky-400' : 'bg-stone-950/40 border-white/5 text-stone-500 hover:border-white/10'}`}
                                                    >
                                                        <div className={`p-1.5 rounded-lg ${paymentMethod === 'transfer' ? 'bg-sky-500/20' : 'bg-white/5'}`}>
                                                            <FileText size={14} />
                                                        </div>
                                                        <span className="text-[9px] font-bold uppercase tracking-wider">โอนเงิน</span>
                                                    </button>
                                                )}
                                                {settings.promptpay_enabled && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setPaymentMethod('qr')}
                                                        className={`flex-1 p-2.5 rounded-xl border transition-all flex flex-col items-center gap-1.5 ${paymentMethod === 'qr' ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400' : 'bg-stone-950/40 border-white/5 text-stone-500 hover:border-white/10'}`}
                                                    >
                                                        <div className={`p-1.5 rounded-lg ${paymentMethod === 'qr' ? 'bg-cyan-500/20' : 'bg-white/5'}`}>
                                                            <CheckCircle2 size={14} />
                                                        </div>
                                                        <span className="text-[9px] font-bold uppercase tracking-wider">QR Code</span>
                                                    </button>
                                                )}
                                                {settings.accept_cash && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setPaymentMethod('cash')}
                                                        className={`flex-1 p-2.5 rounded-xl border transition-all flex flex-col items-center gap-1.5 ${paymentMethod === 'cash' ? 'bg-amber-500/10 border-amber-500 text-amber-400' : 'bg-stone-950/40 border-white/5 text-stone-500 hover:border-white/10'}`}
                                                    >
                                                        <div className={`p-1.5 rounded-lg ${paymentMethod === 'cash' ? 'bg-amber-500/20' : 'bg-white/5'}`}>
                                                            <User size={14} />
                                                        </div>
                                                        <span className="text-[9px] font-bold uppercase tracking-wider">ปลายทาง</span>
                                                    </button>
                                                )}
                                            </div>

                                            {paymentMethod === 'transfer' && settings.accept_transfer && (
                                                <div className="mb-5 p-4 rounded-xl bg-white/5 border border-white/10 animate-fade-in">
                                                    <div className="text-[10px] font-bold text-sky-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse"></div>
                                                        ข้อมูลบัญชีธนาคาร
                                                    </div>
                                                    <div className="space-y-3">
                                                        <div className="flex justify-between items-center text-xs">
                                                            <span className="text-stone-500">ธนาคาร</span>
                                                            <div className="flex items-center gap-2">
                                                                {settings.bank_name && (
                                                                    <BankBadge bankName={settings.bank_name} size={18} />
                                                                )}
                                                                <span className="text-stone-200 font-bold">{settings.bank_name || '-'}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-between items-center text-xs">
                                                            <span className="text-stone-500">เลขบัญชี</span>
                                                            <span className="text-sky-400 font-mono font-bold tracking-wider">{settings.bank_account_number || '-'}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center text-xs">
                                                            <span className="text-stone-500">ชื่อบัญชี</span>
                                                            <span className="text-stone-200 font-bold">{settings.bank_account_name || '-'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {paymentMethod === 'qr' && settings.promptpay_enabled && (
                                                <div className="mb-5 p-4 rounded-xl bg-white/5 border border-white/10 animate-fade-in text-center relative overflow-hidden">
                                                    {isExpired && (
                                                        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-4">
                                                            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mb-3">
                                                                <Clock className="text-red-500" size={24} />
                                                            </div>
                                                            <h4 className="text-white font-bold mb-1">QR Code หมดอายุ</h4>
                                                            <p className="text-stone-400 text-[10px] mb-4">เพื่อความปลอดภัย กรุณากดเลือกวิธีชำระเงินใหม่อีกครั้ง</p>
                                                            <button
                                                                onClick={() => {
                                                                    setPaymentMethod('transfer');
                                                                    setTimeout(() => setPaymentMethod('qr'), 50);
                                                                }}
                                                                className="px-4 py-1.5 bg-sky-500 text-slate-950 text-[10px] font-bold rounded-lg hover:bg-sky-400"
                                                            >
                                                                ทำรายการใหม่
                                                            </button>
                                                        </div>
                                                    )}

                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></div>
                                                            PROMPTPAY QR
                                                        </div>
                                                        {timeLeft !== null && !isExpired && (
                                                            <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1.5 ${timeLeft < 60 ? 'bg-red-500/20 text-red-500 animate-pulse' : 'bg-white/10 text-stone-300'}`}>
                                                                <Clock size={10} />
                                                                {formatTimeLeft(timeLeft)}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="bg-white p-3 rounded-lg inline-block mb-3 shadow-xl">
                                                        {settings.promptpay_id ? (
                                                            <QRCodeSVG value={generatePayload(settings.promptpay_id, { amount: cartTotal })} size={140} />
                                                        ) : (
                                                            <div className="w-[140px] h-[140px] bg-gray-100 flex items-center justify-center text-gray-400 text-xs text-slate-900">ระบุ PromptPay ID ในตั้งค่า</div>
                                                        )}
                                                    </div>
                                                    <p className="text-[10px] text-stone-400 uppercase tracking-widest font-medium">สแกนเพื่อชำระเงินจำนวน {formatPrice(cartTotal)}</p>
                                                    <p className="text-xs text-stone-300 mt-2">{settings.bank_account_name}</p>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>

                                <div className="flex justify-between items-end mb-5">
                                    <div>
                                        <span className="block text-[9px] text-stone-500 uppercase tracking-widest font-bold">Total</span>
                                        <span className="text-stone-400 font-light text-xs">รวมภาษีแล้ว</span>
                                    </div>
                                    <div className="text-2xl font-bold text-sky-400 tracking-tighter">
                                        {(() => {
                                            const subtotal = cartTotal;
                                            const tax = settings.enable_vat ? (subtotal * settings.tax_rate / 100) : 0;
                                            const shipping = cartTotal >= settings.free_shipping_min ? 0 : settings.shipping_fee;
                                            return formatPrice(subtotal + tax + shipping);
                                        })()}
                                    </div>
                                </div>

                                <button
                                    onClick={handleCheckout}
                                    disabled={isSubmitting}
                                    className={`w-full font-bold uppercase tracking-wider text-[11px] py-3 rounded-xl flex justify-center items-center gap-2 transition-all transform hover:-translate-y-0.5 active:scale-[0.98] ${isSubmitting ? 'bg-stone-800 text-stone-600 cursor-not-allowed border border-white/5' : 'bg-sky-500 hover:bg-sky-400 text-stone-950 shadow-lg hover:shadow-sky-500/30'}`}
                                >
                                    {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                                    {isSubmitting ? 'กำลังส่งคำสั่งซื้อ...' : 'ยืนยันสั่งซื้อสินค้า'}
                                </button>

                                <p className="text-center text-stone-600 text-[9px] mt-4 uppercase tracking-wider font-medium">* กดสั่งซื้อ = ยอมรับข้อกำหนด</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};

export default Cart;
