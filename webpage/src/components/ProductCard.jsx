import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const formatPrice = (price) => {
    return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 }).format(price);
};

const capitalize = (str) => {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const API = import.meta.env.VITE_API_URL;
const BASE_URL = API.replace('/api', '');

const ProductCard = ({ product, addToCart }) => {
    const navigate = useNavigate();

    const imageUrl = product.customerImage
        ? (product.customerImage.startsWith('http') ? product.customerImage : `${BASE_URL}${product.customerImage}`)
        : (product.adminImage ? (product.adminImage.startsWith('http') ? product.adminImage : `${BASE_URL}${product.adminImage}`) : null);

    return (
        <article className="glass-card rounded-2xl overflow-hidden group flex flex-col h-full cursor-pointer hover:border-sky-500/50 transition-all duration-300 transform hover:-translate-y-1" onClick={() => navigate(`/product/${product.id}`)}>
            <div className="relative h-56 overflow-hidden bg-stone-950">
                <img
                    src={imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                    loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-transparent to-transparent opacity-80"></div>

                {!(product.stock > 0) && (
                    <div className="absolute inset-0 bg-stone-950/80 backdrop-blur-md flex items-center justify-center z-10">
                        <span className="border border-sky-500/50 text-sky-500 px-6 py-2 rounded-full font-bold shadow-lg uppercase tracking-widest text-sm bg-sky-500/10">Sold Out</span>
                    </div>
                )}
                <div className="absolute top-3 left-3 bg-stone-950/80 border border-white/10 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-semibold text-sky-400 uppercase tracking-wider shadow-lg">
                    {capitalize(product.species)}
                </div>
            </div>
            <div className="p-5 flex flex-col flex-1 relative bg-gradient-to-b from-transparent to-stone-950/50">
                <h3 className="text-lg font-bold text-stone-100 mb-2 line-clamp-1 group-hover:text-sky-400 transition-colors">{product.name}</h3>
                <p className="text-sm text-stone-400 mb-6 line-clamp-2 flex-1 leading-relaxed">{product.description}</p>
                <div className="flex items-center justify-between mt-auto">
                    <span className="text-xl font-bold text-sky-400 tracking-tight">{formatPrice(product.price)}</span>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if ((product.stock > 0) && addToCart) addToCart(product);
                        }}
                        disabled={!(product.stock > 0)}
                        className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 ${(product.stock > 0) ? 'bg-sky-500/10 border border-sky-500/30 hover:bg-sky-500 hover:text-stone-950 text-sky-500 hover:shadow-[0_0_15px_rgba(14,165,233,0.5)]' : 'bg-stone-800 border border-stone-700 text-stone-600 cursor-not-allowed'
                            }`}
                        aria-label="เพิ่มลงตะกร้า"
                    >
                        <ShoppingCart size={18} />
                    </button>
                </div>
            </div>
        </article>
    );
};

export default ProductCard;
