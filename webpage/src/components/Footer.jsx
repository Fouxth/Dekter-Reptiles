import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getSystemSettings } from '../services/api';

const Footer = () => {
    const [settings, setSettings] = useState({
        phone: '080-123-4567',
        line: '@siamreptiles',
        facebookText: 'Siam Reptiles',
        facebookUrl: '#',
        hours: '10:00 - 20:00 น.'
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await getSystemSettings();
                const getText = (key, fallback) => {
                    const s = data.find(item => item.key === key);
                    return s ? s.value : fallback;
                };

                let fbText = 'Dexter Reptiles';
                let fbUrl = '#';
                try {
                    const fbData = JSON.parse(getText('social_fb', '[]'));
                    if (Array.isArray(fbData) && fbData.length > 0) {
                        fbText = fbData[0].label || 'Dexter Reptiles';
                        fbUrl = fbData[0].url || '#';
                    }
                } catch (e) {
                    fbText = 'Dexter Reptiles';
                }

                setSettings({
                    phone: getText('contact_phone', '080-123-4567'),
                    line: getText('contact_line', '@dexterreptiles'),
                    facebookText: fbText,
                    facebookUrl: fbUrl,
                    hours: getText('opening_hours', '10:00 - 20:00 น.')
                });
            } catch (error) {
                console.error("Failed to fetch footer settings:", error);
            }
        };

        fetchSettings();
    }, []);

    return (
        <footer className="bg-stone-950 text-stone-400 py-12 border-t border-white/5 mt-auto relative z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="col-span-1 md:col-span-2">
                    <div className="flex items-center mb-6 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <div className="h-16 w-auto flex items-center justify-center group-hover:scale-105 transition-all drop-shadow-[0_0_20px_rgba(14,165,233,0.2)] group-hover:drop-shadow-[0_0_30px_rgba(14,165,233,0.4)] flex-shrink-0">
                            <img
                                src="/logo-dark.png"
                                alt="Dexter Reptiles"
                                className="h-full w-auto object-contain"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    if (e.target.parentElement.nextElementSibling) {
                                        e.target.parentElement.nextElementSibling.classList.remove('hidden');
                                        e.target.parentElement.nextElementSibling.classList.add('flex');
                                        e.target.parentElement.classList.add('hidden');
                                    }
                                }}
                            />
                        </div>
                        <div className="hidden w-16 h-16 bg-gradient-to-br from-sky-400 to-sky-600 rounded-full flex-col items-center justify-center shadow-lg shadow-sky-500/20 flex-shrink-0">
                            <span className="text-stone-950 font-bold text-2xl">DR</span>
                        </div>
                        <div className="ml-4">
                            <h1 className="text-2xl font-bold text-stone-100 tracking-tight group-hover:text-sky-400 transition-colors">Dexter Reptiles</h1>
                            <p className="text-xs text-sky-400/80 uppercase tracking-widest font-semibold">Premium Reptiles</p>
                        </div>
                    </div>
                    <p className="mb-4 max-w-sm">ร้านจำหน่ายงูสวยงามนำเข้า เพาะพันธุ์เอง และอุปกรณ์การเลี้ยงครบวงจร ซื้อขายมั่นใจ</p>
                    <p className="text-sm">© {new Date().getFullYear()} Dexter Reptiles. All rights reserved.</p>
                </div>
                <div>
                    <h4 className="text-white font-bold mb-4">ลิงก์ด่วน</h4>
                    <ul className="space-y-2">
                        <li><Link to="/" className="hover:text-sky-400 transition-colors">หน้าแรก</Link></li>
                        <li><Link to="/shop" className="hover:text-sky-400 transition-colors">ร้านค้า</Link></li>
                        <li><Link to="/articles" className="hover:text-sky-400 transition-colors">บทความ/วิธีเลี้ยง</Link></li>
                        <li><Link to="/contact" className="hover:text-sky-400 transition-colors">ติดต่อเรา</Link></li>
                    </ul>
                </div>
                <div>
                    <h4 className="text-white font-bold mb-4">ติดต่อเรา</h4>
                    <ul className="space-y-2">
                        <li>โทร: {settings.phone}</li>
                        <li>Line: {settings.line}</li>
                        <li>Facebook: <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer" className="hover:text-sky-400 transition-colors">{settings.facebookText}</a></li>
                        <li className="whitespace-pre-line">เปิดบริการ: {settings.hours}</li>
                    </ul>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
