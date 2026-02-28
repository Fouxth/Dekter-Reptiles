import React, { useState, useEffect } from 'react';
import { ChevronRight, ShieldCheck, Truck, HeartHandshake, Mail, Phone, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import ProductCard from '../components/ProductCard';
import TikTokSection from '../components/TikTokSection';
import { getSnakes, getSystemSettings } from '../services/api';
import { MOCK_ARTICLES } from '../data/mockData';

const Home = ({ addToCart }) => {
    const navigate = useNavigate();
    const [featuredSnakes, setFeaturedSnakes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [contactPhone, setContactPhone] = useState('080-123-4567');

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch all items for sale
                const data = await getSnakes({ forSale: true });

                // Helper to check if a product is a snake
                const isSnake = (product) => {
                    const species = product.species?.toLowerCase();
                    if (species === 'equipment') return false;
                    if (species) return true;
                    const catName = product?.category?.name?.toLowerCase() || '';
                    return catName.includes('งู') || catName.includes('python') || catName.includes('snake') || catName.includes('hognose') || catName.includes('boa') || catName.includes('ball python');
                };

                // Filter to only snakes, then sort by price (highest first)
                const snakeProducts = data.filter(isSnake);
                snakeProducts.sort((a, b) => b.price - a.price);

                // Set top 4 most expensive snakes
                setFeaturedSnakes(snakeProducts.slice(0, 4));

                // Fetch system settings for contact phone
                const settingsInfo = await getSystemSettings();
                const phoneSettingValue = settingsInfo['contact_phone'];
                if (phoneSettingValue) {
                    setContactPhone(phoneSettingValue);
                }
            } catch (error) {
                console.error("Failed to load home data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return (
        <main className="animate-fade-in">
            <SEO
                title="หน้าแรก"
                description="ยินดีต้อนรับสู่ Dexter Reptiles ศูนย์รวมงูเลี้ยงสวยงาม Ball Python, Corn Snake ที่ใหญ่ที่สุด พร้อมจัดส่งทั่วประเทศ"
            />

            {/* Hero Section */}
            <section className="relative bg-stone-950 text-stone-200 lg:h-screen lg:min-h-[800px] flex items-center pt-24 lg:pt-0 overflow-hidden">
                {/* Full Screen Background Image */}
                <div className="absolute inset-0 w-full h-full z-0">
                    <div className="absolute inset-0 bg-stone-950/60 lg:bg-stone-950/40 z-10"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-950/80 to-transparent z-10 w-full lg:w-3/4"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-stone-950/30 z-10"></div>
                    <img
                        src="/hero-bg.png"
                        alt="งูหลามบอลพรีเมียม"
                        className="w-full h-full object-cover object-center lg:object-[center_20%] opacity-80"
                        loading="eager"
                    />
                </div>

                <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-20 lg:py-0">
                    <div className="w-full lg:w-2/3">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-sky-500/30 bg-stone-950/80 backdrop-blur-md text-sky-400 text-xs uppercase tracking-widest font-bold mb-8 shadow-lg shadow-sky-500/5">
                            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
                            Ball Python/Exotic pet
                        </div>
                        <h1 className="text-4xl sm:text-6xl xl:text-7xl font-light tracking-tight mb-8 leading-[1.2] drop-shadow-lg">
                            เจองูเปรต<br />
                            <span className="font-bold text-gradient pb-2 block mt-2 drop-shadow-md">ที่ถูกใจหรือยังคะ</span>
                        </h1>
                        <p className="text-lg md:text-xl text-stone-200 mb-10 max-w-xl font-light leading-relaxed drop-shadow-md">
                            อยากได้น้องงูสีไหนหรือตามหา Morph ไหนอยู่
                            สามารถแจ้งทางร้านได้เลยค่ะ ยินดีให้คำปรึกษาเกี่ยวกับน้องงูตลอด 24 ชม. ค่ะ
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={() => navigate('/shop')}
                                className="bg-sky-500 hover:bg-sky-400 text-stone-950 font-bold uppercase tracking-widest text-sm py-4 px-8 rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(14,165,233,0.3)] hover:shadow-[0_0_30px_rgba(14,165,233,0.5)] transform hover:-translate-y-1 w-full sm:w-auto"
                            >
                                เลือกชมงูทั้งหมด <ChevronRight size={18} />
                            </button>
                            <button
                                onClick={() => navigate('/articles')}
                                className="bg-stone-950/50 backdrop-blur-md hover:bg-stone-900/80 text-stone-200 font-bold uppercase tracking-widest text-sm py-4 px-8 rounded-xl transition-all flex items-center justify-center gap-2 border border-white/20 hover:border-white/40 w-full sm:w-auto mt-2 sm:mt-0 shadow-lg"
                            >
                                วิธีการเลี้ยงเบื้องต้น
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="bg-stone-950 py-20 border-b border-white/5 relative">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-stone-900 via-stone-950 to-stone-950 opacity-50"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="glass-dark flex flex-col items-center text-center p-8 rounded-3xl hover:border-sky-500/30 transition-colors group">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500/20 to-cyan-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <ShieldCheck className="w-8 h-8 text-sky-400" />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-stone-100">รับประกันสุขภาพ</h3>
                            <p className="text-stone-400 leading-relaxed">งูทุกตัวผ่านการตรวจสุขภาพ ถ่ายพยาธิ และฝึกกินอาหารเรียบร้อยแล้ว แข็งแรง 100%</p>
                        </div>
                        <div className="glass-dark flex flex-col items-center text-center p-8 rounded-3xl hover:border-sky-500/30 transition-colors group">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500/20 to-cyan-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Truck className="w-8 h-8 text-sky-400" />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-stone-100">จัดส่งปลอดภัย</h3>
                            <p className="text-stone-400 leading-relaxed">แพ็คสินค้าอย่างระมัดระวัง จัดส่งด่วนพิเศษถึงหน้าบ้านคุณอย่างปลอดภัย มีรับประกันระหว่างส่ง</p>
                        </div>
                        <div className="glass-dark flex flex-col items-center text-center p-8 rounded-3xl hover:border-sky-500/30 transition-colors group">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500/20 to-cyan-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <HeartHandshake className="w-8 h-8 text-sky-400" />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-stone-100">ให้คำปรึกษาตลอดชีพ</h3>
                            <p className="text-stone-400 leading-relaxed">ทีมงานพร้อมดูแลและให้คำแนะนำการเลี้ยงตั้งแต่เริ่มต้นจนเป็นมือโปร ปรึกษาได้ตลอด 24 ชม.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Products */}
            <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                <div className="flex justify-between items-end mb-12">
                    <div>
                        <div className="text-sky-500 font-bold tracking-widest uppercase text-sm mb-2">24/7 Reptiles</div>
                        <h2 className="text-4xl font-light text-stone-100 mb-2">งูแนะนำ<span className="font-bold">คัดพิเศษ</span></h2>
                        <p className="text-stone-400">คัดสรรเฉพาะตัวที่สวยและโดดเด่นที่สุด</p>
                    </div>
                    <button onClick={() => navigate('/shop')} className="hidden md:flex text-sky-400 font-medium hover:text-sky-300 items-center gap-1 uppercase tracking-wider text-sm transition-colors cursor-pointer group pb-2 border-b border-transparent hover:border-sky-400">
                        ดูคอลเลกชันทั้งหมด <ArrowUpRight size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {loading ? (
                        [...Array(4)].map((_, i) => (
                            <div key={i} className="glass-card rounded-3xl h-[420px] animate-pulse">
                                <div className="h-[280px] bg-white/5 w-full rounded-t-3xl"></div>
                                <div className="p-6">
                                    <div className="h-4 bg-white/10 rounded w-1/3 mb-4"></div>
                                    <div className="h-6 bg-white/10 rounded w-3/4 mb-4"></div>
                                    <div className="h-5 bg-white/10 rounded w-1/2"></div>
                                </div>
                            </div>
                        ))
                    ) : (
                        featuredSnakes.length > 0 ? (
                            featuredSnakes.slice(0, 4).map(product => (
                                <ProductCard key={product.id} product={product} addToCart={addToCart} />
                            ))
                        ) : (
                            <div className="col-span-full text-center py-12 text-stone-500">ยังไม่มีรายการงูมาใหม่ในขณะนี้</div>
                        )
                    )}
                </div>
                <button
                    onClick={() => navigate('/shop')}
                    className="md:hidden w-full mt-10 glass-dark border-sky-500/30 text-sky-400 font-bold tracking-widest py-4 rounded-full flex justify-center items-center gap-2"
                >
                    ดูคอลเลกชันทั้งหมด <ChevronRight size={18} />
                </button>
            </section>

            {/* TikTok Section */}
            <TikTokSection />

            {/* Latest Articles Section */}
            <section className="py-24 bg-stone-900 relative">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-end mb-12">
                        <div>
                            <div className="text-sky-500 font-bold tracking-widest uppercase text-sm mb-2">Knowledge Base</div>
                            <h2 className="text-4xl font-light text-stone-100 mb-2">เกร็ดความรู้ & <span className="font-bold">วิธีเลี้ยง</span></h2>
                            <p className="text-stone-400">คู่มือการดูแลฉบับสมบูรณ์จากผู้เชี่ยวชาญ</p>
                        </div>
                        <button onClick={() => navigate('/articles')} className="hidden md:flex text-sky-400 font-medium hover:text-sky-300 items-center gap-1 uppercase tracking-wider text-sm transition-colors cursor-pointer group pb-2 border-b border-transparent hover:border-sky-400">
                            ดูบทความทั้งหมด <ArrowUpRight size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {MOCK_ARTICLES.slice(0, 3).map(article => (
                            <article key={article.id} className="glass-card rounded-3xl overflow-hidden hover:border-sky-500/30 transition-all duration-300 flex flex-col cursor-pointer group hover:-translate-y-2" onClick={() => navigate(`/article/${article.id}`)}>
                                <div className="h-56 overflow-hidden relative">
                                    <div className="absolute inset-0 bg-stone-900/40 group-hover:bg-transparent transition-colors z-10"></div>
                                    <img src={article.image} alt={article.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100 mix-blend-luminosity group-hover:mix-blend-normal" />
                                    <span className="absolute top-4 left-4 bg-stone-950/80 backdrop-blur-md border border-white/10 text-sky-400 text-xs font-bold px-3 py-1 rounded-lg z-20 uppercase tracking-widest">
                                        {article.category}
                                    </span>
                                </div>
                                <div className="p-8 flex flex-col flex-1">
                                    <span className="text-stone-500 text-sm mb-3 font-medium uppercase tracking-wider">{article.date}</span>
                                    <h3 className="text-2xl font-bold text-stone-100 mb-3 line-clamp-2 group-hover:text-sky-400 transition-colors">{article.title}</h3>
                                    <p className="text-stone-400 text-sm mb-6 line-clamp-3 flex-1 leading-relaxed">{article.excerpt}</p>
                                    <div className="flex items-center gap-2 text-sky-500 font-bold uppercase tracking-wider text-sm mt-auto group-hover:text-sky-400">
                                        อ่านเพิ่มเติม <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                    <button
                        onClick={() => navigate('/articles')}
                        className="md:hidden w-full mt-10 glass-dark border-sky-500/30 text-sky-400 font-bold tracking-widest py-4 rounded-full flex justify-center items-center gap-2"
                    >
                        ดูบทความทั้งหมด <ChevronRight size={18} />
                    </button>
                </div>
            </section>

            {/* Contact CTA Section */}
            <section className="py-32 relative overflow-hidden">
                <div className="absolute inset-0 bg-stone-950 z-0"></div>
                <div className="absolute inset-0 z-0 opacity-40 mix-blend-luminosity">
                    <img
                        src="/contact-bg.png"
                        alt="Contact Background"
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/60 to-transparent z-10"></div>

                <div className="relative z-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center bg-stone-950/40 backdrop-blur-md p-12 md:p-20 rounded-[3rem] border border-white/10 shadow-2xl">
                    <h2 className="text-4xl md:text-5xl font-light mb-6 text-stone-100">มีข้อสงสัยเกี่ยวกับการ<span className="font-bold">เลี้ยงงู?</span></h2>
                    <p className="text-lg text-stone-400 mb-10 max-w-2xl mx-auto font-light leading-relaxed">
                        ไม่ว่าคุณจะเป็นมือใหม่หรือผู้เชี่ยวชาญ ทีมงาน Dexter Reptilesพร้อมให้คำปรึกษา แนะนำการเลือกงูที่เหมาะกับไลฟ์สไตล์ของคุณ และวิธีดูแลอย่างถูกต้อง
                    </p>
                    <div className="flex flex-col sm:flex-row gap-6 justify-center">
                        <button
                            onClick={() => navigate('/contact')}
                            className="bg-sky-500 hover:bg-sky-400 text-stone-950 font-bold tracking-widest uppercase py-4 px-10 rounded-full transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(14,165,233,0.3)] hover:shadow-[0_0_30px_rgba(14,165,233,0.5)] transform hover:-translate-y-1"
                        >
                            <Mail size={20} /> ติดต่อสอบถามเรา
                        </button>
                        <a href={`tel:${contactPhone.replace(/[^0-9+]/g, '')}`} className="glass hover:bg-white/10 text-stone-200 font-bold tracking-widest uppercase py-4 px-10 rounded-full transition-all flex items-center justify-center gap-3 border border-white/20">
                            <Phone size={20} /> {contactPhone}
                        </a>
                    </div>
                </div>
            </section>
        </main>
    );
};

export default Home;
