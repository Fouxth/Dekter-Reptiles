import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { createPortal } from 'react-dom';
import {
    Folder,
    Plus,
    Edit,
    Trash2,
    Search,
    X,
    Save,
    Image as ImageIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';

const API = import.meta.env.VITE_API_URL;
const BASE_URL = API.replace('/api', '');

export default function Categories() {
    const { getToken } = useAuth();
    const [categories, setCategories] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        image: ''
    });
    const [itemToDelete, setItemToDelete] = useState(null);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await fetch(`${API}/categories`, {
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            if (res.ok) {
                setCategories(await res.json());
            } else {
                toast.error('Failed to fetch categories');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Connection error');
        } finally {
            setLoading(false);
        }
    };

    const filteredCategories = categories.filter(cat =>
        cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cat.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const openAddModal = () => {
        setEditingCategory(null);
        setFormData({ name: '', description: '', image: '' });
        setShowModal(true);
    };

    const openEditModal = (category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            description: category.description || '',
            image: category.image || ''
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingCategory ? `${API}/categories/${editingCategory.id}` : `${API}/categories`;
            const method = editingCategory ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                toast.success(editingCategory ? 'อัปเดตหมวดหมู่สำเร็จ' : 'เพิ่มหมวดหมู่สำเร็จ');
                fetchCategories();
                setShowModal(false);
            } else {
                const data = await res.json();
                toast.error(data.error || 'เกิดข้อผิดพลาด');
            }
        } catch (error) {
            console.error('Submit error:', error);
            toast.error('Cannot connect to server');
        }
    };

    const handleDelete = (category) => {
        setItemToDelete(category);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;

        if (itemToDelete._count?.snakes > 0) {
            toast.error('ไม่สามารถลบหมวดหมู่ที่มีสินค้าอยู่ได้ กรุณาย้ายหรือลบสินค้าก่อน');
            setItemToDelete(null);
            return;
        }

        try {
            const res = await fetch(`${API}/categories/${itemToDelete.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            if (res.ok) {
                toast.success('ลบหมวดหมู่สำเร็จ');
                fetchCategories();
            } else {
                const data = await res.json();
                toast.error(data.error || 'เกิดข้อผิดพลาดในการลบ');
            }
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('Cannot connect to server');
        } finally {
            setItemToDelete(null);
        }
    };

    return (
        <div className="space-y-4 sm:space-y-6 animate-fade-in p-1 sm:p-2">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">หมวดหมู่สินค้า</h1>
                    <p className="text-slate-400 mt-1 flex items-center gap-2 text-sm sm:text-base">
                        <Folder size={14} className="text-emerald-400" />
                        จัดการประเภทสินค้าและสัตว์เลี้ยงทั้งหมด {categories.length} หมวดหมู่
                    </p>
                </div>
                <button
                    onClick={openAddModal}
                    className="btn-primary flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 w-full sm:w-auto"
                >
                    <Plus size={18} />
                    เพิ่มหมวดหมู่ใหม่
                </button>
            </div>

            {/* Filters */}
            <div className="glass-card p-3 sm:p-4">
                <div className="relative w-full sm:max-w-md group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-emerald-400 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="ค้นหาชื่อหมวดหมู่..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input-field pl-icon bg-slate-900/50 border-white/10 focus:border-emerald-500/50 w-full"
                    />
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {loading ? (
                    [...Array(4)].map((_, i) => (
                        <div key={i} className="glass-card p-4 animate-pulse h-32 flex items-center gap-4">
                            <div className="w-16 h-16 rounded-xl bg-white/5 shrink-0"></div>
                            <div className="space-y-2 flex-1">
                                <div className="h-5 w-3/4 bg-white/5 rounded"></div>
                                <div className="h-3 w-1/2 bg-white/5 rounded"></div>
                            </div>
                        </div>
                    ))
                ) : filteredCategories.length === 0 ? (
                    <div className="col-span-full glass-card p-12 flex flex-col items-center justify-center text-slate-400">
                        <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4 border border-white/5">
                            <Folder size={28} className="opacity-50" />
                        </div>
                        <p className="text-lg font-medium text-white mb-1">ยังไม่มีหมวดหมู่</p>
                        <p className="text-sm">เพิ่มหมวดหมู่แรกของคุณเพื่อเริ่มจัดกลุ่มสินค้า</p>
                    </div>
                ) : (
                    filteredCategories.map(category => (
                        <div key={category.id} className="glass-card p-5 border border-white/5 hover:border-emerald-500/30 transition-all duration-300 group flex flex-col h-full bg-slate-900/40">
                            <div className="flex items-start gap-4 mb-4">
                                <div className="w-16 h-16 rounded-xl bg-slate-800 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center shadow-inner relative group-hover:shadow-emerald-500/10 transition-shadow">
                                    {category.image ? (
                                        <img src={category.image.startsWith('http') ? category.image : `${BASE_URL}${category.image}`} alt={category.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <Folder size={24} className="text-slate-500 group-hover:scale-110 transition-transform" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-white text-lg truncate group-hover:text-emerald-400 transition-colors">{category.name}</h3>
                                    <p className="text-xs text-slate-400 line-clamp-2 mt-1 min-h-[32px]">{category.description || 'ไม่มีคำอธิบาย'}</p>
                                </div>
                            </div>

                            <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold shadow-sm">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                    {category._count?.snakes || 0} รายการ
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => openEditModal(category)}
                                        className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-300 hover:bg-blue-500 hover:text-white transition-all shadow-sm"
                                        title="แก้ไข"
                                    >
                                        <Edit size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(category)}
                                        className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-300 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                        title="ลบ"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {showModal && createPortal(
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
                    <div className="glass-card w-full max-w-lg overflow-hidden shadow-2xl border border-white/10 scale-100 animate-slide-in">
                        <div className="flex justify-between items-center p-5 border-b border-white/5 bg-white/[0.02]">
                            <h2 className="text-xl font-bold text-white flex items-center gap-3">
                                <div className="p-2 bg-emerald-500/10 rounded-lg">
                                    <Folder size={18} className="text-emerald-400" />
                                </div>
                                {editingCategory ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่ใหม่'}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-5 space-y-5 bg-slate-900/40">
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">ชื่อหมวดหมู่ *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="input-field"
                                    placeholder="เช่น งูคอร์น, อุปกรณ์, อาหาร"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">รายละเอียด</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="input-field h-24 resize-none"
                                    placeholder="คำอธิบายเพิ่มเติมเกี่ยวกับหมวดหมู่นี้..."
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">URL รูปภาพอ้างอิง</label>
                                <div className="relative">
                                    <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                    <input
                                        type="url"
                                        value={formData.image}
                                        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                        className="input-field"
                                        style={{ paddingLeft: '44px' }}
                                        placeholder="https://example.com/image.jpg"
                                    />
                                </div>
                                {formData.image && (
                                    <div className="mt-3 w-16 h-16 shrink-0 rounded-xl overflow-hidden border border-white/10 bg-slate-800">
                                        <img src={formData.image.startsWith('http') ? formData.image : `${BASE_URL}${formData.image}`} alt="Preview" className="w-full h-full object-cover" onError={(e) => e.target.style.display = 'none'} />
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-white/5">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="btn-secondary flex-1"
                                >
                                    ยกเลิก
                                </button>
                                <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2">
                                    <Save size={18} />
                                    บันทึก
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
            {/* Confirm Modal */}
            <ConfirmModal
                isOpen={!!itemToDelete}
                onClose={() => setItemToDelete(null)}
                onConfirm={confirmDelete}
                title="ยืนยันการลบหมวดหมู่"
                message="คุณต้องการลบหมวดหมู่นี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้"
                itemName={itemToDelete?.name}
            />
        </div>
    );
}
