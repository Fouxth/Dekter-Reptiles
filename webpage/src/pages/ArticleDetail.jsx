import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import SEO from '../components/SEO';
import { MOCK_ARTICLES } from '../data/mockData';

const ArticleDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const article = MOCK_ARTICLES.find(a => a.id === id);

    if (!article) return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <div className="glass-dark p-12 text-center rounded-3xl border border-white/5 max-w-md w-full">
                <h2 className="text-2xl font-bold text-stone-200 mb-4">ไม่พบบทความนี้</h2>
                <button onClick={() => navigate('/articles')} className="text-sky-500 font-semibold hover:text-sky-400">กลับสู่หน้าบทความ</button>
            </div>
        </div>
    );

    return (
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-fade-in relative z-10">
            <SEO title={article.title} description={article.excerpt} image={article.image} url={`/article/${article.id}`} type="article" />

            <button
                onClick={() => navigate('/articles')}
                className="flex items-center text-stone-400 hover:text-sky-400 mb-8 transition-colors uppercase tracking-widest text-sm font-semibold group w-max"
            >
                <ArrowLeft size={18} className="mr-2 group-hover:-translate-x-1 transition-transform" /> กลับไปหน้าบทความ
            </button>

            <article className="glass-dark rounded-[2.5rem] shadow-2xl border border-white/5 overflow-hidden">
                <div className="h-72 md:h-[28rem] w-full relative group">
                    <div className="absolute inset-0 bg-stone-900/40 group-hover:bg-transparent transition-colors z-10"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent opacity-80 z-10"></div>
                    <img src={article.image} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 mx-blend-luminosity group-hover:mix-blend-normal" />
                    <div className="absolute top-8 left-8 bg-stone-950/80 backdrop-blur-md border border-white/10 text-sky-400 text-xs font-bold px-4 py-1.5 rounded-lg z-20 uppercase tracking-widest shadow-lg">
                        {article.category}
                    </div>
                </div>
                <div className="p-8 md:p-14 relative z-20 -mt-10 md:-mt-20">
                    <div className="glass bg-stone-950/80 rounded-3xl p-8 md:p-12 border border-white/10 relative">
                        <div className="text-sky-500 text-sm mb-4 font-bold uppercase tracking-widest">{article.date}</div>
                        <h1 className="text-3xl md:text-5xl font-light text-stone-100 mb-10 leading-tight">{article.title}</h1>
                        <div className="prose prose-invert prose-stone prose-lg max-w-none text-stone-400 leading-relaxed font-light whitespace-pre-line">
                            {article.content}
                        </div>
                    </div>
                </div>
            </article>
        </main>
    );
};

export default ArticleDetail;
