import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { CheckCircle2 } from 'lucide-react';

const Layout = ({
    cartItemCount,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    searchQuery,
    handleSearch,
    toast
}) => {
    const location = useLocation();
    const isHome = location.pathname === '/';

    return (
        <div className="min-h-screen bg-stone-950 font-sans text-stone-200 flex flex-col selection:bg-sky-500/30 selection:text-sky-200">
            <Navbar
                cartItemCount={cartItemCount}
                isMobileMenuOpen={isMobileMenuOpen}
                setIsMobileMenuOpen={setIsMobileMenuOpen}
                searchQuery={searchQuery}
                handleSearch={handleSearch}
            />

            <div className={`flex-1 ${!isHome ? 'pt-[80px]' : ''}`}>
                <Outlet />
            </div>

            <Footer />

            {/* Global Toast Notification */}
            {toast && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 glass-dark text-stone-200 px-6 py-3 rounded-full shadow-2xl shadow-sky-500/10 flex items-center gap-3 z-[100] transition-all transform duration-300 border border-white/10">
                    <CheckCircle2 size={18} className="text-sky-400" />
                    <span className="font-medium text-sm whitespace-nowrap">{toast}</span>
                </div>
            )}
        </div>
    );
};

export default Layout;
