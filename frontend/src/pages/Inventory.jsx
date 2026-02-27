import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
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
    ExternalLink,
    ListPlus
} from 'lucide-react';
import toast from 'react-hot-toast';
import ImageUpload from '../components/ImageUpload';

const API = import.meta.env.VITE_API_URL || 'http://103.142.150.196:5000/api';

const capitalize = (str) => {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export default function Inventory() {
    const navigate = useNavigate();
    const [snakes, setSnakes] = useState([]);
    const [categories, setCategories] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [bulkItems, setBulkItems] = useState([
        { name: '', amount: '1', price: '', cost: '', categoryId: '', stock: '' }
    ]);
    const [editingSnake, setEditingSnake] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        cost: '',
        stock: '',
        color: '',
        genetics: '',
        dateOfBirth: '',
        gender: 'male',
        categoryId: '',
        adminImage: '',
        customerImage: '',
        code: '',
        species: '',
        morph: '',
        year: '',
        feedSize: '',
        forSale: false
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [snakesRes, categoriesRes] = await Promise.all([
                fetch(`${API}/snakes`),
                fetch(`${API}/categories`)
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
            cost: '',
            stock: '',
            color: '',
            genetics: '',
            dateOfBirth: '',
            gender: 'male',
            categoryId: categories[0]?.id || '',
            adminImage: '',
            customerImage: '',
            code: '',
            species: '',
            morph: '',
            year: '',
            feedSize: '',
            forSale: false
        });
        setShowModal(true);
    };

    const openEditModal = (snake) => {
        setEditingSnake(snake);
        setFormData({
            name: snake.name,
            description: snake.description || '',
            price: snake.price.toString(),
            cost: snake.cost?.toString() || '',
            stock: snake.stock.toString(),
            color: snake.color || '',
            genetics: snake.genetics || '',
            dateOfBirth: snake.dateOfBirth ? new Date(snake.dateOfBirth).toISOString().slice(0, 10) : '',
            gender: snake.gender || 'male',
            categoryId: snake.categoryId,
            adminImage: snake.adminImage || '',
            customerImage: snake.customerImage || '',
            code: snake.code || '',
            species: snake.species || '',
            morph: snake.morph || '',
            year: snake.year || '',
            feedSize: snake.feedSize || '',
            forSale: snake.forSale || false
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingSnake ? `${API}/snakes/${editingSnake.id}` : `${API}/snakes`;
            const method = editingSnake ? 'PUT' : 'POST';
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    price: parseFloat(formData.price),
                    cost: formData.cost ? parseFloat(formData.cost) : undefined,
                    stock: parseInt(formData.stock),
                    categoryId: parseInt(formData.categoryId),
                    code: formData.code || undefined,
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
            toast.error('ไม่สามารถบันทึกได้');
        }
    };

    const handleAddBulkRow = () => {
        setBulkItems([...bulkItems, { name: '', amount: '1', price: '', cost: '', categoryId: categories[0]?.id || '', stock: '' }]);
    };

    const handleRemoveBulkRow = (index) => {
        setBulkItems(bulkItems.filter((_, i) => i !== index));
    };

    const handleBulkChange = (index, field, value) => {
        const newItems = [...bulkItems];
        newItems[index][field] = value;
        setBulkItems(newItems);
    };

    const handleBulkSubmit = async (e) => {
        e.preventDefault();

        // Expand the items based on the 'amount' field (if they want to add multiple of the exact same entry as separate items, mostly for unique IDs if needed)
        // Wait, the prompt says "เพิ่มสินค้าทีละหลายตัว" - Usually in an inventory system, if they add 5 Pinky Mice, they just set stock=5 on one product row.
        // But for generic products like "Pinky", "Fuzzy", "Hopper" added all at once, each row represents an item.

        const validItems = bulkItems.filter(item => item.name && item.price && item.categoryId && item.stock);

        if (validItems.length === 0) {
            toast.error('กรุณากรอกข้อมูลให้ครบถ้วนอย่างน้อย 1 รายการ');
            return;
        }

        const payloadSnakes = validItems.map(item => ({
            name: item.name,
            price: parseFloat(item.price),
            cost: item.cost ? parseFloat(item.cost) : undefined,
            stock: parseInt(item.stock, 10),
            categoryId: parseInt(item.categoryId, 10),
            forSale: true
        }));

        try {
            const response = await fetch(`${API}/snakes/bulk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ snakes: payloadSnakes })
            });

            if (response.ok) {
                toast.success(`เพิ่มสินค้าทั้งหมด ${payloadSnakes.length} รายการแล้ว!`);
                fetchData();
                setShowBulkModal(false);
                setBulkItems([{ name: '', amount: '1', price: '', cost: '', categoryId: categories[0]?.id || '', stock: '' }]);
            } else {
                const error = await response.json();
                toast.error(error.error || 'ไม่สามารถเพิ่มสินค้ายกชุดได้');
            }
        } catch (error) {
            console.error('Bulk submit failed:', error);
            toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อ');
        }
    };

    const handleDeleteClick = (snake) => {
        setItemToDelete(snake);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            const response = await fetch(`${API}/snakes/${itemToDelete.id}`, { method: 'DELETE' });
            if (response.ok) {
                toast.success('ลบสินค้าสำเร็จ');
                fetchData();
            } else {
                const error = await response.json();
                toast.error(error.error || 'ไม่สามารถลบได้');
            }
        } catch (error) {
            console.error('Delete failed:', error);
            toast.error('เกิดข้อผิดพลาดในการลบสินค้า');
        } finally {
            setItemToDelete(null);
        }
    };

    // Helper to check if the selected category is for snakes
    const checkIsSnakeCategory = (categoryId) => {
        const cat = categories.find(c => c.id.toString() === categoryId?.toString());
        if (!cat) return true; // Default to true if not selected
        const name = cat.name.toLowerCase();
        return name.includes('งู') || name.includes('python') || name.includes('snake') || name.includes('hognose') || name.includes('boa');
    };

    const isSnakeCategory = checkIsSnakeCategory(formData.categoryId);

    return (
        <div className="space-y-4 sm:space-y-6 animate-fade-in p-1 sm:p-2">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">สินค้า</h1>
                    <p className="text-slate-400 mt-1 flex items-center gap-2 text-sm sm:text-base">
                        <Package size={14} className="text-emerald-400" />
                        รายการสินค้าทั้งหมด {snakes.length} รายการ
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <button
                        onClick={() => {
                            setBulkItems([{ name: '', amount: '1', price: '', cost: '', categoryId: categories[0]?.id || '', stock: '' }]);
                            setShowBulkModal(true);
                        }}
                        className="btn-secondary flex items-center justify-center gap-2 w-full sm:w-auto"
                    >
                        <Package size={18} className="text-blue-400" />
                        เพิ่มหลายตัว
                    </button>
                    <button
                        onClick={openAddModal}
                        className="btn-primary flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 w-full sm:w-auto"
                    >
                        <Plus size={18} />
                        เพิ่มสินค้าใหม่
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="glass-card p-3 sm:p-4 flex flex-col gap-3 sm:flex-row sm:gap-4 sm:justify-between sm:items-center">
                <div className="relative w-full sm:w-96 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-emerald-400 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="ค้นหาชื่อ, รายละเอียด..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input-field pl-icon bg-slate-900/50 border-white/10 focus:border-emerald-500/50"
                    />
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-none">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <select
                            value={selectedCategory || ''}
                            onChange={(e) => setSelectedCategory(e.target.value ? parseInt(e.target.value) : null)}
                            className="input-field pl-icon w-full sm:w-48 bg-slate-900/50 border-white/10 appearance-none cursor-pointer hover:border-emerald-500/30 transition-colors"
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
                                    {snake.adminImage ? (
                                        <img src={snake.adminImage.startsWith('http') ? snake.adminImage : `${API.replace('/api', '')}${snake.adminImage}`} alt={snake.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xl">🐍</div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start gap-2">
                                        <button onClick={() => navigate(`/snakes/${snake.id}`)} className="font-medium text-emerald-400 text-sm truncate flex-1 text-left active:opacity-70">{snake.name}</button>
                                        {snake.code && <span className="text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20 flex-shrink-0">{snake.code}</span>}
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

                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                        <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-0.5 rounded">{capitalize(snake.category?.name)}</span>
                                        {snake.morph && <span className="text-xs text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">{capitalize(snake.morph)}</span>}
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
                                                onClick={() => handleDeleteClick(snake)}
                                                className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-red-500/5 flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white transition-all duration-200"
                                            >
                                                <Trash2 size={16} />
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
                                    <th className="text-left py-4 px-3 lg:px-4 text-slate-400 font-semibold text-xs uppercase tracking-wider">รหัส</th>
                                    <th className="text-left py-4 px-3 lg:px-4 text-slate-400 font-semibold text-xs uppercase tracking-wider">สินค้า</th>
                                    <th className="text-left py-4 px-3 lg:px-4 text-slate-400 font-semibold text-xs uppercase tracking-wider hidden lg:table-cell">หมวดหมู่</th>
                                    <th className="text-left py-4 px-3 lg:px-4 text-slate-400 font-semibold text-xs uppercase tracking-wider">ราคา</th>
                                    <th className="text-left py-4 px-3 lg:px-4 text-slate-400 font-semibold text-xs uppercase tracking-wider">สถานะ</th>
                                    <th className="text-left py-4 px-3 lg:px-4 text-slate-400 font-semibold text-xs uppercase tracking-wider hidden xl:table-cell">ลักษณะ</th>
                                    <th className="text-right py-4 px-3 lg:px-4 text-slate-400 font-semibold text-xs uppercase tracking-wider">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredSnakes.map((snake, index) => (
                                    <tr
                                        key={snake.id}
                                        className="hover:bg-white/[0.03] transition-colors group"
                                        style={{ animationDelay: `${index * 0.05}s` }}
                                    >
                                        <td className="py-4 px-3 lg:px-4">
                                            {snake.code ? <span className="text-blue-400 text-sm font-semibold">{snake.code}</span> : <span className="text-slate-600 text-sm">-</span>}
                                        </td>
                                        <td className="py-4 px-3 lg:px-4">
                                            <div className="flex items-center gap-3 lg:gap-4">
                                                <div className="w-12 h-12 lg:w-16 lg:h-12 rounded-lg bg-slate-800 overflow-hidden flex-shrink-0 border border-white/5 group-hover:border-emerald-500/30 transition-colors">
                                                    {snake.adminImage ? (
                                                        <img src={snake.adminImage.startsWith('http') ? snake.adminImage : `${API.replace('/api', '')}${snake.adminImage}`} alt={snake.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-lg lg:text-xl">🐍</div>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <button
                                                        onClick={() => navigate(`/snakes/${snake.id}`)}
                                                        className="font-medium text-white group-hover:text-emerald-400 transition-colors text-sm lg:text-base truncate max-w-[120px] lg:max-w-none flex items-center gap-1 hover:underline"
                                                    >
                                                        {snake.name} <ExternalLink size={11} className="opacity-30 group-hover:opacity-100" />
                                                    </button>
                                                    {snake.morph && <span className="inline-flex text-[10px] text-purple-300 bg-purple-500/10 px-1.5 py-0.5 rounded mt-0.5">{capitalize(snake.morph)}</span>}
                                                    <p className="text-xs text-slate-400 line-clamp-1 mt-0.5 hidden lg:block">{snake.description || '-'}</p>
                                                    {/* Mobile category badge */}
                                                    <span className="lg:hidden inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-700/50 text-slate-300 border border-white/5">
                                                        {snake.category?.name}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-3 lg:px-4 hidden lg:table-cell">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-700/50 text-slate-300 border border-white/5">
                                                {snake.category?.name}
                                            </span>
                                        </td>
                                        <td className="py-4 px-3 lg:px-4 font-bold text-white tracking-wide text-sm lg:text-base">
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
                                            {checkIsSnakeCategory(snake.categoryId) ? (
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                                        <span className={`w-2 h-2 rounded-full ${snake.gender === 'male' ? 'bg-blue-400' : 'bg-pink-400'}`}></span>
                                                        {snake.gender === 'male' ? 'ตัวผู้' : 'ตัวเมีย'}
                                                    </div>
                                                    {snake.color && <span className="text-xs text-slate-500">{capitalize(snake.color)}</span>}
                                                    {snake.genetics && <span className="text-xs text-purple-400">🧬 {capitalize(snake.genetics)}</span>}
                                                </div>
                                            ) : (
                                                <span className="text-slate-600 text-sm">-</span>
                                            )}
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
                                                    onClick={() => handleDeleteClick(snake)}
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
            {showModal && createPortal(
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

                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">รหัสสินค้า (Code)</label>
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        className="input-field"
                                        placeholder="เช่น MDT0001, FS0001"
                                    />
                                </div>

                                {isSnakeCategory && (
                                    <>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">สายพันธุ์ (Species)</label>
                                            <input
                                                type="text"
                                                value={formData.species}
                                                onChange={(e) => setFormData({ ...formData, species: e.target.value })}
                                                className="input-field"
                                                placeholder="เช่น Ball Python, Hognose"
                                            />
                                        </div>

                                        <div className="col-span-1 sm:col-span-2">
                                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Morph</label>
                                            <input
                                                type="text"
                                                value={formData.morph}
                                                onChange={(e) => setFormData({ ...formData, morph: e.target.value })}
                                                className="input-field"
                                                placeholder="เช่น Pastel Pied, Spider Cinnamon Pastel Clown"
                                            />
                                        </div>
                                    </>
                                )}

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

                                {isSnakeCategory && (
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
                                )}

                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">ราคาทุน (บาท)</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">฿</span>
                                        <input
                                            type="number"
                                            value={formData.cost}
                                            onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                                            className="input-field pl-8"
                                            min="0" step="0.01"
                                            placeholder="ราคาต้นทุน"
                                        />
                                    </div>
                                </div>

                                {isSnakeCategory && (
                                    <>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">วันเกิด</label>
                                            <input
                                                type="date"
                                                value={formData.dateOfBirth}
                                                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                                                className="input-field"
                                            />
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
                                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Genetics</label>
                                            <input
                                                type="text"
                                                value={formData.genetics}
                                                onChange={(e) => setFormData({ ...formData, genetics: e.target.value })}
                                                className="input-field"
                                                placeholder="เช่น het Albino, Spider Ball Python"
                                            />
                                        </div>
                                    </>
                                )}

                                <div className="col-span-1 sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <ImageUpload
                                        label="รูปภาพพนักงาน (หลังบ้าน)"
                                        value={formData.adminImage}
                                        onChange={(val) => setFormData({ ...formData, adminImage: val })}
                                        type="admin"
                                    />
                                    <ImageUpload
                                        label="รูปภาพลูกค้า (หน้าเว็บ)"
                                        value={formData.customerImage}
                                        onChange={(val) => setFormData({ ...formData, customerImage: val })}
                                        type="customer"
                                    />
                                </div>

                                {isSnakeCategory && (
                                    <>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">ปีเกิด (Year)</label>
                                            <input
                                                type="text"
                                                value={formData.year}
                                                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                                                className="input-field"
                                                placeholder="เช่น 25, 26"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">ขนาดอาหาร (Feed Size)</label>
                                            <select
                                                value={formData.feedSize}
                                                onChange={(e) => setFormData({ ...formData, feedSize: e.target.value })}
                                                className="input-field appearance-none"
                                            >
                                                <option value="">ไม่ระบุ</option>
                                                <option value="Pinky">Pinky (แรกเกิด)</option>
                                                <option value="Fuzzy">Fuzzy</option>
                                                <option value="Hopper">Hopper</option>
                                                <option value="S">S</option>
                                                <option value="M">M</option>
                                                <option value="L">L</option>
                                                <option value="XL">XL</option>
                                                <option value="RXL">RXL</option>
                                            </select>
                                        </div>
                                    </>
                                )}

                                <div className="col-span-1 sm:col-span-2">
                                    <label className="flex items-center gap-3 cursor-pointer py-2">
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                checked={formData.forSale}
                                                onChange={(e) => setFormData({ ...formData, forSale: e.target.checked })}
                                                className="sr-only peer"
                                            />
                                            <div className="w-10 h-5 bg-slate-700 rounded-full peer-checked:bg-emerald-500 transition-colors"></div>
                                            <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5"></div>
                                        </div>
                                        <span className="text-sm text-slate-300 font-medium">พร้อมขาย (For Sale)</span>
                                    </label>
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
                </div>,
                document.body
            )}

            {/* Bulk Add Modal */}
            {
                showBulkModal && createPortal(
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-3 sm:p-4">
                        <div className="glass-card w-full max-w-5xl overflow-hidden shadow-2xl border border-white/10 scale-100 animate-slide-in max-h-[90vh] flex flex-col">
                            <div className="flex justify-between items-center p-4 sm:p-6 border-b border-white/5 bg-white/[0.02] shrink-0">
                                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 sm:gap-3">
                                    <div className="p-1.5 sm:p-2 bg-blue-500/10 rounded-lg">
                                        <ListPlus size={18} className="text-blue-400" />
                                    </div>
                                    เพิ่มสินค้าหลายรายการ
                                </h2>
                                <button
                                    onClick={() => setShowBulkModal(false)}
                                    className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleBulkSubmit} className="flex flex-col flex-1 overflow-hidden">
                                <div className="p-4 sm:p-6 overflow-y-auto bg-slate-900/40 custom-scrollbar flex-1">
                                    <div className="space-y-4">
                                        {bulkItems.map((item, index) => (
                                            <div key={index} className="flex flex-col lg:flex-row gap-3 items-start lg:items-center bg-white/5 p-4 rounded-xl border border-white/5 relative group">
                                                {/* Delete row button */}
                                                {bulkItems.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveBulkRow(index)}
                                                        className="absolute -top-2 -right-2 lg:static lg:top-auto lg:right-auto w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-red-500/20 lg:bg-white/5 flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white transition-all shadow-md lg:shadow-none z-10"
                                                        title="ลบแถวนี้"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                )}

                                                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 w-full">
                                                    <div className="lg:col-span-2">
                                                        <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">ชื่อสินค้า *</label>
                                                        <input
                                                            type="text"
                                                            value={item.name}
                                                            onChange={(e) => handleBulkChange(index, 'name', e.target.value)}
                                                            className="input-field text-sm py-2"
                                                            placeholder="เช่น หนูแช่แข็ง (Pinky)"
                                                            required
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">หมวดหมู่ *</label>
                                                        <select
                                                            value={item.categoryId}
                                                            onChange={(e) => handleBulkChange(index, 'categoryId', e.target.value)}
                                                            className="input-field appearance-none text-sm py-2"
                                                            required
                                                        >
                                                            <option value="">เลือก</option>
                                                            {categories.map(cat => (
                                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    <div>
                                                        <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">ราคาขาย *</label>
                                                        <input
                                                            type="number"
                                                            value={item.price}
                                                            onChange={(e) => handleBulkChange(index, 'price', e.target.value)}
                                                            className="input-field text-sm py-2"
                                                            min="0" step="0.01"
                                                            placeholder="฿"
                                                            required
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">ราคาทุน</label>
                                                        <input
                                                            type="number"
                                                            value={item.cost}
                                                            onChange={(e) => handleBulkChange(index, 'cost', e.target.value)}
                                                            className="input-field text-sm py-2"
                                                            min="0" step="0.01"
                                                            placeholder="฿"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">จำนวน *</label>
                                                        <input
                                                            type="number"
                                                            value={item.stock}
                                                            onChange={(e) => handleBulkChange(index, 'stock', e.target.value)}
                                                            className="input-field text-sm py-2"
                                                            min="1"
                                                            placeholder="จำนวนสต็อก"
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-4 flex justify-center">
                                        <button
                                            type="button"
                                            onClick={handleAddBulkRow}
                                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 border-dashed transition-colors text-sm font-medium w-full lg:w-auto justify-center"
                                        >
                                            <Plus size={16} />
                                            เพิ่มแถวสินค้า
                                        </button>
                                    </div>
                                </div>

                                <div className="p-4 sm:p-6 border-t border-white/5 flex flex-col-reverse sm:flex-row gap-3 bg-white/[0.02] shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => setShowBulkModal(false)}
                                        className="btn-secondary flex-1 py-3"
                                    >
                                        ยกเลิก
                                    </button>
                                    <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 ring-blue-500/50">
                                        <Save size={18} />
                                        บันทึกสินค้าทั้งหมด ({bulkItems.length} รายการ)
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>,
                    document.body
                )}

            {/* Custom Delete Confirmation Modal */}
            {itemToDelete && createPortal(
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
                    <div className="glass-card w-full max-w-sm overflow-hidden shadow-2xl border border-white/10 scale-100 animate-slide-in p-6 text-center relative">
                        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4 relative">
                            <div className="absolute inset-0 rounded-full border-2 border-red-500/20 animate-ping"></div>
                            <Trash2 size={28} className="text-red-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">ยืนยันการลบสินค้า</h3>
                        <p className="text-slate-400 text-sm mb-6">คุณต้องการลบ "<span className="text-white font-medium">{itemToDelete.name}</span>" ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้</p>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setItemToDelete(null)}
                                className="flex-1 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 font-medium transition-colors"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="flex-1 py-2.5 rounded-lg bg-red-500 hover:bg-red-400 text-white font-medium shadow-lg shadow-red-500/20 transition-all flex items-center justify-center gap-2"
                            >
                                <Trash2 size={16} /> ลบทันที
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
