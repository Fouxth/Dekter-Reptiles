import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, Info, CheckCircle2, Loader2 } from 'lucide-react';
import SEO from '../components/SEO';
import { getSnakeById } from '../services/api';

const formatPrice = (price) => {
    return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 }).format(price);
};

const capitalize = (str) => {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const ProductDetail = ({ addToCart }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const data = await getSnakeById(id);
                setProduct(data);
            } catch (error) {
                console.error("Error fetching product details:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [id]);

    if (loading) return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <div className="flex flex-col items-center">
                <Loader2 className="animate-spin text-sky-500 mb-4" size={48} />
                <h3 className="text-xl font-bold text-stone-200">กำลังโหลดข้อมูลสินค้า...</h3>
            </div>
        </div>
    );

    if (!product) return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <div className="glass-dark p-12 text-center rounded-3xl border border-white/5 max-w-md w-full">
                <h2 className="text-2xl font-bold text-stone-200 mb-4">ไม่พบสินค้านี้</h2>
                <button onClick={() => navigate('/shop')} className="text-sky-500 font-semibold hover:text-sky-400">กลับสู่หน้าร้านค้า</button>
            </div>
        </div>
    );

    return (
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in relative">
            <SEO
                title={`${product.name} - ${product.species}`}
                description={`ขาย ${product.name} มอร์ฟ ${product.morph} ราคา ${product.price} บาท ร้าน Dexter Reptiles`}
            />

            <button
                onClick={() => navigate('/shop')}
                className="flex items-center text-stone-500 hover:text-sky-400 mb-6 transition-colors uppercase gap-2 tracking-widest text-[0.65rem] font-bold group w-max"
            >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> กลับไปหน้าร้านค้า
            </button>

            <article className="glass-dark rounded-[2.5rem] shadow-2xl border border-white/5 overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-0 relative">
                    <div className="absolute inset-y-0 left-1/2 w-px bg-white/5 hidden md:block"></div>
                    {/* Image Section */}
                    <div className="h-[400px] md:h-auto relative bg-stone-950 overflow-hidden group">
                        <img
                            src={product.image}
                            alt={`รูปภาพของงู ${product.name}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent opacity-80 md:hidden"></div>
                        {!(product.stock > 0) && (
                            <div className="absolute inset-0 bg-stone-950/80 backdrop-blur-md flex items-center justify-center z-10">
                                <span className="border border-sky-500/50 text-sky-500 px-6 py-2 rounded-full font-bold shadow-lg uppercase tracking-widest bg-sky-500/10">Sold Out</span>
                            </div>
                        )}
                    </div>

                    {/* Info Section */}
                    <div className="p-8 md:p-10 flex flex-col justify-center relative z-10">
                        <div className="uppercase tracking-[0.2em] text-sky-500 text-[0.6rem] font-bold mb-2.5 flex items-center gap-2 opacity-90">
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                            {capitalize(product.species)}
                        </div>
                        <h1 className="text-3xl md:text-4xl font-light text-stone-100 mb-1 leading-tight italic">
                            {product.name}
                        </h1>
                        <p className="text-stone-500 italic mb-6 font-serif text-md opacity-80">{product.scientificName}</p>

                        <div className="text-3xl font-bold text-sky-400 mb-6 tracking-tighter drop-shadow-[0_0_10px_rgba(14,165,233,0.2)]">
                            {formatPrice(product.price)}
                        </div>

                        <div className="prose prose-invert prose-stone mb-8 max-w-none text-stone-400 leading-relaxed font-light text-sm line-clamp-3">
                            <p>{product.description}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-y-5 gap-x-6 mb-8 glass bg-stone-900/30 p-6 rounded-[2rem] border border-white/5 shadow-inner">
                            <div>
                                <span className="block text-[0.6rem] uppercase tracking-widest text-stone-500 mb-1">มอร์ฟ (Morph)</span>
                                <span className="font-semibold text-stone-200 text-sm">{capitalize(product.morph) || "-"}</span>
                            </div>
                            <div>
                                <span className="block text-[0.6rem] uppercase tracking-widest text-stone-500 mb-1">เพศ (Gender)</span>
                                <span className="font-semibold text-stone-200 text-sm">{capitalize(product.gender) || "-"}</span>
                            </div>
                            <div>
                                <span className="block text-[0.6rem] uppercase tracking-widest text-stone-500 mb-1">อายุ (Year/DOB)</span>
                                <span className="font-semibold text-stone-200 text-sm">{product.year || "-"}</span>
                            </div>
                            <div>
                                <span className="block text-[0.6rem] uppercase tracking-widest text-stone-500 mb-1">อาหาร (Diet)</span>
                                <span className="font-semibold text-stone-200 text-sm">{product.feedSize || "-"}</span>
                            </div>
                            <div className="col-span-2 pt-3 border-t border-white/5">
                                <span className="block text-[0.6rem] uppercase tracking-widest text-stone-500 mb-1.5">Genetic Details</span>
                                <span className="inline-flex items-center gap-2 font-semibold text-stone-200 text-sm">
                                    <div className="w-5 h-5 rounded-full bg-sky-500/10 flex items-center justify-center border border-sky-500/30">
                                        <Info size={10} className="text-sky-500" />
                                    </div>
                                    {capitalize(product.genetics) || "ข้อมูลเพิ่มเติม ไม่มีระบุ"}
                                </span>
                            </div>
                        </div>

                        {product.stock > 0 ? (
                            <div className="flex items-center gap-2 text-cyan-400 text-sm font-bold mb-6">
                                <CheckCircle2 size={18} /> สินค้าพร้อมส่ง
                            </div>
                        ) : null}

                        <button
                            onClick={() => addToCart(product)}
                            disabled={!(product.stock > 0)}
                            className={`w-full py-4 rounded-xl font-bold text-md flex justify-center items-center gap-2.5 transition-all duration-300 uppercase tracking-widest active:scale-[0.98]
                ${product.stock > 0
                                    ? 'bg-sky-500 hover:bg-sky-400 text-stone-950 shadow-[0_0_15px_rgba(14,165,233,0.2)] hover:shadow-[0_0_30px_rgba(14,165,233,0.5)] transform hover:-translate-y-0.5'
                                    : 'bg-stone-900 border border-stone-800 text-stone-600 cursor-not-allowed'}`}
                        >
                            <ShoppingCart size={18} />
                            {product.stock > 0 ? 'เพิ่มลงตะกร้า' : 'สินค้าหมดชั่วคราว'}
                        </button>
                    </div>
                </div>
            </article>
        </main>
    );
};

export default ProductDetail;
