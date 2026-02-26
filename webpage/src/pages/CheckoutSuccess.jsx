import React, { useEffect, useState } from 'react';
import { CheckCircle2, ChevronRight, MapPin, Receipt, ShoppingBag, ArrowRight, Upload, Loader2, CreditCard } from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useCustomerAuth } from '../contexts/CustomerAuthContext';
import SEO from '../components/SEO';

const formatPrice = (price) => {
    return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 }).format(price);
};

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

    if (!location.state || !location.state.orderNo) return null;
    const { orderNo, total, orderId, paymentMethod } = location.state;

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
            const response = await fetch(`/api/orders/${orderId}/slip`, {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                setUploaded(true);
            } else {
                const data = await response.json();
                setError(data.error || 'เกิดข้อผิดพลาดในการอัปโหลด');
            }
        } catch (err) {
            setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
        } finally {
            setUploading(false);
        }
    };

    return (
        <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in text-center min-h-[70vh] flex flex-col justify-center items-center relative overflow-hidden">
            <SEO title="สั่งซื้อสำเร็จ" description="ขอบคุณที่สั่งซื้อสินค้ากับ Dexter Reptiles" />

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
                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-stone-500">ธนาคารกสิกรไทย (K-Bank)</span>
                                </div>
                                <div className="flex justify-between items-center bg-black/20 p-3 rounded-lg border border-white/5">
                                    <span className="text-sky-400 font-mono text-sm font-bold tracking-wider">123-4-56789-0</span>
                                    <span className="text-[10px] text-stone-500 uppercase font-bold">นายสมชาย ใจดี</span>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center mb-6">
                                <div className="bg-white p-2 rounded-lg inline-block mb-3 shadow-xl">
                                    <img src="/qr-payment.png" alt="QR Payment" className="w-32 h-32 object-contain" />
                                </div>
                                <p className="text-[10px] text-stone-500 uppercase tracking-widest font-medium">สแกนเพื่อชำระเงินจำนวน {formatPrice(total)}</p>
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
