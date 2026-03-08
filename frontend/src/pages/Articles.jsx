import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import {
    Search,
    Plus,
    Edit,
    Trash2,
    FileText,
    X,
    Save,
    Image,
    Eye,
    EyeOff
} from 'lucide-react';
import toast from 'react-hot-toast';
import ImageUpload from '../components/ImageUpload';

const API = import.meta.env.VITE_API_URL;
const BASE_URL = (() => {
    if (import.meta.env.VITE_BACKEND_URL) return import.meta.env.VITE_BACKEND_URL;
    if (API && API.startsWith('http')) return API.replace('/api', '');
    return 'https://api.dexterball.com';
})();

export default function Articles() {
    const { getToken } = useAuth();
    const [articles, setArticles] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingArticle, setEditingArticle] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        excerpt: '',
        image: '',
        category: '',
        author: '',
        published: true
    });

    useEffect(() => {
        fetchArticles();
    }, []);

    const fetchArticles = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API}/articles`, {
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            if (response.ok) {
                setArticles(await response.json());
            }
        } catch (error) {
            console.error('Failed to fetch articles:', error);
            toast.error('โหลดข้อมูลบทความไม่สำเร็จ');
        } finally {
            setLoading(false);
        }
    };

    const filteredArticles = articles.filter(article =>
        article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.content.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const openAddModal = () => {
        setEditingArticle(null);
        setFormData({
            title: '',
            content: '',
            excerpt: '',
            image: '',
            category: '',
            author: '',
            published: true
        });
        setShowModal(true);
    };

    const openEditModal = (article) => {
        setEditingArticle(article);
        setFormData({
            title: article.title,
            content: article.content,
            excerpt: article.excerpt || '',
            image: article.image || '',
            category: article.category || '',
            author: article.author || '',
            published: article.published
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingArticle ? `${API}/articles/${editingArticle.id}` : `${API}/articles`;
            const method = editingArticle ? 'PUT' : 'POST';
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                toast.success(editingArticle ? 'แก้ไขบทความสำเร็จ' : 'เพิ่มบทความสำเร็จ');
                fetchArticles();
                setShowModal(false);
            } else {
                toast.error('บันทึกข้อมูลไม่สำเร็จ');
            }
        } catch (error) {
            console.error('Submit failed:', error);
            toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อ');
        }
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            const response = await fetch(`${API}/articles/${itemToDelete.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            if (response.ok) {
                toast.success('ลบบทความสำเร็จ');
                fetchArticles();
            } else {
                toast.error('ลบไม่สำเร็จ');
            }
        } catch (error) {
            console.error('Delete failed:', error);
            toast.error('เกิดข้อผิดพลาด');
        } finally {
            setItemToDelete(null);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in p-2">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">จัดการบทความ</h1>
                    <p className="text-slate-400 mt-1 flex items-center gap-2">
                        <FileText size={14} className="text-emerald-400" />
                        บทความทั้งหมด {articles.length} รายการ
                    </p>
                </div>
                <button
                    onClick={openAddModal}
                    className="btn-primary flex items-center gap-2 shadow-lg shadow-emerald-500/20 w-full sm:w-auto justify-center"
                >
                    <Plus size={18} />
                    เพิ่มบทความใหม่
                </button>
            </div>

            <div className="glass-card p-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="relative w-full sm:w-96 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-emerald-400 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="ค้นหาชื่อบทความ..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input-field pl-icon bg-slate-900/50 border-white/10"
                    />
                </div>
            </div>

            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/[0.02]">
                                <th className="text-left py-4 px-6 text-slate-400 font-semibold text-xs uppercase tracking-wider">ปก</th>
                                <th className="text-left py-4 px-6 text-slate-400 font-semibold text-xs uppercase tracking-wider">ชื่อบทความ</th>
                                <th className="text-left py-4 px-6 text-slate-400 font-semibold text-xs uppercase tracking-wider">หมวดหมู่</th>
                                <th className="text-left py-4 px-6 text-slate-400 font-semibold text-xs uppercase tracking-wider">สถานะ</th>
                                <th className="text-right py-4 px-6 text-slate-400 font-semibold text-xs uppercase tracking-wider">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                [...Array(3)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="5" className="px-6 py-8"><div className="h-8 bg-white/5 rounded"></div></td>
                                    </tr>
                                ))
                            ) : filteredArticles.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="py-20 text-center text-slate-500">ไม่พบข้อมูลบทความ</td>
                                </tr>
                            ) : (
                                filteredArticles.map((article) => (
                                    <tr key={article.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="py-4 px-6">
                                            <div className="w-16 h-10 rounded bg-slate-800 overflow-hidden border border-white/5">
                                                {article.image ? (
                                                    <img src={article.image.startsWith('http') ? article.image : `${BASE_URL}${article.image}`} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-600"><Image size={16} /></div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="font-medium text-white group-hover:text-emerald-400 transition-colors">{article.title}</div>
                                            <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{article.excerpt}</p>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-700/50 text-slate-300 border border-white/5">
                                                {article.category || '-'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${article.published ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                                                {article.published ? <Eye size={12} /> : <EyeOff size={12} />}
                                                {article.published ? 'เผยแพร่' : 'ร่าง'}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => openEditModal(article)} className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all"><Edit size={16} /></button>
                                                <button onClick={() => setItemToDelete(article)} className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && createPortal(
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="glass-card w-full max-w-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center p-6 border-b border-white/5 bg-white/[0.02]">
                            <h2 className="text-xl font-bold text-white flex items-center gap-3">
                                <div className="p-2 bg-emerald-500/10 rounded-lg">
                                    {editingArticle ? <Edit size={20} className="text-emerald-400" /> : <Plus size={20} className="text-emerald-400" />}
                                </div>
                                {editingArticle ? 'แก้ไขบทความ' : 'เพิ่มบทความใหม่'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"><X size={20} /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto bg-slate-900/40 custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">หัวข้อบทความ *</label>
                                    <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="input-field" placeholder="ระบุหัวข้อบทความ..." required />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">หมวดหมู่</label>
                                    <input type="text" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="input-field" placeholder="เช่น การดูแล, ความรู้ทั่วไป" />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">ผู้เขียน</label>
                                    <input type="text" value={formData.author} onChange={e => setFormData({ ...formData, author: e.target.value })} className="input-field" placeholder="ชื่อผู้เขียน" />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">คำโปรย (Excerpt)</label>
                                    <textarea value={formData.excerpt} onChange={e => setFormData({ ...formData, excerpt: e.target.value })} className="input-field h-20 resize-none" placeholder="สรุปสั้นๆ สำหรับหน้ารวมบทความ..." />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">เนื้อหาบทความ *</label>
                                    <textarea value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} className="input-field h-64 resize-y" placeholder="ใส่เนื้อหาบทความแบบละเอียด..." required />
                                </div>

                                <div className="md:col-span-2">
                                    <ImageUpload label="รูปปกบทความ" value={formData.image} onChange={val => setFormData({ ...formData, image: val })} type="article" />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="flex items-center gap-3 cursor-pointer py-2">
                                        <div className="relative">
                                            <input type="checkbox" checked={formData.published} onChange={e => setFormData({ ...formData, published: e.target.checked })} className="sr-only peer" />
                                            <div className="w-10 h-5 bg-slate-700 rounded-full peer-checked:bg-emerald-500 transition-colors"></div>
                                            <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5"></div>
                                        </div>
                                        <span className="text-sm text-slate-300 font-medium">เปิดใช้งาน (เผยแพร่)</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-white/5">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 py-3">ยกเลิก</button>
                                <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2 py-3"><Save size={18} />บันทึกบทความ</button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {/* Custom Delete Confirmation Modal */}
            {itemToDelete && createPortal(
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="glass-card w-full max-w-sm overflow-hidden shadow-2xl border border-white/10 p-6 text-center relative">
                        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4 relative">
                            <div className="absolute inset-0 rounded-full border-2 border-red-500/20 animate-ping"></div>
                            <Trash2 size={28} className="text-red-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">ยืนยันการลบ</h3>
                        <p className="text-slate-400 text-sm mb-6">คุณต้องการลบ "{itemToDelete.title}" ใช่หรือไม่?</p>
                        <div className="flex gap-3">
                            <button onClick={() => setItemToDelete(null)} className="flex-1 py-2.5 rounded-lg bg-white/5 text-slate-300 font-medium">ยกเลิก</button>
                            <button onClick={confirmDelete} className="flex-1 py-2.5 rounded-lg bg-red-500 text-white font-medium">ลบทันที</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
