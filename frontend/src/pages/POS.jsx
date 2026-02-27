import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
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
    Tag,
    User
} from 'lucide-react';
import Receipt from '../components/Receipt';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

const API = import.meta.env.VITE_API_URL || 'http://103.142.150.196:5000/api';

// Sound effect for successful checkout (Temporarily disabled to prevent 403 error)
const successSound = { volume: 0.5, play: async () => { } };

const capitalize = (str) => {
    if (!str) return str;
    return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
};

export default function POS() {
    const { getToken, user } = useAuth();
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
    const [showReceipt, setShowReceipt] = useState(false);
    const [settings, setSettings] = useState({});

    // Discount
    const [discount, setDiscount] = useState(0);
    const [discountType, setDiscountType] = useState('amount'); // 'amount' | 'percent'
    // Customer
    const [customerSearch, setCustomerSearch] = useState('');
    const [customerResults, setCustomerResults] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [showCustomerDrop, setShowCustomerDrop] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [snakesRes, categoriesRes, settingsRes] = await Promise.all([
                fetch(`${API}/snakes`),
                fetch(`${API}/categories`),
                fetch(`${API}/settings`)
            ]);
            if (snakesRes.ok && categoriesRes.ok && settingsRes.ok) {
                setSnakes(await snakesRes.json());
                setCategories(await categoriesRes.json());
                setSettings(await settingsRes.json());
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Customer search
    useEffect(() => {
        if (!customerSearch.trim()) { setCustomerResults([]); return; }
        const t = setTimeout(async () => {
            const res = await fetch(`${API}/customers?search=${encodeURIComponent(customerSearch)}`, {
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            if (res.ok) setCustomerResults(await res.json());
        }, 300);
        return () => clearTimeout(t);
    }, [customerSearch]);

    // Keyboard shortcut: Enter = checkout confirm (when modal open)
    useEffect(() => {
        const handler = (e) => {
            if (e.key === 'F1') { e.preventDefault(); setShowCheckout(true); }
            if (e.key === 'Escape') { setShowCheckout(false); setShowMobileCart(false); }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    const formatCurrency = (amount) => {
        const symbol = settings.currency_symbol || '฿';
        return `${symbol}${new Intl.NumberFormat('th-TH', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount)}`;
    };

    const filteredSnakes = snakes.filter(snake => {
        const matchesSearch = snake.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            snake.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = !selectedCategory || snake.categoryId === selectedCategory;
        return matchesSearch && matchesCategory && snake.stock > 0;
    });

    const addToCart = (snake) => {
        if (snake.stock <= 0) {
            toast.error(`"${snake.name}" หมดสต็อกแล้ว`);
            return;
        }

        const existing = cart.find(item => item.id === snake.id);
        if (existing) {
            if (existing.quantity < snake.stock) {
                const newQty = existing.quantity + 1;
                setCart(cart.map(item =>
                    item.id === snake.id
                        ? { ...item, quantity: newQty }
                        : item
                ));

                if (newQty === snake.stock) {
                    toast(`คุณเพิ่ม "${snake.name}" ครบตามจำนวนสต็อกแล้ว (${snake.stock})`, {
                        icon: '⚠️',
                    });
                }
            } else {
                toast.error(`ขออภัย! "${snake.name}" มีในสต็อกเพียง ${snake.stock} ชิ้นเท่านั้น`);
            }
        } else {
            setCart([...cart, { ...snake, quantity: 1 }]);
            if (snake.stock === 1) {
                toast(`เพิ่ม "${snake.name}" (สินค้าในสต็อกเหลือเพียง 1 ชิ้น!)`, {
                    icon: '📢',
                });
            }
        }
    };

    const updateQuantity = (id, delta) => {
        setCart(cart.map(item => {
            if (item.id === id) {
                const newQty = item.quantity + delta;
                const snake = snakes.find(s => s.id === id);

                if (delta > 0 && newQty > snake.stock) {
                    toast.error(`ไม่สามารถเพิ่มได้เกิน ${snake.stock} ชิ้น`);
                    return item;
                }

                if (newQty > 0) {
                    if (delta > 0 && newQty === snake.stock) {
                        toast(`คุณเพิ่ม "${item.name}" จนถึงจำนวนจำกัดที่มีแล้ว`, {
                            icon: '⚠️',
                        });
                    }
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

    const cartSubtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountAmount = discountType === 'percent' ? Math.round(cartSubtotal * (discount / 100)) : Number(discount);
    const cartTotal = Math.max(0, cartSubtotal - discountAmount);
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    // Calculates frontend preview of tax based on settings
    const enableVat = settings.enable_vat === 'true';
    const taxRate = parseFloat(settings.tax_rate) || 7;
    const taxPreview = enableVat ? (cartTotal * taxRate) / (100 + taxRate) : 0; // Inclusive tax calculation assumption based on original code

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        setProcessing(true);
        try {
            const response = await fetch(`${API}/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
                body: JSON.stringify({
                    items: cart.map(item => ({ snakeId: item.id, quantity: item.quantity })),
                    paymentMethod,
                    discount: discountAmount,
                    userId: user?.id,
                    customerId: selectedCustomer?.id || undefined,
                })
            });
            if (response.ok) {
                const order = await response.json();
                setOrderSuccess(order);
                setCart([]);
                setDiscount(0);
                setSelectedCustomer(null);
                setCustomerSearch('');
                fetchData();

                // Sound Effect Notification
                if (settings.notify_sound === 'true') {
                    successSound.volume = 0.5;
                    successSound.play().catch(e => console.log('Audio play failed:', e));
                }

                // Low Stock Warning Notifications
                if (settings.notify_low_stock === 'true') {
                    cart.forEach(item => {
                        const remaining = item.stock - item.quantity;
                        if (remaining <= 2 && remaining >= 0) {
                            toast(`⚠️ สินค้า "${item.name}" ใกล้หมดแล้ว (เหลือ ${remaining})`, {
                                duration: 5000,
                            });
                        }
                    });
                }

                // Auto Print Receipt
                if (settings.auto_print_receipt === 'true') {
                    setShowCheckout(false);
                    setShowReceipt(true);
                }
            } else {
                const err = await response.json();
                toast.error(err.error || 'เกิดข้อผิดพลาด');
            }
        } catch (error) {
            console.error('Checkout failed:', error);
            toast.error('ไม่สามารถทำรายการได้');
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
                    <span className="text-slate-400 text-sm">ยอดรวม</span>
                    <span className="text-white font-semibold">{formatCurrency(cartSubtotal)}</span>
                </div>
                {discountAmount > 0 && (
                    <div className="flex justify-between text-sm">
                        <span className="text-red-400">ส่วนลด</span>
                        <span className="text-red-400">-{formatCurrency(discountAmount)}</span>
                    </div>
                )}
                <div className="flex justify-between text-base items-end">
                    <span className="text-slate-400 text-sm">ยอดสุทธิ</span>
                    <div className="text-right">
                        <span className="font-bold text-white text-xl sm:text-2xl tracking-tight text-gradient">{formatCurrency(cartTotal)}</span>
                    </div>
                </div>

                <button
                    onClick={() => setShowCheckout(true)}
                    disabled={cart.length === 0}
                    className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed h-12 text-base shadow-lg shadow-emerald-500/20 group relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    <CreditCard size={20} />
                    ชำระเงิน <span className="text-xs opacity-70">(F1)</span>
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
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="ค้นหาสินค้า..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="input-field pl-icon"
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
                                                <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-0.5 sm:mb-1">{capitalize(snake.category?.name)}</p>
                                                <h3 className="font-medium text-white text-xs sm:text-sm leading-snug line-clamp-2 mb-1.5 sm:mb-2 group-hover:text-emerald-400 transition-colors">{snake.name}</h3>
                                            </div>

                                            <div className="flex justify-between items-end mt-1 sm:mt-2 pt-2 border-t border-white/5">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] sm:text-[10px] text-slate-400">ราคา</span>
                                                    <span className="text-sm sm:text-lg font-bold text-emerald-400 leading-none mb-0.5">{formatCurrency(snake.price)}</span>
                                                    {(settings.show_cost_price === 'true') && (user?.role === 'admin' || user?.role === 'manager') && snake.cost && (
                                                        <span className="text-[8px] sm:text-[9px] text-red-400 font-medium">ทุน: {formatCurrency(snake.cost)}</span>
                                                    )}
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
            {showMobileCart && createPortal(
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
                </div>,
                document.body
            )}

            {/* Checkout Modal */}
            {showCheckout && createPortal(
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
                                    {orderSuccess.tax > 0 && (
                                        <p className="text-xs text-slate-500 mt-2">ประเมินภาษี (VAT {taxRate}%): {formatCurrency(orderSuccess.tax)}</p>
                                    )}
                                </div>
                                <div className="flex gap-3 justify-center">
                                    <button className="btn-secondary px-6 py-3" onClick={() => { setOrderSuccess(null); setShowCheckout(false); }}>ปิด</button>
                                    <button className="btn-primary px-6 py-3" onClick={() => { setShowCheckout(false); setShowReceipt(true); }}>🧾 พิมพ์ใบเสร็จ</button>
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

                                    {/* Discount & Customer */}
                                    <div className="space-y-3 mb-5">
                                        {/* Customer picker */}
                                        <div className="relative">
                                            <p className="text-slate-400 text-xs uppercase tracking-widest font-bold mb-2 ml-1">ลูกค้า (ถ้ามี)</p>
                                            {selectedCustomer ? (
                                                <div className="flex items-center gap-2 bg-white/5 rounded-xl p-3 border border-white/10">
                                                    <User size={16} className="text-emerald-400" />
                                                    <span className="text-white flex-1 text-sm">{selectedCustomer.name}</span>
                                                    <button onClick={() => { setSelectedCustomer(null); setCustomerSearch(''); }} className="text-slate-500 hover:text-red-400"><X size={14} /></button>
                                                </div>
                                            ) : (
                                                <div className="relative">
                                                    <input
                                                        value={customerSearch}
                                                        onChange={e => { setCustomerSearch(e.target.value); setShowCustomerDrop(true); }}
                                                        placeholder="ค้นหาชื่อหรือเบอร์โทร..."
                                                        className="input-field pr-4 text-sm"
                                                        onFocus={() => setShowCustomerDrop(true)}
                                                    />
                                                    {showCustomerDrop && customerResults.length > 0 && (
                                                        <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-white/10 rounded-xl overflow-hidden z-10 shadow-xl">
                                                            {customerResults.slice(0, 5).map(c => (
                                                                <button key={c.id} className="w-full text-left px-4 py-2.5 hover:bg-white/5 text-sm text-white border-b border-white/5 last:border-0"
                                                                    onClick={() => { setSelectedCustomer(c); setCustomerSearch(''); setShowCustomerDrop(false); }}>
                                                                    <div>{c.name}</div>
                                                                    {c.phone && <div className="text-xs text-slate-400">{c.phone}</div>}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Discount */}
                                        <div>
                                            <p className="text-slate-400 text-xs uppercase tracking-widest font-bold mb-2 ml-1 flex items-center gap-1"><Tag size={11} /> ส่วนลด</p>
                                            <div className="flex gap-2">
                                                <div className="flex bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                                                    <button onClick={() => setDiscountType('amount')} className={`px-3 py-2 text-xs font-bold transition-colors ${discountType === 'amount' ? 'bg-emerald-500 text-white' : 'text-slate-400'}`}>฿</button>
                                                    <button onClick={() => setDiscountType('percent')} className={`px-3 py-2 text-xs font-bold transition-colors ${discountType === 'percent' ? 'bg-emerald-500 text-white' : 'text-slate-400'}`}>%</button>
                                                </div>
                                                <input type="number" min="0" value={discount} onChange={e => setDiscount(e.target.value)}
                                                    placeholder={discountType === 'percent' ? '0–100' : '0'}
                                                    className="input-field flex-1 text-sm" />
                                            </div>
                                            {discountAmount > 0 && (
                                                <p className="text-xs text-red-400 mt-1 ml-1">ลด ฿{discountAmount.toLocaleString('th-TH')}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-emerald-500/5 rounded-xl p-4 mb-5 border border-emerald-500/10">
                                        <div className="flex justify-between mb-1">
                                            <span className="text-slate-400 text-sm">ยอดรวม</span>
                                            <span className="text-slate-300">{formatCurrency(cartSubtotal)}</span>
                                        </div>
                                        {discountAmount > 0 && (
                                            <div className="flex justify-between mb-1">
                                                <span className="text-red-400 text-sm">ส่วนลด</span>
                                                <span className="text-red-400">-{formatCurrency(discountAmount)}</span>
                                            </div>
                                        )}
                                        {enableVat && (
                                            <div className="flex justify-between mb-1">
                                                <span className="text-slate-400 text-sm">ภาษี (VAT {taxRate}%)</span>
                                                <span className="text-slate-300">{formatCurrency(taxPreview)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center border-t border-white/10 pt-2 mt-1">
                                            <span className="text-slate-300 font-semibold">ยอดสุทธิ</span>
                                            <span className="font-bold text-xl sm:text-2xl text-emerald-400">{formatCurrency(cartTotal)}</span>
                                        </div>
                                    </div>

                                    {/* Payment Methods */}
                                    <div className="mb-6 sm:mb-8">
                                        <p className="text-slate-400 text-xs uppercase tracking-widest font-bold mb-3 ml-1">เลือกวิธีชำระเงิน</p>
                                        <div className="grid grid-cols-3 gap-2 sm:gap-3">
                                            {[
                                                { id: 'cash', icon: Banknote, label: 'เงินสด', enabled: settings.accept_cash !== 'false' },
                                                { id: 'transfer', icon: QrCode, label: 'โอนเงิน', enabled: settings.accept_transfer !== 'false' },
                                                { id: 'card', icon: CreditCard, label: 'บัตรเครดิต', enabled: settings.accept_card === 'true' }
                                            ].filter(m => m.enabled).map(method => (
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
                </div>,
                document.body
            )}

            {/* Receipt Modal */}
            {showReceipt && orderSuccess && (
                <Receipt order={orderSuccess} onClose={() => { setShowReceipt(false); setOrderSuccess(null); setShowCheckout(false); setShowMobileCart(false); }} />
            )}
        </div>
    );
}
