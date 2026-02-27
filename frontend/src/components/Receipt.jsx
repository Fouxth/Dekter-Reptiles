import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Printer, X, Check } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://103.142.150.196:5000/api';

function formatCurrency(n, currencySymbol = '฿') {
    return `${currencySymbol}${n?.toLocaleString('th-TH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }) ?? '0.00'}`;
}

const capitalize = (str) => {
    if (!str) return str;
    return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
};

export default function Receipt({ order, onClose }) {
    const receiptRef = useRef(null);
    const [settings, setSettings] = useState({});
    const [, setLoadingSettings] = useState(true);

    useEffect(() => {
        async function fetchSettings() {
            try {
                const res = await fetch(`${API}/settings`);
                if (res.ok) {
                    const data = await res.json();
                    setSettings(data);
                }
            } catch (err) {
                console.error('Failed to fetch settings:', err);
            } finally {
                setLoadingSettings(false);
            }
        }
        fetchSettings();
    }, []);

    // Close on Escape
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    function handlePrint() {
        const printWindow = window.open('', '_blank');


        printWindow.document.write(`
            <html>
                <head>
                    <title>หนีบิล - ${order.orderNo}</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap');
                        body { 
                            font-family: 'Sarabun', sans-serif; 
                            width: 80mm; 
                            margin: 0; 
                            padding: 10mm;
                            font-size: 12px;
                        }
                        .center { text-align: center; }
                        .bold { font-weight: bold; }
                        .header { margin-bottom: 10px; }
                        .line { border-top: 1px dashed #000; margin: 5px 0; }
                        .row { display: flex; justify-content: space-between; margin: 2px 0; }
                        .items { width: 100%; margin: 10px 0; }
                        .footer { margin-top: 20px; font-size: 10px; }
                        @media print {
                            body { width: 80mm; margin: 0; }
                        }
                    </style>
                </head>
                <body>
                    <div class="center header">
                        <div class="bold" style="font-size: 16px;">${settings.store_name || 'Snake POS'}</div>
                        <div>${settings.store_address || ''}</div>
                        <div>โทร: ${settings.store_phone || ''}</div>
                        ${settings.store_email ? `<div>อีเมล: ${settings.store_email}</div>` : ''}
                        ${settings.tax_id ? `<div>เลขผู้เสียภาษี: ${settings.tax_id}</div>` : ''}
                    </div>
                    <div class="line"></div>
                    <div class="row"><span>เลขที่บิล:</span> <span>#${order.orderNo?.slice(-8)}</span></div>
                    <div class="row"><span>วันที่:</span> <span>${new Date(order.createdAt).toLocaleString('th-TH')}</span></div>
                    <div class="row"><span>พนักงาน:</span> <span>${order.user?.name || 'Staff'}</span></div>
                    <div class="line"></div>
                    ${order.items.map(item => `
                        <div class="row">
                            <span style="flex: 1;">${capitalize(item.snake?.name) || 'สินค้า'}</span>
                            <span style="width: 50px; text-align: right;">${formatCurrency(item.price * item.quantity, settings.currency_symbol)}</span>
                        </div>
                        <div style="font-size: 10px; color: #666;">${item.quantity} x ${formatCurrency(item.price, settings.currency_symbol)}</div>
                    `).join('')}
                    <div class="line"></div>
                    <div class="row"><span>ยอดรวม:</span> <span>${formatCurrency(order.subtotal, settings.currency_symbol)}</span></div>
                    ${order.discount > 0 ? `<div class="row"><span>ส่วนลด:</span> <span>-${formatCurrency(order.discount, settings.currency_symbol)}</span></div>` : ''}
                    ${order.tax > 0 ? `<div class="row"><span>ภาษี (VAT):</span> <span>${formatCurrency(order.tax, settings.currency_symbol)}</span></div>` : ''}
                    <div class="row bold" style="font-size: 14px;"><span>รวมทั้งสิ้น:</span> <span>${formatCurrency(order.total, settings.currency_symbol)}</span></div>
                    <div class="line"></div>
                    <div class="row"><span>ช่องทางชำระเงิน:</span> <span>${{ cash: 'เงินสด', transfer: 'โอนเงิน', card: 'บัตรเครดิต' }[order.paymentMethod] || 'อื่นๆ'}</span></div>
                    <div class="row"><span>จำนวนเงินที่รับ:</span> <span>${formatCurrency(order.total, settings.currency_symbol)}</span></div>
                    <div class="center footer">
                        ${settings.receipt_footer || 'ขอบคุณที่ใช้บริการ'}
                        <br/>โปรดเก็บใบเสร็จไว้เป็นหลักฐาน
                    </div>
                </body>
            </html>
        `);

        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
    }

    if (!order) return null;

    return createPortal(
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-fade-in">
            <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-in flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <h2 className="text-white font-bold text-lg">บิลการขาย</h2>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Print Button Wrapper */}
                <div className="px-6 py-4 bg-white/[0.01]">
                    <button
                        onClick={handlePrint}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                    >
                        <Printer size={20} />
                        พิมพ์บิล
                    </button>
                </div>

                {/* Receipt Preview */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar pb-10">
                    <div
                        ref={receiptRef}
                        className="bg-slate-800/50 rounded-2xl p-6 border border-white/5 shadow-inner"
                    >
                        {/* Store Info */}
                        <div className="text-center mb-6">
                            <h3 className="text-white font-black text-xl mb-1">{settings.store_name || 'Snake POS'}</h3>
                            <p className="text-slate-400 text-xs">{settings.store_address || 'ระบบจัดการร้าน'}</p>
                            {settings.store_phone && <p className="text-slate-400 text-xs mt-0.5">โทร: {settings.store_phone}</p>}
                            {settings.store_email && <p className="text-slate-400 text-xs mt-0.5">อีเมล: {settings.store_email}</p>}
                            {settings.tax_id && <p className="text-slate-400 text-xs mt-0.5">เลขผู้เสียภาษี: {settings.tax_id}</p>}
                        </div>

                        {/* Order Meta */}
                        <div className="space-y-1.5 mb-6 text-xs text-slate-300">
                            <div className="flex justify-between">
                                <span className="text-slate-500">เลขที่บิล:</span>
                                <span className="font-mono text-emerald-400 font-bold">#{order.orderNo?.slice(-8)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">วันที่:</span>
                                <span>{new Date(order.createdAt).toLocaleString('th-TH', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">พนักงาน:</span>
                                <span>{order.user?.name || 'Staff'}</span>
                            </div>
                        </div>

                        <div className="border-t border-dashed border-white/10 my-6" />

                        {/* Items */}
                        <div className="space-y-4 mb-6">
                            {order.items.map((item, idx) => (
                                <div key={idx}>
                                    <div className="flex justify-between items-baseline mb-1">
                                        <span className="text-white font-bold text-sm">{capitalize(item.snake?.name) || 'สินค้า'}</span>
                                        <span className="text-white font-bold text-sm">{formatCurrency(item.price * item.quantity, settings.currency_symbol)}</span>
                                    </div>
                                    <div className="text-[10px] text-slate-500 flex gap-2">
                                        <span>{item.quantity} x {formatCurrency(item.price, settings.currency_symbol)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="border-t border-dashed border-white/10 my-6" />

                        {/* Totals */}
                        <div className="space-y-2 mb-8">
                            <div className="flex justify-between text-xs text-slate-400">
                                <span>ยอดรวม:</span>
                                <span>{formatCurrency(order.subtotal, settings.currency_symbol)}</span>
                            </div>
                            {order.discount > 0 && (
                                <div className="flex justify-between text-xs text-red-400">
                                    <span>ส่วนลด:</span>
                                    <span>-{formatCurrency(order.discount, settings.currency_symbol)}</span>
                                </div>
                            )}
                            {order.tax > 0 && (
                                <div className="flex justify-between text-xs text-slate-400">
                                    <span>ภาษี (VAT):</span>
                                    <span>{formatCurrency(order.tax, settings.currency_symbol)}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-end pt-2">
                                <span className="text-white font-black text-lg">รวมทั้งสิ้น:</span>
                                <span className="text-emerald-400 font-black text-xl">{formatCurrency(order.total, settings.currency_symbol)}</span>
                            </div>
                        </div>

                        {/* Payment Info */}
                        <div className="space-y-1.5 mb-8 text-xs text-slate-300 pt-4 border-t border-white/5">
                            <div className="flex justify-between">
                                <span className="text-slate-500">ช่องทางชำระเงิน:</span>
                                <span>{{ cash: 'เงินสด', transfer: 'โอนเงิน', card: 'บัตรเครดิต' }[order.paymentMethod] || 'อื่นๆ'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">จำนวนเงินที่รับ:</span>
                                <span>{formatCurrency(order.total, settings.currency_symbol)}</span>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="text-center space-y-1">
                            <p className="text-slate-500 text-[10px]">{settings.receipt_footer || 'ขอบคุณที่ใช้บริการ'}</p>
                            <p className="text-slate-500 text-[10px]">โปรดเก็บใบเสร็จไว้เป็นหลักฐาน</p>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scale-in {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
                .animate-scale-in { animation: scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
            `}</style>
        </div>,
        document.body
    );
}
