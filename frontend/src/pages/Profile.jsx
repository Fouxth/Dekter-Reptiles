import React, { useState } from 'react';
import { User, Mail, Lock, Save, Loader2, Key } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Profile = () => {
    const { user, token } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        password: '',
        confirmPassword: ''
    });

    const API_URL = import.meta.env.VITE_API_URL || 'http://43.229.149.151:5000/api';

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password && formData.password !== formData.confirmPassword) {
            toast.error('รหัสผ่านไม่ตรงกัน');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/users/profile`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password || undefined
                })
            });

            if (res.ok) {
                toast.success('อัปเดตข้อมูลสำเร็จ');
                // Optional: Force reload or update context if name changed
                if (formData.name !== user.name) {
                    window.location.reload();
                }
            } else {
                const data = await res.json();
                toast.error(data.error || 'เกิดข้อผิดพลาด');
            }
        } catch (err) {
            toast.error('การเชื่อมต่อล้มเหลว');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-8 px-4">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-sky-500/10 rounded-2xl flex items-center justify-center border border-sky-500/20 shadow-lg shadow-sky-500/5">
                    <User className="text-sky-400" size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-light text-white">โปรไฟล์<span className="font-bold text-sky-400">ส่วนตัว</span></h1>
                    <p className="text-stone-500 text-sm font-light">จัดการข้อมูลส่วนตัวและเปลี่ยนรหัสผ่านของคุณ</p>
                </div>
            </div>

            <div className="glass-premium rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest ml-1">ชื่อผู้ใช้</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-600 group-focus-within:text-sky-400 transition-colors" size={18} />
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="ชื่อของคุณ"
                                    className="w-full bg-stone-900/50 border border-white/5 focus:border-sky-500/30 rounded-2xl py-3.5 pl-12 pr-4 text-stone-200 placeholder-stone-700 outline-none transition-all shadow-inner"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest ml-1">อีเมล</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-600 group-focus-within:text-sky-400 transition-colors" size={18} />
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="your@email.com"
                                    className="w-full bg-stone-900/50 border border-white/5 focus:border-sky-500/30 rounded-2xl py-3.5 pl-12 pr-4 text-stone-200 placeholder-stone-700 outline-none transition-all shadow-inner"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-white/5">
                        <div className="flex items-center gap-2 mb-6">
                            <Key className="text-amber-500/70" size={16} />
                            <h2 className="text-xs font-bold text-stone-400 uppercase tracking-widest">เปลี่ยนรหัสผ่าน (เว้นว่างไว้หากไม่ต้องการเปลี่ยน)</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest ml-1">รหัสผ่านใหม่</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-600 group-focus-within:text-sky-400 transition-colors" size={18} />
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        className="w-full bg-stone-900/50 border border-white/5 focus:border-sky-500/30 rounded-2xl py-3.5 pl-12 pr-4 text-stone-200 placeholder-stone-700 outline-none transition-all shadow-inner"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest ml-1">ยืนยันรหัสผ่านใหม่</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-600 group-focus-within:text-sky-400 transition-colors" size={18} />
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        className="w-full bg-stone-900/50 border border-white/5 focus:border-sky-500/30 rounded-2xl py-3.5 pl-12 pr-4 text-stone-200 placeholder-stone-700 outline-none transition-all shadow-inner"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold uppercase tracking-widest text-xs py-4 rounded-2xl transition-all shadow-lg hover:shadow-sky-500/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                    >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                        {loading ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Profile;
