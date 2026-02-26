import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2 } from 'lucide-react';
import SEO from '../components/SEO';

const Contact = () => {
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsSubmitted(true);
    };

    return (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-fade-in relative min-h-[80vh]">
            <SEO title="ติดต่อเรา" description="ติดต่อ Dexter Reptiles สอบถามข้อมูลสัตว์เลี้ยง ปรึกษาการดูแล หรือแจ้งปัญหาการใช้งาน" />

            {/* Background Element */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[30%] -right-[10%] w-[70%] h-[70%] rounded-full bg-sky-500/5 blur-[120px] mix-blend-screen"></div>
            </div>

            <div className="max-w-5xl mx-auto relative z-10">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-sky-500/30 bg-sky-500/10 text-sky-400 text-xs uppercase tracking-widest font-semibold mb-4">
                        <Mail size={14} /> Get in Touch
                    </div>
                    <h1 className="text-4xl md:text-5xl font-light text-stone-100 mb-4">ติดต่อ <span className="font-bold">Dexter Reptiles</span></h1>
                    <p className="text-stone-400 font-light text-lg">เรายินดีให้คำปรึกษาและตอบทุกข้อสงสัยของคุณ</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-8 lg:gap-12">
                    {/* Contact Info */}
                    <div className="md:col-span-2 space-y-8">
                        <div>
                            <h2 className="text-2xl font-light text-stone-200 mb-8">ข้อมูลการ<span className="font-bold text-sky-500">ติดต่อ</span></h2>
                            <div className="space-y-8">
                                <div className="flex items-start gap-5 group">
                                    <div className="w-12 h-12 glass-dark rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:border-sky-500/50 transition-all shadow-lg">
                                        <MapPin size={22} className="text-sky-500" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-stone-200 uppercase tracking-widest text-sm mb-1">หน้าร้าน</h3>
                                        <p className="text-stone-400 text-sm leading-relaxed font-light">123 ถนนสุขุมวิท แขวงคลองเตย<br />เขตคลองเตย กรุงเทพมหานคร 10110</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-5 group">
                                    <div className="w-12 h-12 glass-dark rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:border-sky-500/50 transition-all shadow-lg">
                                        <Phone size={22} className="text-sky-500" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-stone-200 uppercase tracking-widest text-sm mb-1">เบอร์โทรศัพท์</h3>
                                        <p className="text-stone-400 text-sm font-light">080-123-4567</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-5 group">
                                    <div className="w-12 h-12 glass-dark rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:border-sky-500/50 transition-all shadow-lg">
                                        <Mail size={22} className="text-sky-500" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-stone-200 uppercase tracking-widest text-sm mb-1">อีเมล & Social</h3>
                                        <p className="text-stone-400 text-sm font-light mb-1">hello@siamreptiles.com</p>
                                        <p className="text-stone-400 text-sm font-light">Line: <span className="text-cyan-400 font-bold">@siamreptiles</span></p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-5 group">
                                    <div className="w-12 h-12 glass-dark rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:border-sky-500/50 transition-all shadow-lg">
                                        <Clock size={22} className="text-sky-500" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-stone-200 uppercase tracking-widest text-sm mb-1">เวลาทำการ</h3>
                                        <p className="text-stone-400 text-sm font-light">เปิดให้บริการทุกวัน<br /> 10:00 - 20:00 น.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="md:col-span-3">
                        <div className="glass-card p-8 md:p-12 rounded-[2.5rem] flex flex-col justify-center min-h-[500px] h-full relative overflow-hidden">
                            {/* Decorative form bg element */}
                            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-sky-500/5 blur-[80px] rounded-full"></div>

                            {isSubmitted ? (
                                <div className="text-center py-8 animate-fade-in relative z-10">
                                    <div className="w-20 h-20 bg-sky-500/10 border border-sky-500/30 text-sky-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(14,165,233,0.2)]">
                                        <CheckCircle2 size={40} />
                                    </div>
                                    <h3 className="text-3xl font-light text-stone-100 mb-4">ส่งข้อความ<span className="font-bold">สำเร็จ</span></h3>
                                    <p className="text-stone-400 mb-10 font-light text-lg">ทีมงาน Dexter Reptilesได้รับข้อความของคุณแล้ว และจะติดต่อกลับโดยเร็วที่สุดครับ</p>
                                    <button
                                        onClick={() => setIsSubmitted(false)}
                                        className="text-sky-500 font-bold uppercase tracking-widest text-sm hover:text-sky-400 border-b border-sky-500/30 hover:border-sky-400 pb-1 transition-all"
                                    >
                                        ส่งข้อความใหม่
                                    </button>
                                </div>
                            ) : (
                                <div className="relative z-10">
                                    <h2 className="text-2xl font-light text-stone-200 mb-8">ส่งข้อความ<span className="font-bold">หาเรา</span></h2>
                                    <form className="space-y-6" onSubmit={handleSubmit}>
                                        <div className="space-y-1.5">
                                            <label className="block text-xs font-bold uppercase tracking-widest text-stone-500">ชื่อ-นามสกุล</label>
                                            <input type="text" required className="w-full px-5 py-4 rounded-xl border border-white/10 glass bg-stone-900/50 text-stone-200 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 transition-all font-light placeholder-stone-600" placeholder="ชื่อของคุณ" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="block text-xs font-bold uppercase tracking-widest text-stone-500">อีเมล หรือ เบอร์โทรศัพท์</label>
                                            <input type="text" required className="w-full px-5 py-4 rounded-xl border border-white/10 glass bg-stone-900/50 text-stone-200 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 transition-all font-light placeholder-stone-600" placeholder="สำหรับติดต่อกลับ" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="block text-xs font-bold uppercase tracking-widest text-stone-500">ข้อความ</label>
                                            <textarea required rows="4" className="w-full px-5 py-4 rounded-xl border border-white/10 glass bg-stone-900/50 text-stone-200 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 transition-all font-light placeholder-stone-600 resize-none" placeholder="พิมพ์ข้อความของคุณที่นี่..."></textarea>
                                        </div>
                                        <button type="submit" className="w-full bg-stone-100 hover:bg-white text-stone-900 font-bold uppercase tracking-widest text-sm py-4 px-6 rounded-xl transition-all flex justify-center items-center gap-3 mt-4 shadow-lg hover:shadow-xl">
                                            ส่งข้อความ <Send size={16} />
                                        </button>
                                    </form>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default Contact;
