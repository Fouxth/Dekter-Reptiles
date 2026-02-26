import React, { useState, useEffect, useMemo } from 'react';
import { Filter, Loader2 } from 'lucide-react';
import SEO from '../components/SEO';
import ProductCard from '../components/ProductCard';
import { getSnakes, getCategories } from '../services/api';

const capitalize = (str) => {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const Shop = ({ searchQuery, addToCart }) => {
    const [filter, setFilter] = useState('All');
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchShopData = async () => {
            setLoading(true);
            try {
                // Fetch only snakes marked for sale
                const [snakesData, categoriesData] = await Promise.all([
                    getSnakes({ forSale: true }),
                    getCategories()
                ]);
                setProducts(snakesData);
                setCategories(categoriesData);
            } catch (error) {
                console.error("Error fetching shop data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchShopData();
    }, []);

    const filteredProducts = useMemo(() => {
        let result = products;

        // Filter by Species
        if (filter !== 'All') {
            result = result.filter(p => p.species === filter);
        }

        // Filter by Search Query
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            result = result.filter(p =>
                (p.name && p.name.toLowerCase().includes(lowerQuery)) ||
                (p.morph && p.morph.toLowerCase().includes(lowerQuery)) ||
                (p.species && p.species.toLowerCase().includes(lowerQuery))
            );
        }

        return result;
    }, [filter, searchQuery, products]);

    // Extract unique species specifically from available categories or products
    const availableSpecies = useMemo(() => {
        const speciesSet = new Set(products.map(p => p.species).filter(Boolean));
        return ['All', ...Array.from(speciesSet)];
    }, [products]);

    return (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in min-h-[80vh]">
            <SEO
                title="เลือกซื้องู"
                description="เลือกซื้องู Ball Python, Corn Snake, Hognose หลากหลายมอร์ฟ อัปเดตสต๊อกล่าสุดพร้อมราคาที่ชัดเจน"
            />

            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                <div>
                    <div className="text-sky-500 font-bold tracking-widest uppercase text-sm mb-2">Available Snakes</div>
                    <h1 className="text-4xl font-light text-stone-100">เลือกชม<span className="font-bold">สินค้า</span></h1>
                    <p className="text-stone-400 mt-2">พบกับงูสวยงามกว่า {loading ? '...' : products.length} รายการ</p>
                </div>

                <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0 hide-scrollbar scroll-smooth">
                    <Filter size={20} className="text-sky-500 mr-2 flex-shrink-0" />
                    {availableSpecies.map(species => (
                        <button
                            key={species}
                            onClick={() => setFilter(species)}
                            className={`whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-bold tracking-wide uppercase transition-all duration-300 border ${filter === species
                                ? 'bg-sky-500/10 text-sky-400 border-sky-500/50 shadow-[0_0_15px_rgba(14,165,233,0.2)]'
                                : 'bg-stone-900/50 text-stone-400 border-white/5 hover:border-sky-500/30 hover:text-stone-200'
                                }`}
                        >
                            {species === 'All' ? 'ทั้งหมด' : capitalize(species)}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 glass-dark rounded-3xl border border-white/5 mt-8">
                    <Loader2 className="animate-spin text-sky-500 mb-4" size={48} />
                    <h3 className="text-xl font-bold text-stone-200">กำลังโหลดข้อมูลสินค้า...</h3>
                </div>
            ) : filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filteredProducts.map(product => (
                        <ProductCard key={product.id} product={product} addToCart={addToCart} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-32 glass-dark rounded-3xl border border-white/5 mt-8">
                    <div className="w-20 h-20 bg-stone-900 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5">
                        <Filter className="text-stone-500" size={32} />
                    </div>
                    <h3 className="text-2xl font-bold text-stone-200 mb-2">ไม่พบสินค้าในหมวดหมู่นี้</h3>
                    <p className="text-stone-500">ลองเปลี่ยนหมวดหมู่หรือคำค้นหาของคุณดูอีกครั้ง</p>
                </div>
            )}
        </main>
    );
};

export default Shop;
