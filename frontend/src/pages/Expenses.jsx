import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    Plus, Search, Calendar, ChevronLeft, ChevronRight,
    Trash2, Edit, DollarSign, Tag, FileText
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';

const API = import.meta.env.VITE_API_URL || 'http://103.142.150.196:5000/api';

export default function Expenses() {
    const { getToken, user } = useAuth();
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const [showModal, setShowModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [editingExpense, setEditingExpense] = useState(null);
    const [formData, setFormData] = useState({
        amount: '',
        description: '',
        category: 'อื่นๆ',
        date: new Date().toISOString().split('T')[0]
    });

    const categories = ['หนูแช่แข็ง', 'อุปกรณ์เลี้ยง', 'ค่าไฟ/น้ำ', 'ค่าเช่าที่', 'เงินเดือนพนักงาน', 'การตลาด', 'อื่นๆ'];

    async function fetchExpenses() {
        setLoading(true);
        try {
            const res = await fetch(`${API}/expenses?year=${selectedYear}&month=${selectedMonth}`, {
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            if (res.ok) setExpenses(await res.json());
        } catch (err) {
            console.error(err);
            toast.error('ไม่สามารถโหลดข้อมูลรายจ่ายได้');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { fetchExpenses(); }, [selectedMonth, selectedYear]);

    async function handleSubmit(e) {
        e.preventDefault();
        try {
            const method = editingExpense ? 'PUT' : 'POST';
            const url = editingExpense ? `${API}/expenses/${editingExpense.id}` : `${API}/expenses`;
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
                body: JSON.stringify({ ...formData, userId: user?.id })
            });
            if (res.ok) {
                toast.success(editingExpense ? 'แก้ไขสำเร็จ' : 'บันทึกสำเร็จ');
                setShowModal(false);
                setEditingExpense(null);
                setFormData({ amount: '', description: '', category: 'อื่นๆ', date: new Date().toISOString().split('T')[0] });
                fetchExpenses();
            } else {
                const data = await res.json();
                toast.error(data.error || 'เกิดข้อผิดพลาด');
            }
        } catch (err) {
            console.error(err);
            toast.error('เกิดข้อผิดพลาด');
        }
    }

    async function confirmDelete() {
        if (!itemToDelete) return;
        try {
            const res = await fetch(`${API}/expenses/${itemToDelete.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            if (res.ok) {
                toast.success('ลบสำเร็จ');
                fetchExpenses();
            } else {
                toast.error('เกิดข้อผิดพลาด');
            }
        } catch (err) {
            console.error(err);
            toast.error('เกิดข้อผิดพลาด');
        } finally {
            setItemToDelete(null);
        }
    }

    const filteredExpenses = expenses.filter(e =>
        e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalInView = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

    const monthsLong = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];

    function changeMonth(delta) {
        let newMonth = selectedMonth + delta;
        let newYear = selectedYear;
        if (newMonth > 12) { newMonth = 1; newYear++; }
        if (newMonth < 1) { newMonth = 12; newYear--; }
        setSelectedMonth(newMonth);
        setSelectedYear(newYear);
    }

    return (
        <div className="space-y-4 sm:space-y-6 animate-fade-in p-1 sm:p-2">
            <div className="flex justify-between items-end flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
                        <DollarSign size={24} className="text-red-400" /> รายจ่าย
                    </h1>
                    <p className="text-slate-400 mt-1 text-sm sm:text-base">จัดการรายจ่ายประจำเดือน</p>
                </div>
                <button
                    onClick={() => { setEditingExpense(null); setFormData({ amount: '', description: '', category: 'อื่นๆ', date: new Date().toISOString().split('T')[0] }); setShowModal(true); }}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus size={18} /> บันทึกรายจ่าย
                </button>
            </div>

            {/* Filter & Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-card p-4 col-span-1 md:col-span-2 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-white/5 rounded-full transition-colors"><ChevronLeft size={20} className="text-slate-400" /></button>
                        <div className="text-center min-w-[120px]">
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{selectedYear + 543}</p>
                            <p className="text-lg font-bold text-white">{monthsLong[selectedMonth - 1]}</p>
                        </div>
                        <button onClick={() => changeMonth(1)} className="p-2 hover:bg-white/5 rounded-full transition-colors"><ChevronRight size={20} className="text-slate-400" /></button>
                    </div>
                    <div className="hidden sm:block h-10 w-px bg-white/10 mx-4"></div>
                    <div className="relative flex-1 max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input
                            type="text"
                            placeholder="ค้นหารายจ่าย..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="input-field w-full pl-10 py-2 text-sm"
                        />
                    </div>
                </div>

                <div className="glass-card p-4 border border-red-500/20 bg-red-500/5">
                    <p className="text-xs text-red-400/70 font-bold uppercase tracking-widest mb-1">รายจ่ายรวม</p>
                    <p className="text-2xl font-bold text-red-400">฿{totalInView.toLocaleString('th-TH')}</p>
                    <p className="text-[10px] text-slate-500 mt-1">จากรายการที่แสดง {filteredExpenses.length} รายการ</p>
                </div>
            </div>

            {/* Table */}
            <div className="glass-card overflow-hidden border border-white/5">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/5">
                                <th className="py-4 px-4 text-slate-400 font-semibold text-xs tracking-wider">วันที่</th>
                                <th className="py-4 px-4 text-slate-400 font-semibold text-xs tracking-wider">รายละเอียด</th>
                                <th className="py-4 px-4 text-slate-400 font-semibold text-xs tracking-wider">หมวดหมู่</th>
                                <th className="py-4 px-4 text-slate-400 font-semibold text-xs tracking-wider text-right">จำนวนเงิน</th>
                                <th className="py-4 px-4 text-slate-400 font-semibold text-xs tracking-wider">ผู้บันทึก</th>
                                <th className="py-4 px-4 text-slate-400 font-semibold text-xs tracking-wider text-right">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr><td colSpan={6} className="py-20 text-center"><div className="spinner mx-auto" /></td></tr>
                            ) : filteredExpenses.length === 0 ? (
                                <tr><td colSpan={6} className="py-20 text-center text-slate-500">ไม่พบข้อมูลรายจ่าย</td></tr>
                            ) : filteredExpenses.map(e => (
                                <tr key={e.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="py-4 px-4 text-sm text-slate-300">
                                        {new Date(e.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                                    </td>
                                    <td className="py-4 px-4 text-sm font-medium text-white">{e.description}</td>
                                    <td className="py-4 px-4">
                                        <span className="inline-flex px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20 text-[10px]">
                                            {e.category}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4 text-sm font-bold text-red-400 text-right">฿{e.amount.toLocaleString('th-TH')}</td>
                                    <td className="py-4 px-4 text-xs text-slate-500">{e.user?.name || '-'}</td>
                                    <td className="py-4 px-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => { setEditingExpense(e); setFormData({ amount: e.amount, description: e.description, category: e.category, date: new Date(e.date).toISOString().split('T')[0] }); setShowModal(true); }}
                                                className="p-1.5 hover:bg-blue-500/20 rounded-lg text-blue-400 transition-colors"
                                            ><Edit size={16} /></button>
                                            <button
                                                onClick={() => setItemToDelete(e)}
                                                className="p-1.5 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors"
                                            ><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="glass-card w-full max-w-md p-6 border border-white/10 animate-in zoom-in-95 duration-200 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                {editingExpense ? <Edit size={20} className="text-blue-400" /> : <Plus size={20} className="text-emerald-400" />}
                                {editingExpense ? 'แก้ไขรายจ่าย' : 'บันทึกรายจ่ายใหม่'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition-colors">
                                <Plus size={24} className="rotate-45" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">รายละเอียด</label>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-3 text-slate-500" size={18} />
                                    <textarea
                                        required
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="เช่น ซื้อหนู 50 ตัว, ค่าไฟเดือน ม.ค."
                                        rows={2}
                                        className="input-field w-full pl-10"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1.5">จำนวนเงิน (฿)</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                        <input
                                            required
                                            type="number"
                                            value={formData.amount}
                                            onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                            placeholder="0"
                                            className="input-field w-full pl-10"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1.5">วันที่</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                        <input
                                            required
                                            type="date"
                                            value={formData.date}
                                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                                            className="input-field w-full pl-10"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">หมวดหมู่</label>
                                <div className="relative">
                                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                    <select
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        className="input-field w-full pl-10 appearance-none bg-slate-900"
                                    >
                                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-slate-300 font-bold hover:bg-white/5 transition-all active:scale-95"
                                >ยกเลิก</button>
                                <button
                                    type="submit"
                                    className="flex-1 btn-primary"
                                >{editingExpense ? 'บันทึกการแก้ไข' : 'ยืนยันการบันทึก'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={!!itemToDelete}
                onClose={() => setItemToDelete(null)}
                onConfirm={confirmDelete}
                title="ยืนยันการลบรายจ่าย"
                message="คุณต้องการลบรายการรายจ่ายนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้"
                itemName={itemToDelete?.description}
            />
        </div>
    );
}
