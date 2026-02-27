import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Phone, MapPin, Loader2, UserPlus, ArrowRight } from 'lucide-react';
import { customerRegister } from '../services/api';
import { useCustomerAuth } from '../contexts/CustomerAuthContext';
import SEO from '../components/SEO';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        address: '',
        lineId: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { refreshProfile } = useCustomerAuth();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await customerRegister(formData);
            await refreshProfile();
            navigate('/profile');
        } catch (err) {
            setError(err.response?.data?.error || 'เกิดข้อผิดพลาดในการสมัครสมาชิก');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[90vh] flex items-center justify-center px-4 py-16 relative overflow-hidden">
            <SEO title="สมัครสมาชิก" description="สมัครสมาชิก Dexter Reptiles เพื่อรับสิทธิพิเศษและจัดการการสั่งซื้อได้ง่ายขึ้น" noindex={true} />

            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-sky-500/5 rounded-full blur-[150px] pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[150px] pointer-events-none"></div>

            <div className="w-full max-w-2xl animate-fade-in relative z-10">
                <div className="glass-dark p-8 md:p-12 rounded-[3rem] border border-white/10 shadow-2xl">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 mb-6">
                            <UserPlus className="text-sky-500" size={32} />
                        </div>
                        <h1 className="text-3xl font-light text-stone-100 mb-2">สมัคร<span className="font-bold text-sky-400">สมาชิกใหม่</span></h1>
                        <p className="text-stone-400">ร่วมเป็นส่วนหนึ่งของครอบครัว Dexter Reptiles</p>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm mb-8 animate-shake">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-[0.65rem] uppercase tracking-[0.2em] text-stone-500 mb-2 ml-4">ชื่อ-นามสกุล (Full Name)</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500 group-focus-within:text-sky-400 transition-colors" size={18} />
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full bg-stone-900/50 border border-white/5 focus:border-sky-500/50 rounded-2xl py-4 pl-12 pr-4 text-stone-200 outline-none transition-all duration-300 placeholder:text-stone-600"
                                    placeholder="สมชาย ใจดี"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[0.65rem] uppercase tracking-[0.2em] text-stone-500 mb-2 ml-4">อีเมล (Email)</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500 group-focus-within:text-sky-400 transition-colors" size={18} />
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full bg-stone-900/50 border border-white/5 focus:border-sky-500/50 rounded-2xl py-4 pl-12 pr-4 text-stone-200 outline-none transition-all duration-300 placeholder:text-stone-600"
                                    placeholder="email@example.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[0.65rem] uppercase tracking-[0.2em] text-stone-500 mb-2 ml-4">เบอร์โทรศัพท์ (Phone)</label>
                            <div className="relative group">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500 group-focus-within:text-sky-400 transition-colors" size={18} />
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="w-full bg-stone-900/50 border border-white/5 focus:border-sky-500/50 rounded-2xl py-4 pl-12 pr-4 text-stone-200 outline-none transition-all duration-300 placeholder:text-stone-600"
                                    placeholder="08X-XXX-XXXX"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[0.65rem] uppercase tracking-[0.2em] text-stone-500 mb-2 ml-4">Line ID</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500 group-focus-within:text-sky-400 transition-colors uppercase font-bold text-[10px] tracking-tighter">Line</div>
                                <input
                                    type="text"
                                    name="lineId"
                                    value={formData.lineId}
                                    onChange={handleChange}
                                    className="w-full bg-stone-900/50 border border-white/5 focus:border-sky-500/50 rounded-2xl py-4 pl-12 pr-4 text-stone-200 outline-none transition-all duration-300 placeholder:text-stone-600"
                                    placeholder="yourid"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[0.65rem] uppercase tracking-[0.2em] text-stone-500 mb-2 ml-4">รหัสผ่าน (Password)</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500 group-focus-within:text-sky-400 transition-colors" size={18} />
                                <input
                                    type="password"
                                    name="password"
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full bg-stone-900/50 border border-white/5 focus:border-sky-500/50 rounded-2xl py-4 pl-12 pr-4 text-stone-200 outline-none transition-all duration-300 placeholder:text-stone-600"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-[0.65rem] uppercase tracking-[0.2em] text-stone-500 mb-2 ml-4">ที่อยู่จัดส่ง (Shipping Address)</label>
                            <div className="relative group">
                                <MapPin className="absolute left-4 top-6 text-stone-500 group-focus-within:text-sky-400 transition-colors" size={18} />
                                <textarea
                                    name="address"
                                    rows="3"
                                    value={formData.address}
                                    onChange={handleChange}
                                    className="w-full bg-stone-900/50 border border-white/5 focus:border-sky-500/50 rounded-2xl py-4 pl-12 pr-4 text-stone-200 outline-none transition-all duration-300 placeholder:text-stone-600 resize-none"
                                    placeholder="บ้านเลขที่, ถนน, แขวง/ตำบล, เขต/อำเภอ, จังหวัด, รหัสไปรษณีย์"
                                ></textarea>
                            </div>
                        </div>

                        <div className="md:col-span-2 mt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-sky-500 hover:bg-sky-400 text-stone-950 font-bold py-5 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(14,165,233,0.2)] hover:shadow-[0_0_30px_rgba(14,165,233,0.4)] transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-sm"
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : <>สมัครสมาชิก <ArrowRight size={18} /></>}
                            </button>
                        </div>
                    </form>

                    <div className="mt-12 pt-8 border-t border-white/5 text-center">
                        <p className="text-stone-500 text-sm mb-4">เป็นสมาชิกอยู่แล้ว?</p>
                        <Link
                            to="/login"
                            className="inline-flex items-center gap-2 text-sky-400 hover:text-sky-300 font-bold uppercase tracking-widest text-xs transition-colors"
                        >
                            ลงชื่อเข้าใช้งาน <ArrowRight size={14} />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
