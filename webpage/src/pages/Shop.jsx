import React, { useState, useEffect, useMemo } from 'react';
import { Filter, Loader2 } from 'lucide-react';
import SEO from '../components/SEO';
import ProductCard from '../components/ProductCard';
import { getSnakes, getCategories } from '../services/api';



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

        // Filter by Category
        if (filter !== 'All') {
            result = result.filter(p => p.categoryId === filter);
        }

        // Filter by Search Query
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            result = result.filter(p =>
                (p.name && p.name.toLowerCase().includes(lowerQuery)) ||
                (p.morph && p.morph.toLowerCase().includes(lowerQuery)) ||
                (p.species && p.species.toLowerCase().includes(lowerQuery)) ||
                (categories.find(c => c.id === p.categoryId)?.name?.toLowerCase().includes(lowerQuery))
            );
        }

        return result;
    }, [filter, searchQuery, products, categories]);

    // Extract categories that actually have available products
    const availableCategories = useMemo(() => {
        const activeIds = new Set(products.map(p => p.categoryId));
        // We want snakes to appear first. Let's try to identify snake categories vs others
        // We'll prioritize Categories whose name contains 'งู', 'Python', 'Snake', 'Hognose'
        // or prioritize known typical IDs if they had been fixed. But based on text:
        const isSnakeCategory = (name) => {
            const lowerName = name?.toLowerCase() || '';
            return lowerName.includes('งู') || lowerName.includes('python') || lowerName.includes('snake') || lowerName.includes('hognose') || lowerName.includes('boa');
        };

        const activeCategories = categories.filter(c => activeIds.has(c.id));

        // Sort active categories: Snakes first, then alphabetically
        activeCategories.sort((a, b) => {
            const aIsSnake = isSnakeCategory(a.name);
            const bIsSnake = isSnakeCategory(b.name);
            if (aIsSnake && !bIsSnake) return -1;
            if (!aIsSnake && bIsSnake) return 1;
            return a.name.localeCompare(b.name);
        });

        return [
            { id: 'All', name: 'ดูสินค้าทั้งหมด' },
            ...activeCategories
        ];
    }, [products, categories]);

    return (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in min-h-[80vh]">
            <SEO
                title="เลือกซื้องู"
                description="เลือกซื้องู Ball Python, Corn Snake, Hognose หลากหลายมอร์ฟ อัปเดตสต๊อกล่าสุดพร้อมราคาที่ชัดเจน"
            />

            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                <div>
                    <div className="text-sky-500 font-bold tracking-widest uppercase text-sm mb-2">Available Products</div>
                    <h1 className="text-4xl font-light text-stone-100">เลือกชม<span className="font-bold">สินค้า</span></h1>
                    <p className="text-stone-400 mt-2">พบกับงูสวยงามกว่า {loading ? '...' : products.length} รายการ</p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto relative group">
                    <Filter size={20} className="text-sky-500 absolute left-4 pointer-events-none z-10" />
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="appearance-none bg-stone-900/50 text-stone-300 font-bold tracking-wide border border-white/5 hover:border-sky-500/30 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-full pl-12 pr-12 py-3 w-full md:w-64 transition-all shadow-lg cursor-pointer outline-none"
                    >
                        {availableCategories.map(category => (
                            <option key={category.id} value={category.id} className="bg-stone-900 text-stone-300">
                                {category.name}
                            </option>
                        ))}
                    </select>
                    <div className="absolute right-4 pointer-events-none text-stone-500 group-hover:text-sky-400 transition-colors">
                        <span className="text-xs">▼</span>
                    </div>
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
