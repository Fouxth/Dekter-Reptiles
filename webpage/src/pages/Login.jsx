import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Loader2, ArrowRight, UserPlus } from 'lucide-react';
import { customerLogin } from '../services/api';
import { useCustomerAuth } from '../contexts/CustomerAuthContext';
import SEO from '../components/SEO';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { refreshProfile } = useCustomerAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await customerLogin(email, password);
            await refreshProfile();
            navigate('/profile');
        } catch (err) {
            setError(err.response?.data?.error || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 relative overflow-hidden">
            <SEO title="เข้าสู่ระบบ" description="เข้าสู่ระบบสมาชิก Dexter Reptiles เพื่อจัดการการสั่งซื้อและข้อมูลส่วนตัว" noindex={true} />

            {/* Background elements */}
            <div className="absolute top-1/4 -left-20 w-80 h-80 bg-sky-500/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="w-full max-w-md animate-fade-in relative z-10">
                <div className="glass-dark p-10 rounded-[2.5rem] border border-white/10 shadow-2xl">
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 mb-6">
                            <Lock className="text-sky-500" size={32} />
                        </div>
                        <h1 className="text-3xl font-light text-stone-100 mb-2">ยินดีต้อนรับ<span className="font-bold text-sky-400">กลับมา</span></h1>
                        <p className="text-stone-400">เข้าสู่ระบบเพื่อจัดการการสั่งซื้อของคุณ</p>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm mb-6 animate-shake">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-[0.65rem] uppercase tracking-[0.2em] text-stone-500 mb-2 ml-4">อีเมล (Email Address)</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500 group-focus-within:text-sky-400 transition-colors" size={18} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-stone-900/50 border border-white/5 focus:border-sky-500/50 rounded-2xl py-4 pl-12 pr-4 text-stone-200 outline-none transition-all duration-300 placeholder:text-stone-600"
                                    placeholder="yourname@example.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[0.65rem] uppercase tracking-[0.2em] text-stone-500 mb-2 ml-4">รหัสผ่าน (Password)</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500 group-focus-within:text-sky-400 transition-colors" size={18} />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-stone-900/50 border border-white/5 focus:border-sky-500/50 rounded-2xl py-4 pl-12 pr-4 text-stone-200 outline-none transition-all duration-300 placeholder:text-stone-600"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-sky-500 hover:bg-sky-400 text-stone-950 font-bold py-4 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(14,165,233,0.2)] hover:shadow-[0_0_30px_rgba(14,165,233,0.4)] transform hover:-translate-y-1 mt-8 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-sm"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : <>เข้าสู่ระบบ <ArrowRight size={18} /></>}
                        </button>
                    </form>

                    <div className="mt-10 pt-8 border-t border-white/5 text-center">
                        <p className="text-stone-500 text-sm mb-4">ยังไม่มีบัญชีสมาชิก?</p>
                        <Link
                            to="/register"
                            className="inline-flex items-center gap-2 text-sky-400 hover:text-sky-300 font-bold uppercase tracking-widest text-xs transition-colors"
                        >
                            <UserPlus size={14} /> สมัครสมาชิกใหม่
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
