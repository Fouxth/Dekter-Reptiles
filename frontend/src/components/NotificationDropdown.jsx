import { useNavigate } from 'react-router-dom';
import { Bell, Check, Trash2, ExternalLink, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';

export default function NotificationDropdown({
    notifications,
    onMarkRead,
    onMarkAllRead,
    onClearAll,
    onClose
}) {
    const navigate = useNavigate();
    const unreadCount = notifications.filter(n => !n.isRead).length;

    const handleItemClick = (n) => {
        if (!n.isRead) onMarkRead(n.id);
        if (n.link) navigate(n.link);
        onClose();
    };

    return (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 border border-white/10 bg-[#0f172a] shadow-2xl rounded-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                        <Bell size={18} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white leading-tight">การแจ้งเตือน</h3>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mt-0.5">
                            {unreadCount > 0 ? `${unreadCount} ข้อความใหม่` : 'ไม่มีข้อความใหม่'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    {unreadCount > 0 && (
                        <button
                            onClick={onMarkAllRead}
                            className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                            title="อ่านทั้งหมด"
                        >
                            <Check size={16} />
                        </button>
                    )}
                    <button
                        onClick={onClearAll}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="ล้างทั้งหมด"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                {notifications.length > 0 ? (
                    <div className="divide-y divide-white/5">
                        {notifications.map((n) => (
                            <div
                                key={n.id}
                                onClick={() => handleItemClick(n)}
                                className={`p-4 hover:bg-white/5 transition-all cursor-pointer relative group ${!n.isRead ? 'bg-emerald-500/5' : ''}`}
                            >
                                <div className="flex gap-3">
                                    <div className="shrink-0 mt-0.5">
                                        {n.type === 'low_stock' && <div className="p-2 rounded-lg bg-red-500/20 text-red-400"><Bell size={14} /></div>}
                                        {n.type === 'new_order' && <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400"><Bell size={14} /></div>}
                                        {n.type === 'sales_target' && <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400"><Bell size={14} /></div>}
                                        {n.type === 'order_status' && <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400"><Bell size={14} /></div>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <h4 className={`text-sm font-semibold truncate ${!n.isRead ? 'text-white' : 'text-slate-300'}`}>
                                                {n.title}
                                            </h4>
                                            {!n.isRead && <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1.5" />}
                                        </div>
                                        <p className={`text-xs mt-1 leading-relaxed ${!n.isRead ? 'text-slate-200' : 'text-slate-400'}`}>
                                            {n.message}
                                        </p>
                                        <div className="flex items-center gap-3 mt-2">
                                            <div className="flex items-center gap-1 text-[10px] text-slate-500">
                                                <Clock size={10} />
                                                <span>{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: th })}</span>
                                            </div>
                                            {n.link && (
                                                <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                                                    ดูรายละเอียด <ExternalLink size={10} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-12 px-8 text-center">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-slate-700 mx-auto mb-4">
                            <Bell size={32} />
                        </div>
                        <p className="text-sm text-slate-400 font-medium">ไม่มีการแจ้งเตือน</p>
                        <p className="text-xs text-slate-600 mt-1">ข้อความใหม่ของคุณจะแสดงที่นี่</p>
                    </div>
                )}
            </div>

            {/* Footer */}
            {notifications.length > 5 && (
                <div className="p-3 bg-white/5 border-t border-white/5 text-center">
                    <button
                        onClick={onClose}
                        className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
                    >
                        ปิดหน้าต่าง
                    </button>
                </div>
            )}
        </div>
    );
}
