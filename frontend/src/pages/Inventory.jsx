import { useState, useEffect } from 'react';
import {
    Search,
    Plus,
    Edit,
    Trash2,
    Package,
    X,
    Save,
    AlertTriangle,
    Filter,
    MoreVertical
} from 'lucide-react';

export default function Inventory() {
    const [snakes, setSnakes] = useState([]);
    const [categories, setCategories] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingSnake, setEditingSnake] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        stock: '',
        color: '',
        age: '',
        gender: 'male',
        categoryId: '',
        image: ''
    });

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
        return matchesSearch && matchesCategory;
    });

    const openAddModal = () => {
        setEditingSnake(null);
        setFormData({
            name: '',
            description: '',
            price: '',
            stock: '',
            color: '',
            age: '',
            gender: 'male',
            categoryId: categories[0]?.id || '',
            image: ''
        });
        setShowModal(true);
    };

    const openEditModal = (snake) => {
        setEditingSnake(snake);
        setFormData({
            name: snake.name,
            description: snake.description || '',
            price: snake.price.toString(),
            stock: snake.stock.toString(),
            color: snake.color || '',
            age: snake.age || '',
            gender: snake.gender || 'male',
            categoryId: snake.categoryId,
            image: snake.image || ''
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingSnake ? `/api/snakes/${editingSnake.id}` : '/api/snakes';
            const method = editingSnake ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    price: parseFloat(formData.price),
                    stock: parseInt(formData.stock),
                    categoryId: parseInt(formData.categoryId)
                })
            });

            if (response.ok) {
                fetchData();
                setShowModal(false);
            } else {
                const error = await response.json();
                alert(error.error || 'เกิดข้อผิดพลาด');
            }
        } catch (error) {
            console.error('Submit failed:', error);
            alert('ไม่สามารถบันทึกได้');
        }
    };

    const handleDelete = async (snake) => {
        if (!confirm(`ต้องการลบ "${snake.name}" หรือไม่?`)) return;

        try {
            const response = await fetch(`/api/snakes/${snake.id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                fetchData();
            } else {
                const error = await response.json();
                alert(error.error || 'ไม่สามารถลบได้');
            }
        } catch (error) {
            console.error('Delete failed:', error);
        }
    };

    return (
        <div className="space-y-4 sm:space-y-6 animate-fade-in p-1 sm:p-2">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">จัดการสต็อก</h1>
                    <p className="text-slate-400 mt-1 flex items-center gap-2 text-sm sm:text-base">
                        <Package size={14} className="text-emerald-400" />
                        รายการสินค้าทั้งหมด {snakes.length} รายการ
                    </p>
                </div>
                <button
                    onClick={openAddModal}
                    className="btn-primary flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 w-full sm:w-auto"
                >
                    <Plus size={18} />
                    เพิ่มสินค้าใหม่
                </button>
            </div>

            {/* Filters */}
            <div className="glass-card p-3 sm:p-4 flex flex-col gap-3 sm:flex-row sm:gap-4 sm:justify-between sm:items-center">
                <div className="relative w-full sm:w-96 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-emerald-400 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="ค้นหาชื่อ, รายละเอียด..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input-field pl-10 bg-slate-900/50 border-white/10 focus:border-emerald-500/50"
                    />
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-none">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <select
                            value={selectedCategory || ''}
                            onChange={(e) => setSelectedCategory(e.target.value ? parseInt(e.target.value) : null)}
                            className="input-field pl-10 w-full sm:w-48 bg-slate-900/50 border-white/10 appearance-none cursor-pointer hover:border-emerald-500/30 transition-colors"
                        >
                            <option value="">ทุกหมวดหมู่</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Products - Mobile Card View */}
            <div className="sm:hidden space-y-3">
                {loading ? (
                    [...Array(4)].map((_, i) => (
                        <div key={i} className="glass-card p-4 animate-pulse">
                            <div className="flex gap-3">
                                <div className="w-16 h-16 rounded-lg bg-white/10"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-3/4 bg-white/10 rounded"></div>
                                    <div className="h-3 w-1/2 bg-white/10 rounded"></div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : filteredSnakes.length === 0 ? (
                    <div className="glass-card p-8 text-center">
                        <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-4">
                            <Package size={28} className="text-slate-500" />
                        </div>
                        <p className="text-slate-400 font-medium">ไม่พบสินค้า</p>
                        <p className="text-slate-500 text-sm mt-1">ลองปรับตัวกรองหรือเพิ่มสินค้าใหม่</p>
                    </div>
                ) : (
                    filteredSnakes.map((snake) => (
                        <div key={snake.id} className="glass-card p-3 border border-white/5 hover:border-white/10 transition-colors">
                            <div className="flex gap-3">
                                {/* Thumbnail */}
                                <div className="w-16 h-16 rounded-lg bg-slate-800 overflow-hidden flex-shrink-0 border border-white/5">
                                    {snake.image ? (
                                        <img src={snake.image} alt={snake.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xl">🐍</div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start gap-2">
                                        <h4 className="font-medium text-white text-sm truncate flex-1">{snake.name}</h4>
                                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border flex-shrink-0 ${snake.stock === 0 ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                            snake.stock <= 2 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                            }`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${snake.stock === 0 ? 'bg-red-400' :
                                                snake.stock <= 2 ? 'bg-amber-400' :
                                                    'bg-emerald-400'
                                                }`}></div>
                                            {snake.stock === 0 ? 'หมด' : `${snake.stock} ตัว`}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-0.5 rounded">{snake.category?.name}</span>
                                        <span className={`w-2 h-2 rounded-full ${snake.gender === 'male' ? 'bg-blue-400' : 'bg-pink-400'}`}></span>
                                        <span className="text-xs text-slate-500">{snake.gender === 'male' ? 'ผู้' : 'เมีย'}</span>
                                    </div>

                                    <div className="flex justify-between items-center mt-2">
                                        <span className="font-bold text-emerald-400 text-sm">{formatCurrency(snake.price)}</span>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => openEditModal(snake)}
                                                className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 hover:bg-blue-500 hover:text-white transition-all"
                                            >
                                                <Edit size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(snake)}
                                                className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white transition-all"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Products Table - Desktop */}
            <div className="hidden sm:block glass-card overflow-hidden border border-white/5 bg-slate-900/40">
                {loading ? (
                    <div className="p-8 space-y-4">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="flex gap-4 animate-pulse">
                                <div className="w-16 h-16 rounded-lg bg-white/5"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-48 bg-white/5 rounded"></div>
                                    <div className="h-3 w-32 bg-white/5 rounded"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredSnakes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                        <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mb-4 ring-1 ring-white/10">
                            <Package size={32} className="opacity-50" />
                        </div>
                        <p className="text-lg font-medium">ไม่พบสินค้า</p>
                        <p className="text-sm opacity-60">ลองปรับตัวกรองหรือเพิ่มสินค้าใหม่</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10 bg-white/[0.02]">
                                    <th className="text-left py-4 px-4 lg:px-6 text-slate-400 font-semibold text-xs uppercase tracking-wider">สินค้า</th>
                                    <th className="text-left py-4 px-4 lg:px-6 text-slate-400 font-semibold text-xs uppercase tracking-wider hidden lg:table-cell">หมวดหมู่</th>
                                    <th className="text-left py-4 px-4 lg:px-6 text-slate-400 font-semibold text-xs uppercase tracking-wider">ราคา</th>
                                    <th className="text-left py-4 px-4 lg:px-6 text-slate-400 font-semibold text-xs uppercase tracking-wider">สถานะ</th>
                                    <th className="text-left py-4 px-4 lg:px-6 text-slate-400 font-semibold text-xs uppercase tracking-wider hidden xl:table-cell">ลักษณะ</th>
                                    <th className="text-right py-4 px-4 lg:px-6 text-slate-400 font-semibold text-xs uppercase tracking-wider">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredSnakes.map((snake, index) => (
                                    <tr
                                        key={snake.id}
                                        className="hover:bg-white/[0.03] transition-colors group"
                                        style={{ animationDelay: `${index * 0.05}s` }}
                                    >
                                        <td className="py-4 px-4 lg:px-6">
                                            <div className="flex items-center gap-3 lg:gap-4">
                                                <div className="w-12 h-12 lg:w-16 lg:h-12 rounded-lg bg-slate-800 overflow-hidden flex-shrink-0 border border-white/5 group-hover:border-emerald-500/30 transition-colors">
                                                    {snake.image ? (
                                                        <img src={snake.image} alt={snake.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-lg lg:text-xl">🐍</div>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="font-medium text-white group-hover:text-emerald-400 transition-colors text-sm lg:text-base truncate max-w-[120px] lg:max-w-none">{snake.name}</h4>
                                                    <p className="text-xs text-slate-400 line-clamp-1 mt-0.5 hidden lg:block">{snake.description || '-'}</p>
                                                    {/* Mobile category badge */}
                                                    <span className="lg:hidden inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-700/50 text-slate-300 border border-white/5">
                                                        {snake.category?.name}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 lg:px-6 hidden lg:table-cell">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-700/50 text-slate-300 border border-white/5">
                                                {snake.category?.name}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 lg:px-6 font-bold text-white tracking-wide text-sm lg:text-base">
                                            {formatCurrency(snake.price)}
                                        </td>
                                        <td className="py-4 px-4 lg:px-6">
                                            <div className={`inline-flex items-center gap-1.5 px-2 lg:px-2.5 py-1 rounded-full text-[10px] lg:text-xs font-medium border ${snake.stock === 0 ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                snake.stock <= 2 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                }`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${snake.stock === 0 ? 'bg-red-400' :
                                                    snake.stock <= 2 ? 'bg-amber-400' :
                                                        'bg-emerald-400'
                                                    }`}></div>
                                                {snake.stock === 0 ? 'สินค้าหมด' : `${snake.stock} ตัว`}
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 lg:px-6 hidden xl:table-cell">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                                    <span className={`w-2 h-2 rounded-full ${snake.gender === 'male' ? 'bg-blue-400' : 'bg-pink-400'}`}></span>
                                                    {snake.gender === 'male' ? 'ตัวผู้' : 'ตัวเมีย'}
                                                </div>
                                                {snake.color && <span className="text-xs text-slate-500">{snake.color}</span>}
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 lg:px-6 text-right">
                                            <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => openEditModal(snake)}
                                                    className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 hover:bg-blue-500 hover:text-white transition-all duration-200"
                                                    title="แก้ไข"
                                                >
                                                    <Edit size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(snake)}
                                                    className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white transition-all duration-200"
                                                    title="ลบ"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-3 sm:p-4">
                    <div className="glass-card w-full max-w-2xl overflow-hidden shadow-2xl border border-white/10 scale-100 animate-slide-in max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-white/5 bg-white/[0.02] shrink-0">
                            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 sm:gap-3">
                                <div className="p-1.5 sm:p-2 bg-emerald-500/10 rounded-lg">
                                    {editingSnake ? <Edit size={18} className="text-emerald-400" /> : <Plus size={18} className="text-emerald-400" />}
                                </div>
                                {editingSnake ? 'แก้ไขข้อมูลสินค้า' : 'เพิ่มสินค้าใหม่'}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5 bg-slate-900/40 overflow-y-auto flex-1">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                                <div className="col-span-1 sm:col-span-2">
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">ชื่อสินค้า *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="input-field"
                                        placeholder="ระบุชื่อสินค้า (เช่น Corn Snake - Snow)"
                                        required
                                    />
                                </div>

                                <div className="col-span-1 sm:col-span-2">
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">รายละเอียด</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="input-field h-20 sm:h-24 resize-none"
                                        placeholder="รายละเอียดเพิ่มเติมของสินค้า..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">ราคา (บาท) *</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">฿</span>
                                        <input
                                            type="number"
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                            className="input-field pl-8"
                                            min="0"
                                            step="0.01"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">จำนวนสต็อก *</label>
                                    <input
                                        type="number"
                                        value={formData.stock}
                                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                        className="input-field"
                                        min="0"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">หมวดหมู่ *</label>
                                    <select
                                        value={formData.categoryId}
                                        onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                                        className="input-field appearance-none"
                                        required
                                    >
                                        <option value="">เลือกหมวดหมู่</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">เพศ</label>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, gender: 'male' })}
                                            className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${formData.gender === 'male'
                                                ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                                                : 'bg-slate-800 border-white/5 text-slate-400 hover:bg-slate-700'
                                                }`}
                                        >
                                            ตัวผู้ ♂
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, gender: 'female' })}
                                            className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${formData.gender === 'female'
                                                ? 'bg-pink-500/20 border-pink-500/50 text-pink-400'
                                                : 'bg-slate-800 border-white/5 text-slate-400 hover:bg-slate-700'
                                                }`}
                                        >
                                            ตัวเมีย ♀
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">สี / ลวดลาย</label>
                                    <input
                                        type="text"
                                        value={formData.color}
                                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                        className="input-field"
                                        placeholder="เช่น เหลืองทอง, Albino"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">อายุ</label>
                                    <input
                                        type="text"
                                        value={formData.age}
                                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                        className="input-field"
                                        placeholder="เช่น 6 เดือน"
                                    />
                                </div>

                                <div className="col-span-1 sm:col-span-2">
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">URL รูปภาพ</label>
                                    <input
                                        type="url"
                                        value={formData.image}
                                        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                        className="input-field"
                                        placeholder="https://example.com/image.jpg"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 mt-2 border-t border-white/5">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="btn-secondary flex-1 py-3"
                                >
                                    ยกเลิก
                                </button>
                                <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 py-3">
                                    <Save size={18} />
                                    บันทึกข้อมูล
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
