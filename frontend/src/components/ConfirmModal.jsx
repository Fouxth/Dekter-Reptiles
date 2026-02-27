import React from 'react';
import { createPortal } from 'react-dom';
import { Trash2, AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title = 'ยืนยันการดำเนินการ',
    message = 'คุณแน่ใจหรือไม่ว่าต้องการดำเนินการนี้?',
    confirmText = 'ยืนยัน',
    cancelText = 'ยกเลิก',
    variant = 'danger', // danger, warning, primary
    itemName = ''
}) {
    if (!isOpen) return null;

    const variantStyles = {
        danger: {
            icon: <Trash2 size={28} className="text-red-400" />,
            iconBg: 'bg-red-500/10',
            confirmBtn: 'bg-red-500 hover:bg-red-400 shadow-red-500/20',
            pingColor: 'border-red-500/20'
        },
        warning: {
            icon: <AlertTriangle size={28} className="text-amber-400" />,
            iconBg: 'bg-amber-500/10',
            confirmBtn: 'bg-amber-500 hover:bg-amber-400 shadow-amber-500/20',
            pingColor: 'border-amber-500/20'
        },
        primary: {
            icon: <AlertTriangle size={28} className="text-blue-400" />,
            iconBg: 'bg-blue-500/10',
            confirmBtn: 'bg-blue-500 hover:bg-blue-400 shadow-blue-500/20',
            pingColor: 'border-blue-500/20'
        }
    };

    const style = variantStyles[variant] || variantStyles.danger;

    return createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] animate-fade-in p-4">
            <div className="glass-card w-full max-w-sm overflow-hidden shadow-2xl border border-white/10 scale-100 animate-slide-in relative">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="p-6 text-center">
                    <div className={`w-16 h-16 rounded-full ${style.iconBg} flex items-center justify-center mx-auto mb-4 relative`}>
                        <div className={`absolute inset-0 rounded-full border-2 ${style.pingColor} animate-ping`}></div>
                        {style.icon}
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                    <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                        {message}
                        {itemName && (
                            <span className="block mt-1 text-white font-medium italic">"{itemName}"</span>
                        )}
                        <span className="block mt-2 text-[10px] uppercase tracking-wider text-slate-500 font-bold opacity-50 italic">การกระทำนี้ไม่สามารถย้อนกลับได้</span>
                    </p>

                    <div className="flex gap-3 mt-8">
                        <button
                            onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-medium transition-all active:scale-95"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className={`flex-1 py-2.5 rounded-xl ${style.confirmBtn} text-white font-bold shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
