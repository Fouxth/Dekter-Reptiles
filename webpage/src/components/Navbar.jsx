import React, { useState, useEffect } from 'react';
import { ShoppingCart, Menu, X, Search, User, LogOut } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useCustomerAuth } from '../contexts/CustomerAuthContext';

const Navbar = ({ cartItemCount, isMobileMenuOpen, setIsMobileMenuOpen, searchQuery, handleSearch }) => {
    const navigate = useNavigate();
    const { customer, logout } = useCustomerAuth();
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={`fixed top-0 w-full z-50 transition-all duration-300 border-b ${isScrolled
            ? 'glass-dark border-white/10 shadow-xl'
            : 'bg-transparent border-transparent'
            }`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-20">

                    {/* Logo */}
                    <div className="flex items-center cursor-pointer group" onClick={() => navigate('/')}>
                        <div className="h-14 w-auto flex items-center justify-center group-hover:scale-105 transition-transform drop-shadow-[0_0_15px_rgba(14,165,233,0.3)] group-hover:drop-shadow-[0_0_20px_rgba(14,165,233,0.5)] flex-shrink-0">
                            <img
                                src="/logo-dark.png"
                                alt="Dexter Reptiles"
                                className="h-full w-auto object-contain"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    if (e.target.parentElement.nextElementSibling) {
                                        e.target.parentElement.nextElementSibling.classList.remove('hidden');
                                        e.target.parentElement.nextElementSibling.classList.add('flex');
                                        e.target.parentElement.classList.add('hidden');
                                    }
                                }}
                            />
                        </div>
                        <div className="hidden w-14 h-14 bg-gradient-to-br from-sky-400 to-sky-600 rounded-full flex-col items-center justify-center shadow-lg shadow-sky-500/20 flex-shrink-0">
                            <span className="text-stone-950 font-bold text-2xl">DR</span>
                        </div>
                        <div className="ml-3">
                            <h1 className="text-xl md:text-2xl font-bold text-stone-100 tracking-tight group-hover:text-sky-400 transition-colors">Dexter Reptiles</h1>
                            <p className="text-[0.65rem] md:text-xs text-sky-400/80 uppercase tracking-widest font-semibold">Premium Reptiles</p>
                        </div>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-8">
                        <button onClick={() => navigate('/')} className="text-stone-300 hover:text-sky-400 font-medium transition-colors text-sm uppercase tracking-wide">หน้าแรก</button>
                        <button onClick={() => navigate('/shop')} className="text-stone-300 hover:text-sky-400 font-medium transition-colors text-sm uppercase tracking-wide">ร้านค้า</button>
                        <button onClick={() => navigate('/articles')} className="text-stone-300 hover:text-sky-400 font-medium transition-colors text-sm uppercase tracking-wide">บทความ</button>
                        <button onClick={() => navigate('/contact')} className="text-stone-300 hover:text-sky-400 font-medium transition-colors text-sm uppercase tracking-wide">ติดต่อเรา</button>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-6">
                        <div className="hidden md:flex relative group">
                            <input
                                type="text"
                                placeholder="ค้นหางูสายพันธุ์ต่างๆ..."
                                value={searchQuery}
                                onChange={handleSearch}
                                className="pl-10 pr-4 py-2 rounded-full border border-white/10 glass text-sm focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 w-64 text-stone-200 placeholder-stone-500 transition-all"
                            />
                            <Search className="absolute left-3 top-2.5 text-stone-400 group-focus-within:text-sky-400 transition-colors" size={18} />
                        </div>

                        {customer ? (
                            <button
                                onClick={() => navigate('/profile')}
                                className="flex items-center gap-2 text-stone-300 hover:text-sky-400 transition-colors group px-3 py-1.5 rounded-xl border border-white/5 hover:border-sky-500/30 glass"
                            >
                                <User size={20} className="group-hover:scale-110 transition-transform" />
                                <span className="hidden lg:inline text-xs font-bold uppercase tracking-widest">{customer.name.split(' ')[0]}</span>
                            </button>
                        ) : (
                            <button
                                onClick={() => navigate('/login')}
                                className="text-stone-300 hover:text-sky-400 transition-colors p-2 rounded-full hover:bg-white/5"
                                aria-label="เข้าสู่ระบบ"
                            >
                                <User size={24} />
                            </button>
                        )}

                        <button
                            onClick={() => navigate('/cart')}
                            className="relative p-2 text-stone-300 hover:text-sky-400 transition-colors group"
                            aria-label="ตะกร้าสินค้า"
                        >
                            <ShoppingCart size={24} className="group-hover:scale-110 transition-transform" />
                            {cartItemCount > 0 && (
                                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-stone-900 bg-sky-400 rounded-full transform translate-x-1/4 -translate-y-1/4 shadow-lg shadow-sky-500/30">
                                    {cartItemCount}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="md:hidden text-stone-300 hover:text-sky-400 transition-colors"
                        >
                            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-stone-950/95 backdrop-blur-xl border-t border-white/10 px-4 pt-4 pb-6 space-y-3 absolute w-full shadow-2xl">
                    <div className="relative mb-4">
                        <input
                            type="text"
                            placeholder="ค้นหางูสายพันธุ์ต่างๆ..."
                            value={searchQuery}
                            onChange={handleSearch}
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/10 bg-white/5 text-stone-200 focus:outline-none focus:border-sky-500 placeholder-stone-500"
                        />
                        <Search className="absolute left-3 top-3.5 text-stone-400" size={20} />
                    </div>
                    <button onClick={() => { navigate('/'); setIsMobileMenuOpen(false); }} className="block w-full text-left px-4 py-3 rounded-xl text-stone-300 hover:text-sky-400 hover:bg-white/5 font-medium transition-colors">หน้าแรก</button>
                    <button onClick={() => { navigate('/shop'); setIsMobileMenuOpen(false); }} className="block w-full text-left px-4 py-3 rounded-xl text-stone-300 hover:text-sky-400 hover:bg-white/5 font-medium transition-colors">ร้านค้า</button>
                    <button onClick={() => { navigate('/articles'); setIsMobileMenuOpen(false); }} className="block w-full text-left px-4 py-3 rounded-xl text-stone-300 hover:text-sky-400 hover:bg-white/5 font-medium transition-colors">บทความ/วิธีเลี้ยง</button>
                    <button onClick={() => { navigate('/contact'); setIsMobileMenuOpen(false); }} className="block w-full text-left px-4 py-3 rounded-xl text-stone-300 hover:text-sky-400 hover:bg-white/5 font-medium transition-colors">ติดต่อเรา</button>
                    <div className="pt-4 border-t border-white/5">
                        {customer ? (
                            <>
                                <button onClick={() => { navigate('/profile'); setIsMobileMenuOpen(false); }} className="block w-full text-left px-4 py-3 rounded-xl text-sky-400 hover:bg-white/5 font-bold transition-colors">โปรไฟล์: {customer.name}</button>
                                <button onClick={() => { logout(); navigate('/'); setIsMobileMenuOpen(false); }} className="block w-full text-left px-4 py-3 rounded-xl text-red-400 hover:bg-white/5 font-bold transition-colors">ออกจากระบบ</button>
                            </>
                        ) : (
                            <button onClick={() => { navigate('/login'); setIsMobileMenuOpen(false); }} className="block w-full text-left px-4 py-3 rounded-xl text-sky-400 hover:bg-white/5 font-bold transition-colors">เข้าสู่ระบบ / สมัครสมาชิก</button>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
