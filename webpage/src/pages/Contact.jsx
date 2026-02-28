import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import SEO from '../components/SEO';
import { getSystemSettings } from '../services/api';

const Contact = () => {
    const [contactInfo, setContactInfo] = useState({
        address: '123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร 10110',
        phone: '080-123-4567',
        email: 'hello@siamreptiles.com',
        line: '@siamreptiles',
        facebook: '',
        hours: 'เปิดให้บริการทุกวัน 10:00 - 20:00 น.',
        googleMapUrl: ''
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const settings = await getSystemSettings();
                const getSet = (key, fallback) => settings[key] ? settings[key] : fallback;

                let facebook = getSet('contact_facebook', '');

                setContactInfo({
                    address: getSet('contact_address', '123 ถนนสุขุมวิท แขวงคลองเตย กรุงเทพมหานคร 10110'),
                    phone: getSet('contact_phone', '080-123-4567'),
                    email: getSet('contact_email', 'hello@siamreptiles.com'),
                    line: getSet('contact_line', '@siamreptiles'),
                    facebook,
                    hours: getSet('opening_hours', '10:00 - 20:00'),
                    googleMapUrl: getSet('google_map_url', '')
                });
            } catch (error) {
                console.error("Failed to fetch contact settings:", error);
            }
        };

        fetchSettings();
    }, []);

    return (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-fade-in relative min-h-[80vh]">
            <SEO title="ติดต่อเรา" description="ติดต่อ Dexter Reptiles สอบถามข้อมูลสัตว์เลี้ยง ปรึกษาการดูแล หรือแจ้งปัญหาการใช้งาน" url="/contact" />

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

                <div className="max-w-2xl mx-auto">
                    <div className="glass-card p-10 md:p-14 rounded-[2.5rem] relative overflow-hidden shadow-2xl border border-white/5">
                        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-sky-500/5 blur-[80px] rounded-full pointer-events-none"></div>
                        <h2 className="text-3xl font-light text-stone-200 mb-10 text-center relative z-10">ข้อมูลการ<span className="font-bold text-sky-500">ติดต่อ</span></h2>
                        <div className="space-y-8 relative z-10">
                            <div className="flex flex-col gap-4 w-full">
                                <div className="flex items-start gap-5 group">
                                    <div className="w-12 h-12 glass-dark rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:border-sky-500/50 transition-all shadow-lg">
                                        <MapPin size={22} className="text-sky-500" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-stone-200 uppercase tracking-widest text-sm mb-1">หน้าร้าน</h3>
                                        <p className="text-stone-400 text-sm leading-relaxed font-light mb-4">{contactInfo.address}</p>

                                        {/* Embedded Google Map */}
                                        <div className="w-full h-64 rounded-xl overflow-hidden border border-white/10 relative group shadow-lg">
                                            <div className="absolute inset-0 bg-sky-500/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10"></div>
                                            {contactInfo.googleMapUrl ? (
                                                <iframe
                                                    src={contactInfo.googleMapUrl}
                                                    width="100%"
                                                    height="100%"
                                                    style={{ border: 0 }}
                                                    allowFullScreen=""
                                                    loading="lazy"
                                                    referrerPolicy="no-referrer-when-downgrade"
                                                    title="Dexter Reptiles Location"
                                                    className="grayscale-[30%] contrast-[1.1] invert-[90%] hue-rotate-180"
                                                ></iframe>
                                            ) : (
                                                <iframe
                                                    src="https://maps.google.com/maps?q=DEXTER+Reptiles,+%E0%B8%8B.+%E0%B8%A7%E0%B8%B1%E0%B8%94%E0%B8%AB%E0%B8%99%E0%B8%AD%E0%B8%87%E0%B8%9B%E0%B8%A3%E0%B8%87+Tambon+Bang+Dua,+Amphoe+Mueang+Pathum+Thani,+Pathum+Thani+12000&t=&z=15&ie=UTF8&iwloc=&output=embed"
                                                    width="100%"
                                                    height="100%"
                                                    style={{ border: 0 }}
                                                    allowFullScreen=""
                                                    loading="lazy"
                                                    referrerPolicy="no-referrer-when-downgrade"
                                                    title="Dexter Reptiles Location (Default)"
                                                    className="grayscale-[30%] contrast-[1.1] invert-[90%] hue-rotate-180"
                                                ></iframe>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-start gap-5 group">
                                <div className="w-12 h-12 glass-dark rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:border-sky-500/50 transition-all shadow-lg">
                                    <Phone size={22} className="text-sky-500" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-stone-200 uppercase tracking-widest text-sm mb-1">เบอร์โทรศัพท์</h3>
                                    <p className="text-stone-400 text-sm font-light">{contactInfo.phone}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-5 group">
                                <div className="w-12 h-12 glass-dark rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:border-sky-500/50 transition-all shadow-lg">
                                    <Mail size={22} className="text-sky-500" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-stone-200 uppercase tracking-widest text-sm mb-1">อีเมล & Social</h3>
                                    {contactInfo.email && (
                                        <p className="text-stone-400 text-sm font-light mb-1">
                                            Email: <a href={`mailto:${contactInfo.email}`} className="text-sky-400 hover:underline">{contactInfo.email}</a>
                                        </p>
                                    )}
                                    {contactInfo.line && (
                                        <p className="text-stone-400 text-sm font-light mb-1">
                                            Line: <a
                                                href={`https://line.me/R/ti/p/${contactInfo.line.startsWith('@') ? contactInfo.line : '@' + contactInfo.line}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-emerald-400 font-bold hover:underline"
                                            >
                                                {contactInfo.line}
                                            </a>
                                        </p>
                                    )}
                                    {contactInfo.facebook && (
                                        <p className="text-stone-400 text-sm font-light">
                                            Facebook: <a
                                                href={contactInfo.facebook.startsWith('http') ? contactInfo.facebook : `https://facebook.com/${contactInfo.facebook.replace(/^@/, '')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-400 font-bold hover:underline"
                                            >
                                                {contactInfo.facebook.replace(/https?:\/\/(www\.)?facebook\.com\//, '').split('/')[0].split('?')[0] || 'Facebook Page'}
                                            </a>
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-start gap-5 group">
                                <div className="w-12 h-12 glass-dark rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:border-sky-500/50 transition-all shadow-lg">
                                    <Clock size={22} className="text-sky-500" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-stone-200 uppercase tracking-widest text-sm mb-1">เวลาทำการ</h3>
                                    <p className="text-stone-400 text-sm font-light whitespace-pre-line">{contactInfo.hours}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default Contact;
