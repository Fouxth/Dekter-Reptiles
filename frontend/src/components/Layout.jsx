import { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    Receipt,
    Settings,
    LogOut,
    Menu,
    X,
    ChevronRight,
    Bell,
    User
} from 'lucide-react';

const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'แดชบอร์ด' },
    { path: '/pos', icon: ShoppingCart, label: 'ขายสินค้า' },
    { path: '/inventory', icon: Package, label: 'สต็อกสินค้า' },
    { path: '/orders', icon: Receipt, label: 'ประวัติการขาย' },
];

export default function Layout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const location = useLocation();

    // Detect screen size
    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 1024);
            if (window.innerWidth >= 1024) {
                setSidebarOpen(true);
            } else {
                setSidebarOpen(false);
            }
        };

        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    // Close sidebar on route change (mobile)
    useEffect(() => {
        if (isMobile) {
            setSidebarOpen(false);
        }
    }, [location.pathname, isMobile]);

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    return (
        <div className="flex flex-col lg:flex-row h-screen bg-transparent overflow-hidden selection:bg-emerald-500/30">
            {/* Mobile Header */}
            <header className="lg:hidden flex items-center justify-between p-4 bg-slate-900/60 backdrop-blur-xl border-b border-white/5 sticky top-0 z-30">
                <button
                    onClick={toggleSidebar}
                    className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
                    aria-label="Toggle menu"
                >
                    <Menu size={22} />
                </button>

                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-sm shadow-lg shadow-emerald-500/20">
                        🐍
                    </div>
                    <h1 className="text-lg font-bold text-white tracking-tight">Snake POS</h1>
                </div>

                <div className="flex items-center gap-2">
                    <button className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors relative">
                        <Bell size={20} />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full"></span>
                    </button>
                </div>
            </header>

            {/* Mobile Overlay */}
            {isMobile && sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed lg:relative inset-y-0 left-0 z-50
                    w-[280px] lg:w-[280px] xl:w-[300px]
                    transform transition-transform duration-300 ease-out
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                    lg:p-4 lg:shrink-0
                `}
            >
                <div className="glass-card h-full lg:h-[calc(100vh-2rem)] flex flex-col p-6 border-white/5 bg-slate-900/95 lg:bg-slate-900/40 shadow-2xl backdrop-blur-3xl lg:rounded-2xl rounded-none">
                    {/* Logo Section */}
                    <div className="mb-8 px-2 pt-2 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-xl shadow-lg shadow-emerald-500/20 ring-1 ring-white/10 group cursor-pointer hover:scale-110 transition-transform duration-300">
                                <span className="transform group-hover:rotate-12 transition-transform duration-300">🐍</span>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-white tracking-tight leading-none font-display">Snake POS</h1>
                                <p className="text-[10px] text-slate-400 font-semibold tracking-widest uppercase mt-1">System Area</p>
                            </div>
                        </div>

                        {/* Close button for mobile */}
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                            aria-label="Close sidebar"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 space-y-1.5">
                        {navItems.map((item) => (
                            <li key={item.path} className="list-none">
                                <NavLink
                                    to={item.path}
                                    end={item.path === '/'}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden ${isActive
                                            ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25'
                                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                                        }`
                                    }
                                >
                                    {({ isActive }) => (
                                        <>
                                            <item.icon size={20} className="relative z-10 shrink-0" />
                                            <span className="relative z-10 font-medium tracking-wide text-sm flex-1">{item.label}</span>
                                            <ChevronRight size={16} className={`relative z-10 transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`} />

                                            {/* Shine Effect for Active */}
                                            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </>
                                    )}
                                </NavLink>
                            </li>
                        ))}
                    </nav>

                    {/* User Profile Card */}
                    <div className="p-4 bg-white/5 rounded-2xl mb-4 border border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center">
                                <User size={18} className="text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">Admin</p>
                                <p className="text-xs text-slate-400 truncate">admin@snakepos.com</p>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="pt-4 border-t border-white/5 space-y-1.5">
                        <button className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 w-full transition-all group duration-300">
                            <Settings size={20} className="group-hover:rotate-90 transition-transform duration-500 shrink-0" />
                            <span className="font-medium text-sm">ตั้งค่า</span>
                        </button>
                        <button className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 w-full transition-all group duration-300">
                            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform shrink-0" />
                            <span className="font-medium text-sm">ออกจากระบบ</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-hidden relative z-10 flex flex-col min-h-0">
                <div className="flex-1 p-3 sm:p-4 lg:p-4 overflow-auto custom-scrollbar">
                    <Outlet />
                </div>

                {/* Mobile Bottom Navigation */}
                <nav className="lg:hidden flex items-center justify-around p-2 pb-safe bg-slate-900/95 backdrop-blur-xl border-t border-white/10 sticky bottom-0">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/'}
                            className={({ isActive }) =>
                                `flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${isActive
                                    ? 'text-emerald-400'
                                    : 'text-slate-500'
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <div className={`p-1.5 rounded-lg transition-colors ${isActive ? 'bg-emerald-500/20' : ''}`}>
                                        <item.icon size={22} />
                                    </div>
                                    <span className="text-[10px] font-medium">{item.label}</span>
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>
            </main>
        </div>
    );
}
