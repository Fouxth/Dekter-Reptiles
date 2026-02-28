import React, { useEffect, useState } from 'react';
import { CheckCircle2, ChevronRight, MapPin, Receipt, ShoppingBag, ArrowRight, Upload, Loader2, CreditCard } from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useCustomerAuth } from '../contexts/CustomerAuthContext';
import SEO from '../components/SEO';
import { getSystemSettings } from '../services/api';
import generatePayload from 'promptpay-qr';
import { QRCodeSVG } from 'qrcode.react';
import BankBadge from '../components/BankBadge';



const formatPrice = (price) => {
    return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 }).format(price);
};

const API = import.meta.env.VITE_API_URL;

const CheckoutSuccess = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { customer } = useCustomerAuth();

    // Redirect if visited without state
    useEffect(() => {
        if (!location.state || !location.state.orderNo) {
            navigate('/shop');
        }
    }, [location, navigate]);

    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploaded, setUploaded] = useState(false);
    const [error, setError] = useState('');
    const [settings, setSettings] = useState({
        bank_name: '',
        bank_account_name: '',
        bank_account_number: '',
        promptpay_id: '',
        qr_expiry_minutes: 15
    });

    const [timeLeft, setTimeLeft] = useState(null);
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await getSystemSettings();
                const getText = (key, fallback) => {
                    const s = data.find(item => item.key === key);
                    return s ? s.value : fallback;
                };
                setSettings({
                    bank_name: getText('bank_name', 'กสิกรไทย (K-Bank)'),
                    bank_account_name: getText('bank_account_name', ''),
                    bank_account_number: getText('bank_account_number', ''),
                    promptpay_id: getText('promptpay_id', ''),
                    qr_expiry_minutes: parseInt(getText('qr_expiry_minutes', '15'))
                });
            } catch (err) {
                console.error("Failed to fetch settings:", err);
            }
        };
        fetchSettings();
    }, []);
    const state = location.state || {};
    const { orderNo, total, orderId, paymentMethod, createdAt, slipUploadToken } = state;

    useEffect(() => {
        if (!createdAt || !settings.qr_expiry_minutes) return;

        const expiryTime = new Date(createdAt).getTime() + (settings.qr_expiry_minutes * 60 * 1000);

        const timer = setInterval(() => {
            const now = new Date().getTime();
            const distance = expiryTime - now;

            if (distance < 0) {
                clearInterval(timer);
                setTimeLeft(0);
                setIsExpired(true);
            } else {
                setTimeLeft(distance);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [createdAt, settings.qr_expiry_minutes]);

    const formatTimeLeft = (ms) => {
        if (ms === null) return '';
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((ms % (1000 * 60)) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError('');
        }
    };

    const handleUpload = async () => {
        if (!file || !orderId) return;

        setUploading(true);
        setError('');
        const formData = new FormData();
        formData.append('slip', file);

        try {
            const response = await fetch(`${API}/orders/${orderId}/slip`, {
                method: 'POST',
                headers: slipUploadToken ? { 'X-Slip-Token': slipUploadToken } : undefined,
                body: formData,
            });

            if (response.ok) {
                setUploaded(true);
            } else {
                const data = await response.json();
                setError(data.error || 'เกิดข้อผิดพลาดในการอัปโหลด');
            }
        } catch (err) {
            console.error("Upload error:", err);
            setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
        } finally {
            setUploading(false);
        }
    };

    if (!state.orderNo) return null;

    return (
        <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in text-center min-h-[70vh] flex flex-col justify-center items-center relative overflow-hidden">
            <SEO title="สั่งซื้อสำเร็จ" description="ขอบคุณที่สั่งซื้อสินค้ากับ Dexter Reptiles" noindex={true} />

            {/* Background Element */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none flex items-center justify-center">
                <div className="w-[400px] h-[400px] rounded-full bg-sky-500/5 blur-[100px]"></div>
            </div>

            <div className="glass-premium border border-white/10 rounded-3xl p-8 md:p-12 relative z-10 w-full shadow-2xl overflow-hidden group">
                <div className="absolute top-0 right-0 w-48 h-48 bg-sky-500/5 rounded-full blur-[80px] -mr-24 -mt-24"></div>

                <div className="w-20 h-20 bg-gradient-to-br from-sky-400/20 to-cyan-600/20 text-sky-400 rounded-full flex items-center justify-center mx-auto mb-8 border border-sky-500/30 shadow-[0_0_30px_rgba(14,165,233,0.2)] animate-pulse-glow">
                    <CheckCircle2 size={40} />
                </div>

                <h1 className="text-3xl md:text-4xl font-light text-stone-100 mb-4 tracking-tight italic">สั่งซื้อ<span className="font-bold text-sky-400 not-italic">สำเร็จ!</span></h1>
                <p className="text-base text-stone-400 mb-8 font-light leading-relaxed max-w-md mx-auto">
                    {paymentMethod === 'cash'
                        ? 'ขอบคุณที่ไว้วางใจเลือกสัตว์เลี้ยงจากเรา เราจะรีบดำเนินการจัดส่งและเรียกเก็บเงินปลายทางครับ'
                        : 'ขอบคุณที่ไว้วางใจเลือกสัตว์เลี้ยงจากเรา เราจะรีบดำเนินการตรวจสอบและจัดส่งให้เร็วที่สุดครับ'}
                </p>

                <div className="bg-black/40 p-6 md:p-8 rounded-2xl border border-white/5 inline-block text-left mb-10 min-w-[280px] shadow-inner relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-sky-500/30 to-transparent"></div>
                    <div className="flex items-center gap-3 text-stone-300 mb-4 border-b border-white/5 pb-4">
                        <Receipt className="text-sky-500" size={20} />
                        <div>
                            <span className="block text-[8px] font-bold tracking-[0.15em] uppercase text-stone-500">Order Reference</span>
                            <span className="font-mono text-lg text-sky-400 font-bold">#{orderNo}</span>
                        </div>
                    </div>
                    {total !== undefined && (
                        <div className="flex items-center gap-3 text-stone-300">
                            <ShoppingBag className="text-sky-500" size={20} />
                            <div>
                                <span className="block text-[8px] font-bold tracking-[0.15em] uppercase text-stone-500">Amount to Pay</span>
                                <span className="text-xl text-stone-100 font-bold tracking-tight">{formatPrice(total)}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Conditional Payment Instructions & Slip Upload */}
                {paymentMethod === 'transfer' || paymentMethod === 'qr' ? (
                    <div className="bg-sky-500/5 border border-sky-500/10 rounded-2xl p-6 mb-10 w-full max-w-md mx-auto text-left animate-fade-in">
                        <div className="flex items-center gap-2 mb-4 text-sky-400">
                            <CreditCard size={18} />
                            <h3 className="font-bold text-sm uppercase tracking-wider">
                                {paymentMethod === 'qr' ? 'ชำระเงินด้วย QR Code' : 'ช่องทางการชำระเงิน'}
                            </h3>
                        </div>

                        {paymentMethod === 'transfer' ? (
                            <div className="space-y-4 mb-6 animate-fade-in">
                                <div className="flex justify-between items-center text-xs">
                                    <div className="flex items-center gap-2">
                                        {settings.bank_name && (
                                            <BankBadge bankName={settings.bank_name} size={22} />
                                        )}
                                        <span className="text-stone-300 font-bold">{settings.bank_name || '-'}</span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center bg-black/40 p-4 rounded-xl border border-white/5 shadow-inner group/bank">
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-bold text-stone-500 uppercase tracking-widest mb-1">Account Number</span>
                                        <span className="text-sky-400 font-mono text-base font-bold tracking-widest">{settings.bank_account_number || '-'}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[8px] font-bold text-stone-500 uppercase tracking-widest block mb-1">Account Name</span>
                                        <span className="text-xs text-stone-200 font-bold">{settings.bank_account_name || '-'}</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center mb-6 animate-fade-in">
                                {!isExpired ? (
                                    <>
                                        {settings.qr_expiry_minutes > 0 && timeLeft !== null && (
                                            <div className="flex items-center justify-center gap-2 mb-4 text-amber-400">
                                                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                                                <span className="text-[10px] font-bold uppercase tracking-widest">QR จะหมดอายุใน {formatTimeLeft(timeLeft)} นาที</span>
                                            </div>
                                        )}
                                        <div className="bg-white p-4 rounded-2xl inline-block mb-4 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10 relative group/qr">
                                            <div className="absolute inset-0 bg-sky-500/5 rounded-2xl group-hover/qr:opacity-0 transition-opacity"></div>
                                            {settings.promptpay_id ? (
                                                <QRCodeSVG value={generatePayload(settings.promptpay_id, { amount: total })} size={160} />
                                            ) : (
                                                <div className="w-[160px] h-[160px] bg-gray-100 flex items-center justify-center text-gray-400 text-xs">ระบุ PromptPay ID ในตั้งค่า</div>
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-stone-500 uppercase tracking-widest font-bold">สแกนเพื่อชำระเงิน {formatPrice(total)}</p>
                                            <p className="text-xs text-stone-300 font-medium">{settings.bank_account_name}</p>
                                        </div>
                                    </>
                                ) : (
                                    <div className="py-10 px-6 rounded-2xl border border-dashed border-red-500/30 bg-red-500/5 flex flex-col items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                                            <CreditCard size={24} />
                                        </div>
                                        <div className="text-center">
                                            <h4 className="text-red-400 font-bold text-sm uppercase tracking-wider mb-1">QR Code หมดอายุแล้ว</h4>
                                            <p className="text-[10px] text-stone-500">กรุณาทำรายการใหม่ หรือติดต่อแอดมินเพื่อยืนยันการโอนเงิน</p>
                                        </div>
                                        <button
                                            onClick={() => window.location.reload()}
                                            className="mt-2 text-[10px] font-bold text-sky-400 uppercase tracking-widest hover:text-sky-300"
                                        >
                                            ลองใหม่
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {!uploaded ? (
                            <div className="space-y-4">
                                <label className="block">
                                    <span className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2">อัปโหลดสลิปยืนยันการโอน</span>
                                    <div className={`relative border-2 border-dashed rounded-xl p-4 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ${file ? 'border-sky-500/50 bg-sky-500/5' : 'border-white/10 hover:border-white/20'}`}>
                                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleFileChange} />
                                        <Upload size={24} className={file ? 'text-sky-400' : 'text-stone-600'} />
                                        <span className="text-xs text-stone-400 font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-full px-2">
                                            {file ? file.name : 'เลือกไฟล์รูปภาพสลิป'}
                                        </span>
                                    </div>
                                </label>

                                {error && <p className="text-red-400 text-[10px] text-center">{error}</p>}

                                <button
                                    onClick={handleUpload}
                                    disabled={!file || uploading}
                                    className="w-full bg-sky-500 hover:bg-sky-400 text-stone-950 font-bold py-3 rounded-xl transition-all flex justify-center items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-xs uppercase tracking-wider"
                                >
                                    {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                                    {uploading ? 'กำลังส่งข้อมูล...' : 'ยืนยันการส่งสลิป'}
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-4 text-emerald-400 gap-2 border border-emerald-500/20 bg-emerald-500/5 rounded-xl">
                                <CheckCircle2 size={24} />
                                <span className="text-[10px] font-bold uppercase tracking-widest">ได้รับข้อมูลสลิปเรียบร้อยแล้ว</span>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-6 mb-10 w-full max-w-md mx-auto text-left animate-fade-in">
                        <div className="flex items-center gap-2 mb-4 text-amber-500">
                            <MapPin size={18} />
                            <h3 className="font-bold text-sm uppercase tracking-wider">การชำระเงินปลายทาง</h3>
                        </div>
                        <p className="text-xs text-stone-400 leading-relaxed">
                            กรุณาเตรียมเงินสดจำนวน <span className="text-white font-bold">{formatPrice(total)}</span> ให้พร้อมเมื่อเจ้าหน้าที่นำส่งสินค้าครับ เราจะติดต่อกลับเพื่อยืนยันการจัดส่งอีกครั้ง
                        </p>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <button
                        onClick={() => navigate('/')}
                        className="w-full sm:w-auto bg-stone-100 hover:bg-white text-stone-900 font-bold uppercase tracking-wider text-[11px] py-3.5 px-8 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                    >
                        กลับสู่หน้าหลัก <ChevronRight size={16} />
                    </button>
                    {customer && (
                        <button
                            onClick={() => navigate('/profile')}
                            className="w-full sm:w-auto bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 font-bold uppercase tracking-wider text-[11px] py-3.5 px-8 rounded-xl transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5"
                        >
                            ดูประวัติการสั่งซื้อ <ArrowRight size={16} />
                        </button>
                    )}
                </div>
            </div>
        </main>
    );
};

export default CheckoutSuccess;
