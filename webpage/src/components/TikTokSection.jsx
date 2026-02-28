import React, { useEffect, useState } from 'react';
import { ExternalLink, Play, Facebook, Instagram, Youtube } from 'lucide-react';
import { getSystemSettings } from '../services/api';

const TikTokSection = () => {
    const [videos, setVideos] = useState([]);
    const [socialLinks, setSocialLinks] = useState({
        fb: [],
        ig: [],
        yt: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const settings = await getSystemSettings();

                // TikTok URLs
                const tiktokSettingValue = settings['tiktok_urls'];
                if (tiktokSettingValue) {
                    try {
                        const urls = JSON.parse(tiktokSettingValue);
                        if (Array.isArray(urls)) {
                            setVideos(urls);
                        }
                    } catch {
                        if (tiktokSettingValue.startsWith('http')) setVideos([tiktokSettingValue]);
                    }
                }

                // Other Social Links
                const parseSocial = (key) => {
                    const value = settings[key];
                    if (!value) return [];
                    try {
                        const parsed = JSON.parse(value);
                        return Array.isArray(parsed) ? parsed : [value];
                    } catch {
                        return value.startsWith('http') || value.length > 3 ? [value] : [];
                    }
                };

                setSocialLinks({
                    fb: parseSocial('social_fb'),
                    ig: parseSocial('social_ig'),
                    yt: parseSocial('social_yt')
                });

            } catch (error) {
                console.error("Failed to fetch social settings:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    if (!loading && videos.length === 0 && socialLinks.fb.length === 0 && socialLinks.ig.length === 0 && socialLinks.yt.length === 0) return null;

    // eslint-disable-next-line no-unused-vars
    const SocialButton = ({ href, icon: Icon, label, colorClass }) => {
        if (!href) return null;
        return (
            <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-stone-300 hover:text-white transition-all transform hover:-translate-y-1 hover:border-white/20 group`}
            >
                <div className={`p-2 rounded-xl transition-colors ${colorClass}`}>
                    <Icon size={20} />
                </div>
                <span className="font-bold uppercase tracking-widest text-xs prose-sm line-clamp-1 max-w-[150px]">{label}</span>
            </a>
        );
    };

    return (
        <section className="py-24 bg-stone-950 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-sky-500/5 via-stone-950 to-stone-950 opacity-40"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center mb-16">
                    <div className="text-sky-500 font-bold tracking-widest uppercase text-sm mb-2 flex items-center justify-center gap-2">
                        <Play size={14} fill="currentColor" /> Dexter Reptiles Social
                    </div>
                    <h2 className="text-4xl md:text-5xl font-light text-stone-100 mb-4 text-balance">ติดตามความเคลื่อนไหว<span className="font-bold">หน้าฟาร์ม</span></h2>
                    <p className="text-stone-400 max-w-2xl mx-auto">อัปเดตเทคนิคการเลี้ยงและบรรยากาศในฟาร์มผ่านโซเชียลมีเดียของเรา</p>

                    {/* Social Icons Row */}
                    <div className="flex flex-wrap justify-center gap-4 mt-8">
                        {socialLinks.fb.map((url, i) => (
                            <SocialButton key={`fb-${i}`} href={url} icon={Facebook} label={socialLinks.fb.length > 1 ? `Facebook ${i + 1}` : "Facebook"} colorClass="group-hover:bg-blue-600/20 group-hover:text-blue-500" />
                        ))}
                        {socialLinks.ig.map((url, i) => (
                            <SocialButton key={`ig-${i}`} href={url} icon={Instagram} label={socialLinks.ig.length > 1 ? `Instagram ${i + 1}` : "Instagram"} colorClass="group-hover:bg-pink-600/20 group-hover:text-pink-500" />
                        ))}
                        {socialLinks.yt.map((url, i) => (
                            <SocialButton key={`yt-${i}`} href={url} icon={Youtube} label={socialLinks.yt.length > 1 ? `YouTube ${i + 1}` : "YouTube Channel"} colorClass="group-hover:bg-red-600/20 group-hover:text-red-500" />
                        ))}
                    </div>
                </div>

                {videos.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {loading ? (
                            [...Array(4)].map((_, i) => (
                                <div key={i} className="aspect-[9/16] bg-white/5 rounded-3xl animate-pulse border border-white/5"></div>
                            ))
                        ) : (
                            videos.map((url, index) => {
                                const videoId = url.split('/video/')[1]?.split('?')[0];
                                return (
                                    <div key={index} className="group relative">
                                        {/* Container with overflow: hidden to clip the social sidebar */}
                                        <div className="rounded-3xl overflow-hidden glass-card border-white/10 hover:border-sky-500/30 transition-all duration-500 shadow-2xl bg-black aspect-[9/16] relative">
                                            {videoId ? (
                                                <div className="absolute inset-0 w-full h-full overflow-hidden flex items-center justify-center bg-black">
                                                    <iframe
                                                        // Using player/v1 to prevent scrolling to next videos and related videos grid
                                                        src={`https://www.tiktok.com/player/v1/${videoId}?&music_info=0&description=0&autoplay=0&loop=1&rel=0`}
                                                        className="w-full h-full"
                                                        style={{
                                                            border: 'none',
                                                            transform: 'scale(1.05)', // Uniformly scale slightly to eliminate letterboxing/black bars
                                                            transformOrigin: 'center center'
                                                        }}
                                                        scrolling="no"
                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                                        allowFullScreen
                                                        title={`TikTok Video ${index}`}
                                                        loading="lazy"
                                                    ></iframe>

                                                    {/* Invisible overlays to capture scrolling attempts on the top and bottom edges while keeping center playable */}
                                                    <div className="absolute top-0 left-0 w-full h-[15%] z-10" onWheel={(e) => e.stopPropagation()} onTouchMove={(e) => e.stopPropagation()}></div>
                                                    <div className="absolute bottom-0 left-0 w-full h-[15%] z-10" onWheel={(e) => e.stopPropagation()} onTouchMove={(e) => e.stopPropagation()}></div>
                                                </div>
                                            ) : (
                                                <div className="aspect-[9/16] flex flex-col items-center justify-center gap-4 p-8 text-center bg-stone-900/50 h-full w-full">
                                                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
                                                        <Play size={32} className="text-stone-700" />
                                                    </div>
                                                    <p className="text-sm text-stone-400">Unable to load video</p>
                                                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-sky-400 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2 px-4 py-2 rounded-full border border-sky-500/30 hover:bg-sky-500/10 transition-all">
                                                        เปิดใน TikTok <ExternalLink size={12} />
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>
        </section>
    );
};

export default TikTokSection;
