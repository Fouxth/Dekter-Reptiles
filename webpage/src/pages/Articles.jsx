import React from 'react';
import { BookOpen, ChevronRight, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import { MOCK_ARTICLES } from '../data/mockData';

const Articles = () => {
    const navigate = useNavigate();

    return (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-fade-in min-h-[80vh]">
            <SEO title="บทความและวิธีเลี้ยง" description="แหล่งรวมความรู้ วิธีการเลี้ยงงู Ball Python, Corn Snake และการดูแลสัตว์เลื้อยคลานเบื้องต้น" url="/articles" />

            <div className="text-center mb-16">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-sky-500/30 bg-sky-500/10 text-sky-400 text-xs uppercase tracking-widest font-semibold mb-4">
                    <BookOpen size={14} /> Knowledge Base
                </div>
                <h1 className="text-4xl md:text-5xl font-light text-stone-100 mb-4">
                    บทความและ<span className="font-bold">วิธีเลี้ยง</span>
                </h1>
                <p className="text-stone-400 max-w-2xl mx-auto font-light leading-relaxed">รวบรวมความรู้ เคล็ดลับ และวิธีการดูแลเพื่อนร่วมโลกตัวน้อยของคุณจากประสบการณ์ของผู้เชี่ยวชาญ</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {MOCK_ARTICLES.map(article => (
                    <article key={article.id} className="glass-card rounded-3xl overflow-hidden hover:border-sky-500/30 transition-all duration-300 flex flex-col cursor-pointer group hover:-translate-y-2" onClick={() => navigate(`/article/${article.id}`)}>
                        <div className="h-56 overflow-hidden relative">
                            <div className="absolute inset-0 bg-stone-900/40 group-hover:bg-transparent transition-colors z-10"></div>
                            <img src={article.image} alt={article.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100 mix-blend-luminosity group-hover:mix-blend-normal" />
                            <span className="absolute top-4 left-4 bg-stone-950/80 backdrop-blur-md border border-white/10 text-sky-400 text-xs font-bold px-3 py-1 rounded-lg z-20 uppercase tracking-widest shadow-lg">
                                {article.category}
                            </span>
                        </div>
                        <div className="p-8 flex flex-col flex-1">
                            <span className="text-stone-500 text-sm mb-3 font-medium uppercase tracking-wider">{article.date}</span>
                            <h3 className="text-2xl font-bold text-stone-100 mb-3 line-clamp-2 group-hover:text-sky-400 transition-colors">{article.title}</h3>
                            <p className="text-stone-400 text-sm mb-6 line-clamp-3 flex-1 leading-relaxed">{article.excerpt}</p>
                            <div className="flex items-center gap-2 text-sky-500 font-bold uppercase tracking-wider text-sm mt-auto group-hover:text-sky-400">
                                อ่านเพิ่มเติม <ArrowUpRight size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            </div>
                        </div>
                    </article>
                ))}
            </div>
        </main>
    );
};

export default Articles;
