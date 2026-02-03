import { useState, useEffect } from 'react';
import {
    Search,
    ShoppingCart,
    Plus,
    Minus,
    Trash2,
    CreditCard,
    Banknote,
    QrCode,
    X,
    Check,
    ChevronDown
} from 'lucide-react';

export default function POS() {
    const [snakes, setSnakes] = useState([]);
    const [categories, setCategories] = useState([]);
    const [cart, setCart] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showCheckout, setShowCheckout] = useState(false);
    const [showMobileCart, setShowMobileCart] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [processing, setProcessing] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [snakesRes, categoriesRes] = await Promise.all([
                fetch('/api/snakes'),
                fetch('/api/categories')
            ]);

            if (snakesRes.ok && categoriesRes.ok) {
                setSnakes(await snakesRes.json());
                setCategories(await categoriesRes.json());
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('th-TH', {
            style: 'currency',
            currency: 'THB'
        }).format(amount);
    };

    const filteredSnakes = snakes.filter(snake => {
        const matchesSearch = snake.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            snake.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = !selectedCategory || snake.categoryId === selectedCategory;
        return matchesSearch && matchesCategory && snake.stock > 0;
    });

    const addToCart = (snake) => {
        const existing = cart.find(item => item.id === snake.id);
        if (existing) {
            if (existing.quantity < snake.stock) {
                setCart(cart.map(item =>
                    item.id === snake.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                ));
            }
        } else {
            setCart([...cart, { ...snake, quantity: 1 }]);
        }
    };

    const updateQuantity = (id, delta) => {
        setCart(cart.map(item => {
            if (item.id === id) {
                const newQty = item.quantity + delta;
                const snake = snakes.find(s => s.id === id);
                if (newQty > 0 && newQty <= snake.stock) {
                    return { ...item, quantity: newQty };
                }
            }
            return item;
        }).filter(item => item.quantity > 0));
    };

    const removeFromCart = (id) => {
        setCart(cart.filter(item => item.id !== id));
    };

    const clearCart = () => {
        setCart([]);
    };

    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    const handleCheckout = async () => {
        if (cart.length === 0) return;

        setProcessing(true);
        try {
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: cart.map(item => ({
                        snakeId: item.id,
                        quantity: item.quantity
                    })),
                    paymentMethod
                })
            });

            if (response.ok) {
                const order = await response.json();
                setOrderSuccess(order);
                setCart([]);
                fetchData(); // Refresh stock
                setTimeout(() => {
                    setOrderSuccess(null);
                    setShowCheckout(false);
                    setShowMobileCart(false);
                }, 3000);
            } else {
                const error = await response.json();
                alert(error.error || 'เกิดข้อผิดพลาด');
            }
        } catch (error) {
            console.error('Checkout failed:', error);
            alert('ไม่สามารถทำรายการได้');
        } finally {
            setProcessing(false);
        }
    };

    // Cart Content Component (shared between desktop and mobile)
    const CartContent = ({ isMobile = false }) => (
        <>
            {/* Cart Header */}
            <div className={`p-4 ${isMobile ? 'p-5' : 'p-5'} border-b border-white/5 bg-slate-900/50 backdrop-blur-xl ${isMobile ? 'flex items-center justify-between' : ''}`}>
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-emerald-500/10 p-2 rounded-lg ring-1 ring-emerald-500/20">
                            <ShoppingCart size={20} className="text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="font-bold text-white text-base">ตะกร้าสินค้า</h2>
                            <p className="text-xs text-slate-400 font-medium">{cartCount} รายการ</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {cart.length > 0 && (
                            <button
                                onClick={clearCart}
                                className="text-red-400 hover:text-red-300 text-xs hover:bg-red-500/10 px-2 py-1 rounded transition-colors"
                            >
                                ล้าง
                            </button>
                        )}
                        {isMobile && (
                            <button
                                onClick={() => setShowMobileCart(false)}
                                className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 hover:text-white ml-2"
                            >
                                <X size={18} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Cart Items */}
            <div className={`flex-1 overflow-y-auto p-3 space-y-2 bg-slate-900/20 custom-scrollbar ${isMobile ? 'max-h-[40vh]' : ''}`}>
                {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-slate-500 opacity-60">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-slate-800/50 rounded-full flex items-center justify-center mb-4 border border-white/5 border-dashed">
                            <ShoppingCart size={32} className="opacity-50" />
                        </div>
                        <p className="text-sm font-medium">ยังไม่มีสินค้าในตะกร้า</p>
                        <p className="text-xs mt-1">เลือกสินค้าจากรายการ{isMobile ? 'ด้านบน' : 'ทางซ้ายมือ'}</p>
                    </div>
                ) : (
                    cart.map(item => (
                        <div key={item.id} className="bg-slate-800/40 border border-white/5 p-2.5 sm:p-3 rounded-xl animate-slide-in hover:border-white/10 transition-colors group">
                            <div className="flex gap-3">
                                {/* Thumbnail */}
                                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-slate-700 overflow-hidden flex-shrink-0 relative">
                                    {item.image ? (
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-lg">🐍</div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                                    <div>
                                        <h4 className="font-medium text-white text-sm truncate">{item.name}</h4>
                                        <p className="text-emerald-400 font-bold text-xs">{formatCurrency(item.price)}</p>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        {/* Quantity Controls */}
                                        <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-900/50 rounded-lg p-0.5">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, -1); }}
                                                className="w-6 h-6 sm:w-5 sm:h-5 rounded bg-slate-700 flex items-center justify-center hover:bg-slate-600 text-white transition-colors"
                                            >
                                                <Minus size={12} />
                                            </button>
                                            <span className="w-6 text-center text-white font-medium text-xs">{item.quantity}</span>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, 1); }}
                                                className="w-6 h-6 sm:w-5 sm:h-5 rounded bg-slate-700 flex items-center justify-center hover:bg-slate-600 text-white transition-colors"
                                            >
                                                <Plus size={12} />
                                            </button>
                                        </div>

                                        {/* Total */}
                                        <span className="text-white font-semibold text-xs ml-auto mr-2 sm:mr-3">
                                            {formatCurrency(item.price * item.quantity)}
                                        </span>

                                        <button
                                            onClick={(e) => { e.stopPropagation(); removeFromCart(item.id); }}
                                            className="text-slate-500 hover:text-red-400 transition-colors p-1"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Cart Footer */}
            <div className="p-4 border-t border-white/5 bg-slate-900/80 backdrop-blur-xl space-y-3">
                <div className="flex justify-between text-base items-end">
                    <span className="text-slate-400 text-sm">ยอดรวมทั้งสิ้น</span>
                    <div className="text-right">
                        <span className="font-bold text-white text-xl sm:text-2xl tracking-tight text-gradient">{formatCurrency(cartTotal)}</span>
                        <p className="text-[10px] text-slate-500">รวมภาษีมูลค่าเพิ่มแล้ว</p>
                    </div>
                </div>

                <button
                    onClick={() => setShowCheckout(true)}
                    disabled={cart.length === 0}
                    className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed h-12 text-base shadow-lg shadow-emerald-500/20 group relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    <CreditCard size={20} />
                    ชำระเงิน
                </button>
            </div>
        </>
    );

    return (
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 h-full lg:h-[calc(100vh-2rem)] animate-fade-in">
            {/* Products Section */}
            <div className="flex-1 flex flex-col min-w-0 min-h-0">
                {/* Header */}
                <div className="glass-card p-4 sm:p-5 mb-4 sm:mb-5 flex flex-col gap-3 sm:gap-4">
                    <div className="flex gap-3 items-center">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="ค้นหาสินค้า..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="input-field pl-10"
                            />
                        </div>
                    </div>

                    {/* Categories */}
                    <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar -mx-1 px-1">
                        <button
                            onClick={() => setSelectedCategory(null)}
                            className={`px-3 py-2 sm:py-1.5 rounded-lg text-sm whitespace-nowrap transition-all flex-shrink-0 ${!selectedCategory
                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                                : 'bg-white/5 text-slate-300 hover:bg-white/10'
                                }`}
                        >
                            ทั้งหมด
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`px-3 py-2 sm:py-1.5 rounded-lg text-sm whitespace-nowrap transition-all flex-shrink-0 ${selectedCategory === cat.id
                                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                                    }`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Products Grid */}
                <div className="flex-1 overflow-y-auto pr-1 sm:pr-2 custom-scrollbar min-h-0 pb-20 lg:pb-4">
                    {loading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                <div key={i} className="glass-card p-3 sm:p-4">
                                    <div className="skeleton h-28 sm:h-40 w-full mb-3 sm:mb-4"></div>
                                    <div className="skeleton h-4 w-3/4 mb-2"></div>
                                    <div className="skeleton h-6 w-1/2"></div>
                                </div>
                            ))}
                        </div>
                    ) : filteredSnakes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 min-h-[300px]">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-800/50 flex items-center justify-center mb-4">
                                <Search size={28} className="opacity-40" />
                            </div>
                            <p className="text-base font-medium">ไม่พบสินค้าที่คุณค้นหา</p>
                            <p className="text-sm opacity-60 mt-1">ลองเปลี่ยนคำค้นหา หรือเลือกหมวดหมู่ใหม่</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4">
                            {filteredSnakes.map(snake => {
                                const inCart = cart.find(item => item.id === snake.id);
                                return (
                                    <div
                                        key={snake.id}
                                        onClick={() => addToCart(snake)}
                                        className="bg-slate-800/40 border border-white/5 rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer group hover:border-emerald-500/50 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300 flex flex-col active:scale-[0.98]"
                                    >
                                        {/* Image Section */}
                                        <div className="relative aspect-[4/3] bg-slate-900 overflow-hidden">
                                            {snake.image ? (
                                                <img
                                                    src={snake.image}
                                                    alt={snake.name}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-3xl sm:text-4xl bg-slate-800">
                                                    🐍
                                                </div>
                                            )}

                                            {/* Status Badges */}
                                            <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                                                {snake.stock <= 2 && (
                                                    <span className="bg-red-500 text-white text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full shadow-lg backdrop-blur-md">
                                                        เหลือ {snake.stock}
                                                    </span>
                                                )}
                                                {inCart && (
                                                    <span className="bg-emerald-500 text-white text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1 backdrop-blur-md animate-fade-in">
                                                        <Check size={10} strokeWidth={4} />
                                                        {inCart.quantity}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Info Section */}
                                        <div className="p-2.5 sm:p-3 flex-1 flex flex-col justify-between bg-gradient-to-b from-white/[0.02] to-transparent">
                                            <div>
                                                <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-0.5 sm:mb-1">{snake.category?.name}</p>
                                                <h3 className="font-medium text-white text-xs sm:text-sm leading-snug line-clamp-2 mb-1.5 sm:mb-2 group-hover:text-emerald-400 transition-colors">{snake.name}</h3>
                                            </div>

                                            <div className="flex justify-between items-center mt-1 sm:mt-2 pt-2 border-t border-white/5">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] sm:text-[10px] text-slate-400">ราคา</span>
                                                    <span className="text-sm sm:text-lg font-bold text-emerald-400">{formatCurrency(snake.price)}</span>
                                                </div>
                                                <button className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-700/50 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300 shadow-lg">
                                                    <Plus size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Desktop Cart Section */}
            <div className="hidden lg:flex w-80 xl:w-96 glass-card flex-col shrink-0 border-l border-white/5 shadow-2xl">
                <CartContent />
            </div>

            {/* Mobile Floating Cart Button */}
            {!showMobileCart && (
                <button
                    onClick={() => setShowMobileCart(true)}
                    className="lg:hidden fixed bottom-20 right-4 z-30 bg-emerald-500 text-white px-4 py-3 rounded-2xl shadow-xl shadow-emerald-500/30 flex items-center gap-2 animate-fade-in"
                >
                    <ShoppingCart size={20} />
                    <span className="font-semibold">{cartCount}</span>
                    {cartTotal > 0 && (
                        <>
                            <span className="w-px h-4 bg-white/30"></span>
                            <span className="font-bold">{formatCurrency(cartTotal)}</span>
                        </>
                    )}
                </button>
            )}

            {/* Mobile Cart Modal */}
            {showMobileCart && (
                <div className="lg:hidden fixed inset-0 z-40 flex flex-col justify-end animate-fade-in">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowMobileCart(false)}
                    />
                    <div className="relative glass-card rounded-t-3xl max-h-[85vh] flex flex-col border-t border-white/10 animate-slide-in">
                        {/* Drag Handle */}
                        <div className="flex justify-center py-3">
                            <div className="w-12 h-1 bg-white/20 rounded-full"></div>
                        </div>
                        <CartContent isMobile={true} />
                    </div>
                </div>
            )}

            {/* Checkout Modal */}
            {showCheckout && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
                    <div className="glass-card w-full max-w-md p-0 overflow-hidden shadow-2xl scale-100 animate-fade-in border border-white/10 max-h-[90vh] flex flex-col">
                        {orderSuccess ? (
                            <div className="text-center py-10 sm:py-12 px-6 bg-slate-900/90">
                                <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-5 sm:mb-6 rounded-full bg-emerald-500/10 flex items-center justify-center ring-4 ring-emerald-500/5">
                                    <Check size={40} className="text-emerald-500" />
                                </div>
                                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">เรียบร้อย!</h2>
                                <p className="text-slate-400 mb-6 sm:mb-8">ขอบคุณที่ใช้บริการ</p>
                                <div className="bg-white/5 rounded-2xl p-5 sm:p-6 mb-6 sm:mb-8 max-w-xs mx-auto border border-white/5">
                                    <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Order No.</p>
                                    <p className="text-lg font-mono text-white mb-4">#{orderSuccess.orderNo?.slice(-8)}</p>
                                    <div className="h-px bg-white/10 mb-4" />
                                    <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Total</p>
                                    <p className="text-2xl sm:text-3xl font-bold text-emerald-400">{formatCurrency(orderSuccess.total)}</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex justify-between items-center p-5 sm:p-6 border-b border-white/5 bg-white/[0.02]">
                                    <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                                        <CreditCard size={22} className="text-emerald-500" />
                                        ชำระเงิน
                                    </h2>
                                    <button
                                        onClick={() => setShowCheckout(false)}
                                        className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-slate-900/80">
                                    {/* Order Summary */}
                                    <div className="space-y-2.5 sm:space-y-3 mb-6 sm:mb-8 max-h-40 sm:max-h-48 overflow-y-auto custom-scrollbar pr-2">
                                        {cart.map(item => (
                                            <div key={item.id} className="flex justify-between text-sm py-2 border-b border-white/5 last:border-0 border-dashed">
                                                <div className="flex gap-3">
                                                    <span className="text-emerald-500 font-bold w-6 text-center">x{item.quantity}</span>
                                                    <span className="text-slate-300">{item.name}</span>
                                                </div>
                                                <span className="text-white font-medium">{formatCurrency(item.price * item.quantity)}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="bg-emerald-500/5 rounded-xl p-4 mb-6 sm:mb-8 border border-emerald-500/10 flex justify-between items-center">
                                        <span className="text-slate-300">ยอดชำระทั้งหมด</span>
                                        <span className="font-bold text-xl sm:text-2xl text-emerald-400">{formatCurrency(cartTotal)}</span>
                                    </div>

                                    {/* Payment Methods */}
                                    <div className="mb-6 sm:mb-8">
                                        <p className="text-slate-400 text-xs uppercase tracking-widest font-bold mb-3 ml-1">เลือกวิธีชำระเงิน</p>
                                        <div className="grid grid-cols-3 gap-2 sm:gap-3">
                                            {[
                                                { id: 'cash', icon: Banknote, label: 'เงินสด' },
                                                { id: 'transfer', icon: QrCode, label: 'โอนเงิน' },
                                                { id: 'card', icon: CreditCard, label: 'บัตรเครดิต' }
                                            ].map(method => (
                                                <button
                                                    key={method.id}
                                                    onClick={() => setPaymentMethod(method.id)}
                                                    className={`p-3 sm:p-4 rounded-xl flex flex-col items-center gap-2 sm:gap-3 transition-all duration-300 ${paymentMethod === method.id
                                                        ? 'bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-900/20 ring-1 ring-emerald-500/50'
                                                        : 'bg-white/5 border-transparent text-slate-400 hover:bg-white/10 hover:text-slate-200'
                                                        } border-2`}
                                                >
                                                    <method.icon size={24} />
                                                    <span className="text-[10px] sm:text-xs font-semibold">{method.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleCheckout}
                                        disabled={processing}
                                        className="btn-primary w-full h-12 flex items-center justify-center gap-2 text-base font-semibold shadow-xl shadow-emerald-500/20"
                                    >
                                        {processing ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                กำลังประมวลผล...
                                            </>
                                        ) : (
                                            <>
                                                <Check size={20} />
                                                ยืนยันการชำระเงิน
                                            </>
                                        )}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
