import { useState, useEffect } from 'react';
import {
    Save, Building, Phone, Monitor, CreditCard, Bell, Database,
    CheckCircle2, AlertCircle, Clock, Banknote, ArrowLeftRight,
    MessageSquare, Store, Settings as SettingsIcon, Youtube, ChevronDown, Package, User, History
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import BankBadge, { THAI_BANKS } from '../components/BankBadge';

const API = import.meta.env.VITE_API_URL;

/* ── Toggle Switch Component ───────────────────────────────────── */
function Toggle({ checked, onChange, disabled }) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${checked ? 'bg-emerald-500' : 'bg-slate-700'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
    );
}

/* ── Section Card Wrapper ──────────────────────────────────────── */
function Section({ title, subtitle, children }) {
    return (
        <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
            {title && (
                <div style={{ marginBottom: '1.25rem' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>{title}</h3>
                    {subtitle && <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>{subtitle}</p>}
                </div>
            )}
            {children}
        </div>
    );
}

/* ── Toggle Row ────────────────────────────────────────────────── */
function ToggleRow({ icon: Icon, iconColor = '#10b981', title, desc, checked, onChange, badge }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.05)' }}>
            {Icon && (
                <div style={{ padding: '0.5rem', background: `${iconColor}15`, borderRadius: 10, flexShrink: 0 }}>
                    <Icon size={18} style={{ color: iconColor }} />
                </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.875rem' }}>{title}</div>
                {desc && <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>{desc}</div>}
                {badge && <span style={{ display: 'inline-block', marginTop: 4, fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)' }}>{badge}</span>}
            </div>
            <Toggle checked={checked} onChange={onChange} />
        </div>
    );
}

/* ── TABS ──────────────────────────────────────────────────────── */
const TABS = [
    { key: 'store', label: 'ข้อมูลร้าน', icon: Store },
    { key: 'pos', label: 'POS', icon: Monitor },
    { key: 'payment', label: 'การชำระเงิน', icon: CreditCard },
    { key: 'notification', label: 'แจ้งเตือน', icon: Bell },
    { key: 'tiktok', label: 'โซเชียล/TikTok', icon: MessageSquare },
    { key: 'data', label: 'จัดการข้อมูล', icon: Database },
];

/* ── Reset Modal Component ────────────────────────────────────── */
function ResetModal({ isOpen, onClose, onConfirm }) {
    const [selected, setSelected] = useState([]);
    const [confirmText, setConfirmText] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const options = [
        { id: 'orders', label: 'รายการขายและวอเดอร์ (Orders & Items)', icon: CreditCard },
        { id: 'inventory', label: 'ข้อมูลสินค้าและหมวดหมู่ (Snakes & Categories)', icon: Package },
        { id: 'customers', label: 'ข้อมูลลูกค้า (Customers)', icon: User },
        { id: 'expenses', label: 'ข้อมูลรายจ่าย (Expenses)', icon: Banknote },
        { id: 'records', label: 'บันทึกทางชีวภาพ (Breeding, Feeding, Health, etc.)', icon: History },
    ];

    const toggle = (id) => {
        setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleConfirm = async () => {
        if (confirmText !== 'RESET') return;
        setLoading(true);
        await onConfirm(selected);
        setLoading(false);
        onClose();
    };

    return createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in">
            <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-in">
                <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Database className="text-red-400" size={24} /> รีเซ็ตข้อมูลระบบ
                    </h3>
                    <p className="text-slate-400 text-sm mt-1 text-pretty">เลือกข้อมูลที่ต้องการลบออกจากระบบอย่างถาวร (ไม่รวมบัญชีผู้ใช้และการตั้งค่า)</p>
                </div>

                <div className="p-6 space-y-3">
                    {options.map(opt => (
                        <label key={opt.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${selected.includes(opt.id) ? 'bg-red-500/10 border-red-500/30' : 'bg-white/5 border-white/5 hover:border-white/10'}`}>
                            <input type="checkbox" checked={selected.includes(opt.id)} onChange={() => toggle(opt.id)} className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-red-500 focus:ring-red-500/50" />
                            <div className="flex items-center gap-2">
                                <opt.icon size={16} className={selected.includes(opt.id) ? 'text-red-400' : 'text-slate-400'} />
                                <span className={`text-sm font-medium ${selected.includes(opt.id) ? 'text-white' : 'text-slate-300'}`}>{opt.label}</span>
                            </div>
                        </label>
                    ))}

                    <div className="mt-6 pt-6 border-t border-white/5">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">พิมพ์ "RESET" เพื่อยืนยันการทำรายการ</label>
                        <input value={confirmText} onChange={e => setConfirmText(e.target.value)} placeholder="RESET" className="w-full bg-slate-800 border-white/10 text-center font-bold tracking-widest text-red-400 focus:border-red-500/50" />
                    </div>
                </div>

                <div className="p-6 bg-white/[0.02] flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-white/5 text-slate-300 font-bold hover:bg-white/10 transition-all">ยกเลิก</button>
                    <button disabled={confirmText !== 'RESET' || selected.length === 0 || loading} onClick={handleConfirm} className="flex-2 py-3 px-8 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg shadow-red-500/20">
                        {loading ? 'กำลังรีเซ็ต...' : 'ยืนยันการรีเซ็ต'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

/* ── Main Component ────────────────────────────────────────────── */
export default function Settings() {
    const [activeTab, setActiveTab] = useState('store');
    const [showBankDropdown, setShowBankDropdown] = useState(false);
    const [settings, setSettings] = useState({
        // Store
        store_name: '',
        tax_id: '', receipt_footer: '', reset_time: '00:00',
        // POS
        receipt_prefix: 'POS', tax_rate: 7, enable_vat: true,
        show_cost_price: true, auto_print_receipt: true,
        shipping_fee: 0, free_shipping_min: 1000,
        // Payment
        accept_cash: true, accept_transfer: true,
        payment_enabled: true,
        bank_account_name: '',
        bank_account_number: '',
        bank_name: '',
        promptpay_enabled: true,
        promptpay_id: '',
        // Contact
        contact_phone: '',
        contact_email: '',
        contact_line: '',
        contact_facebook: '',
        contact_address: '',
        opening_hours: '',
        // Notifications
        notify_low_stock: true, notify_sales_target: true,
        daily_target: 10000, notify_sound: false,
        // Data
        tax_id: '',
        // TikTok
        tiktok_urls: '[]',
        // Social Links
        social_fb: '[]',
        social_ig: '[]',
        social_yt: '[]',
        google_map_url: '',
        feed_sizes: '["Pinky", "Fuzzy", "Hopper", "S", "M", "L", "XL", "RXL"]',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState(null);
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);

    const { getToken } = useAuth();

    async function loadSettings() {
        setLoading(true);
        console.log('--- LOADING SETTINGS ---');
        console.log('API URL:', `${API}/settings`);
        try {
            const token = getToken();
            const res = await fetch(`${API}/settings`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('Response Status:', res.status);
            if (res.ok) {
                const data = await res.json();
                console.log('Raw Data from Backend:', data);
                // Backend returns a flat object: { key: value }
                // Parse strings back to correct types
                const parsed = {};
                for (const [key, val] of Object.entries(data)) {
                    if (val === 'true') parsed[key] = true;
                    else if (val === 'false') parsed[key] = false;
                    else if (val !== null && val !== '' && !isNaN(Number(val)) && typeof val === 'string' && val.trim() !== '') {
                        // Numeric conversion for specific fields
                        const numericKeys = ['tax_rate', 'daily_target', 'shipping_fee', 'free_shipping_min'];
                        parsed[key] = numericKeys.includes(key) ? Number(val) : val;
                    }
                    else parsed[key] = val;
                }
                console.log('Parsed Settings State:', parsed);
                setSettings(prev => ({ ...prev, ...parsed }));
            } else {
                console.error('Failed to load settings: res not ok');
            }
        } catch (e) {
            console.error('Failed to load settings error:', e);
        } finally {
            setLoading(false);
        }
    }

    async function handleReset(targets) {
        try {
            const token = getToken();
            const res = await fetch(`${API}/settings/reset`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ targets })
            });
            if (res.ok) {
                setStatus({ type: 'success', message: 'รีเซ็ตข้อมูลที่เลือกเรียบร้อยแล้ว' });
                setTimeout(() => setStatus(null), 5000);
            } else {
                const data = await res.json();
                throw new Error(data.error || 'รีเซ็ตไม่สำเร็จ');
            }
        } catch (e) {
            setStatus({ type: 'error', message: e.message || 'เกิดข้อผิดพลาดในการรีเซ็ต' });
        }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { loadSettings(); }, []);

    async function handleSave(e) {
        e?.preventDefault();
        setSaving(true); setStatus(null);
        try {
            const token = getToken();
            const res = await fetch(`${API}/settings`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(settings)
            });
            if (res.ok) { setStatus({ type: 'success', message: 'บันทึกการตั้งค่าเรียบร้อยแล้ว' }); setTimeout(() => setStatus(null), 3000); }
            else {
                const data = await res.json();
                throw new Error(data.error || 'บันทึกไม่สำเร็จ');
            }
        } catch (e) {
            setStatus({ type: 'error', message: e.message || 'เกิดข้อผิดพลาดในการบันทึก' });
        } finally { setSaving(false); }
    }

    const set = (key, val) => setSettings(prev => ({ ...prev, [key]: val }));

    if (loading) return <div className="page"><div className="loading-center"><div className="spinner" /></div></div>;

    return (
        <div className="space-y-4 sm:space-y-6 animate-fade-in p-1 sm:p-2">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
                    <SettingsIcon size={24} className="text-emerald-400" /> ตั้งค่าระบบ
                </h1>
                <p className="text-slate-400 mt-1 text-sm">จัดการการตั้งค่าร้านค้าและระบบ</p>
            </div>

            {/* Tab Bar */}
            <div className="overflow-x-auto hide-scrollbar -mx-1 px-1">
                <div className="flex bg-slate-900/50 p-1 rounded-xl border border-white/5 min-w-max">
                    {TABS.map(tab => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-1.5 px-3 sm:px-5 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.key ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                            <tab.icon size={15} /> {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <form onSubmit={handleSave}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                    {/* ─── STORE TAB ─── */}
                    {activeTab === 'store' && (
                        <>
                            <Section title="ข้อมูลร้านค้า" subtitle="ข้อมูลพื้นฐานของร้าน">
                                <div style={{ display: 'grid', gap: '1rem' }} className="form-grid">
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                        <label>ชื่อร้าน</label>
                                        <input value={settings.store_name} onChange={e => set('store_name', e.target.value)} placeholder="เช่น Snake Farm" />
                                    </div>
                                    <div className="form-group">
                                        <label>เบอร์โทรศัพท์</label>
                                        <input value={settings.contact_phone} onChange={e => set('contact_phone', e.target.value)} placeholder="08X-XXX-XXXX" />
                                    </div>
                                    <div className="form-group">
                                        <label>อีเมล</label>
                                        <input type="email" value={settings.contact_email} onChange={e => set('contact_email', e.target.value)} placeholder="shop@example.com" />
                                    </div>
                                    <div className="form-group">
                                        <label>Line</label>
                                        <input value={settings.contact_line} onChange={e => set('contact_line', e.target.value)} placeholder="@snakeparadise" />
                                    </div>
                                    <div className="form-group">
                                        <label>Facebook</label>
                                        <input value={settings.contact_facebook} onChange={e => set('contact_facebook', e.target.value)} placeholder="Facebook Page Name / URL" />
                                    </div>
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                        <label>ที่อยู่</label>
                                        <textarea rows={3} value={settings.contact_address} onChange={e => set('contact_address', e.target.value)} placeholder="ที่อยู่ที่แสดงบนใบเสร็จ" style={{ resize: 'none' }} />
                                    </div>
                                    <div className="form-group">
                                        <label>เวลาทำการ</label>
                                        <input value={settings.opening_hours} onChange={e => set('opening_hours', e.target.value)} placeholder="10:00 - 20:00" />
                                    </div>
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                        <label>ลิงก์ Google Map (Embed)</label>
                                        <input
                                            value={settings.google_map_url}
                                            onChange={e => {
                                                let val = e.target.value;
                                                // Auto-extract src from iframe tag if pasted
                                                if (val.includes('<iframe')) {
                                                    const match = val.match(/src="([^"]+)"/);
                                                    if (match) val = match[1];
                                                }
                                                set('google_map_url', val);
                                            }}
                                            placeholder="https://www.google.com/maps/embed?pb=..."
                                        />
                                        <p style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 4 }}>
                                            ⚠️ <b>ต้องใช้ลิงก์สำหรับการ Embed เท่านั้น:</b> เข้า Google Maps &gt; Share &gt; Embed a map &gt; คัดลอกค่าใน src="..." มาวาง
                                        </p>
                                    </div>
                                </div>
                            </Section>

                            <Section title="เวลาปิดรอบขายรายวัน (Reset Time)">
                                <div className="form-group" style={{ maxWidth: 300 }}>
                                    <div style={{ position: 'relative' }}>
                                        <Clock size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                                        <input type="time" value={settings.reset_time} onChange={e => set('reset_time', e.target.value)} className="input-field pl-icon" />
                                    </div>
                                    <p style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 4 }}>ระบบจะเริ่มวันขายใหม่ ณ เวลานี้ เหมาะสำหรับร้านเปิดข้ามวัน</p>
                                </div>
                            </Section>

                            <Section title="จัดการชนิดอาหาร (Feed Sizes)" subtitle="ตั้งค่ารายการอาหารสำหรับงู">
                                <div className="space-y-4">
                                    <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl mb-4">
                                        <p className="text-xs text-slate-400">รายการเหล่านี้จะไปปรากฏในช่อง "ขนาดอาหาร" ในหน้าสินค้าและบันทึกสุขภาพครับ</p>
                                    </div>

                                    <div className="space-y-3">
                                        {(() => {
                                            let sizes = [];
                                            try {
                                                sizes = typeof settings.feed_sizes === 'string' ? JSON.parse(settings.feed_sizes) : (settings.feed_sizes || []);
                                            } catch { sizes = ["Pinky", "Fuzzy", "Hopper", "S", "M", "L", "XL", "RXL"]; }

                                            if (!Array.isArray(sizes)) sizes = [];

                                            const handleSizeChange = (index, value) => {
                                                const newSizes = [...sizes];
                                                newSizes[index] = value;
                                                set('feed_sizes', JSON.stringify(newSizes.filter(s => s !== '')));
                                            };

                                            const addSizeField = () => {
                                                const newSizes = [...sizes, ''];
                                                set('feed_sizes', JSON.stringify(newSizes));
                                            };

                                            const removeSizeField = (index) => {
                                                const newSizes = sizes.filter((_, i) => i !== index);
                                                set('feed_sizes', JSON.stringify(newSizes));
                                            };

                                            return (
                                                <>
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                        {sizes.map((size, index) => (
                                                            <div key={index} className="flex gap-2">
                                                                <input
                                                                    value={size}
                                                                    onChange={e => handleSizeChange(index, e.target.value)}
                                                                    placeholder="เช่น หนูแดง, ไก่"
                                                                    className="flex-1 text-sm h-10"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeSizeField(index)}
                                                                    className="w-10 h-10 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors flex items-center justify-center"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={addSizeField}
                                                        className="w-full py-2.5 rounded-xl border border-dashed border-white/10 text-slate-400 text-xs font-bold hover:border-emerald-500/30 hover:text-emerald-400 transition-all flex items-center justify-center gap-2"
                                                    >
                                                        + เพิ่มชนิดอาหาร
                                                    </button>
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </Section>
                        </>
                    )}

                    {/* ─── POS TAB ─── */}
                    {activeTab === 'pos' && (
                        <>
                            <Section title="ตั้งค่า POS" subtitle="ปรับแต่งการทำงานของระบบขาย">
                                <div style={{ display: 'grid', gap: '1rem' }} className="form-grid">
                                    <div className="form-group">
                                        <label>รูปแบบหมายเลขบิล</label>
                                        <input value={settings.receipt_prefix} onChange={e => set('receipt_prefix', e.target.value)} placeholder="POS" />
                                        <p style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 3 }}>เช่น POS-20250101-00001</p>
                                    </div>
                                    <div className="form-group">
                                        <label>อัตราภาษี (%)</label>
                                        <input type="number" value={settings.tax_rate} onChange={e => set('tax_rate', Number(e.target.value))} min={0} max={100} step={0.5} />
                                    </div>
                                </div>
                                <div style={{ marginTop: '1rem' }}>
                                    <ToggleRow icon={CreditCard} title="คิดภาษีมูลค่าเพิ่ม (VAT 7%)" checked={settings.enable_vat} onChange={v => set('enable_vat', v)} />
                                </div>
                            </Section>


                            <Section>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <ToggleRow icon={Monitor} title="แสดงราคาทุน" desc="แสดงราคาทุนสินค้าในหน้า POS (เฉพาะ Manager ขึ้นไป)" checked={settings.show_cost_price} onChange={v => set('show_cost_price', v)} />
                                    <ToggleRow icon={CreditCard} title="พิมพ์ใบเสร็จอัตโนมัติ" desc="พิมพ์ใบเสร็จทันทีหลังชำระเงิน" checked={settings.auto_print_receipt} onChange={v => set('auto_print_receipt', v)} />
                                </div>
                            </Section>

                            <Section title="ข้อความท้ายใบเสร็จ">
                                <div className="form-group">
                                    <textarea rows={2} value={settings.receipt_footer} onChange={e => set('receipt_footer', e.target.value)} placeholder="เช่น ขอบคุณที่ใช้บริการ" style={{ resize: 'none' }} />
                                </div>
                            </Section>
                        </>
                    )}

                    {/* ─── PAYMENT TAB ─── */}
                    {activeTab === 'payment' && (
                        <>
                            <Section title="ช่องทางการชำระเงิน" subtitle="จัดการช่องทางการรับชำระเงิน">
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <ToggleRow icon={CreditCard} iconColor="#10b981" title="เปิดช่องทางการชำระเงิน" desc="เปิด/ปิดการรับชำระเงินทั้งหมด" checked={settings.payment_enabled} onChange={v => set('payment_enabled', v)} />
                                    <ToggleRow icon={Banknote} iconColor="#10b981" title="เงินสด" desc="รับชำระด้วยเงินสด" checked={settings.accept_cash} onChange={v => set('accept_cash', v)} />
                                    <ToggleRow icon={ArrowLeftRight} iconColor="#3b82f6" title="โอนเงิน" desc="รับโอนเงินผ่านธนาคาร" checked={settings.accept_transfer} onChange={v => set('accept_transfer', v)} />
                                    <ToggleRow icon={CreditCard} iconColor="#6366f1" title="PromptPay QR" desc="รับชำระผ่าน PromptPay QR" checked={settings.promptpay_enabled} onChange={v => set('promptpay_enabled', v)} />
                                    <ToggleRow icon={Banknote} iconColor="#f59e0b" title="เก็บเงินปลายทาง (COD)" desc="เปิดให้ลูกค้าเลือกชำระเงินเมื่อได้รับสินค้า" checked={settings.accept_cod} onChange={v => set('accept_cod', v)} />
                                </div>
                            </Section>
                            <Section title="ข้อมูลบัญชีธนาคาร">
                                <div className="form-group pb-2">
                                    <label>ธนาคารที่ใช้รับเงิน</label>
                                    <div className="relative">
                                        <div
                                            className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/10 transition-all group"
                                            onClick={() => setShowBankDropdown(!showBankDropdown)}
                                        >
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                {settings.bank_name ? (
                                                    <>
                                                        <BankBadge bankName={settings.bank_name} size={22} />
                                                        <span className="text-white font-medium truncate">{settings.bank_name}</span>
                                                    </>
                                                ) : (
                                                    <span className="text-slate-500 italic">เลือกธนาคาร...</span>
                                                )}
                                            </div>
                                            <ChevronDown size={18} className={`text-slate-500 transition-transform duration-300 ${showBankDropdown ? 'rotate-180' : ''}`} />
                                        </div>

                                        {showBankDropdown && (
                                            <>
                                                <div className="fixed inset-0 z-[60]" onClick={() => setShowBankDropdown(false)} />
                                                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-[70] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                                    <div className="max-h-[320px] overflow-y-auto custom-scrollbar p-1.5">
                                                        {THAI_BANKS.map(bank => (
                                                            <div
                                                                key={bank.id}
                                                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${settings.bank_name === bank.name ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                                                                onClick={() => {
                                                                    set('bank_name', bank.name);
                                                                    setShowBankDropdown(false);
                                                                }}
                                                            >
                                                                <BankBadge bankName={bank.name} size={22} />
                                                                <span className="text-sm font-medium">{bank.name}</span>
                                                                {settings.bank_name === bank.name && <CheckCircle2 size={14} className="ml-auto" />}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>ชื่อบัญชีธนาคาร</label>
                                    <input value={settings.bank_account_name} onChange={e => set('bank_account_name', e.target.value)} placeholder="ชื่อบัญชี" />
                                </div>
                                <div className="form-group">
                                    <label>เลขบัญชีธนาคาร</label>
                                    <input value={settings.bank_account_number} onChange={e => set('bank_account_number', e.target.value)} placeholder="เลขบัญชี" />
                                </div>
                            </Section>

                            <Section title="การจัดส่ง" subtitle="ตั้งค่าค่าธรรมเนียมการจัดส่ง">
                                <div style={{ display: 'grid', gap: '1rem' }} className="form-grid">
                                    <div className="form-group">
                                        <label>ค่าจัดส่ง (บาท)</label>
                                        <input type="number" value={settings.shipping_fee} onChange={e => set('shipping_fee', Number(e.target.value))} min={0} />
                                    </div>
                                    <div className="form-group">
                                        <label>ยอดขั้นต่ำส่งฟรี (บาท)</label>
                                        <input type="number" value={settings.free_shipping_min} onChange={e => set('free_shipping_min', Number(e.target.value))} min={0} />
                                    </div>
                                </div>
                            </Section>
                            <Section title="PromptPay QR">
                                <div className="form-group">
                                    <label>PromptPay ID (เบอร์/เลขบัตรประชาชน)</label>
                                    <input value={settings.promptpay_id} onChange={e => set('promptpay_id', e.target.value)} placeholder="0812345678 หรือ 1234567890123" />
                                </div>
                            </Section>
                        </>
                    )}

                    {/* ─── NOTIFICATION TAB ─── */}
                    {activeTab === 'notification' && (
                        <>
                            <Section title="การแจ้งเตือนในระบบ" subtitle="ตั้งค่าการแจ้งเตือนภายในแอปพลิเคชัน">
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <ToggleRow icon={AlertCircle} iconColor="#f59e0b" title="แจ้งเตือนสินค้าใกล้หมด" desc="แสดงการแจ้งเตือนเมื่อสินค้ามีจำนวนต่ำกว่าขั้นต่ำ" checked={settings.notify_low_stock} onChange={v => set('notify_low_stock', v)} />
                                    <ToggleRow icon={CheckCircle2} iconColor="#10b981" title="แจ้งเตือนยอดขายถึงเป้า" desc="แสดงการแจ้งเตือนเมื่อยอดขายถึงเป้าหมาย" checked={settings.notify_sales_target} onChange={v => set('notify_sales_target', v)} />
                                    <div className="pl-12 pr-4 pb-2">
                                        <div className="flex items-center gap-3">
                                            <label className="text-xs text-slate-500 whitespace-nowrap">เป้าหมายยอดขาย (บาท):</label>
                                            <input
                                                type="number"
                                                value={settings.daily_target}
                                                onChange={e => set('daily_target', e.target.value)}
                                                className="h-8 py-1 text-xs"
                                                style={{ maxWidth: '120px' }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </Section>




                            <Section>
                                <ToggleRow icon={Bell} iconColor="#8b5cf6" title="เสียงแจ้งเตือน" desc="เปิดเสียงเมื่อมีการแจ้งเตือน" checked={settings.notify_sound} onChange={v => set('notify_sound', v)} />
                            </Section>
                        </>
                    )}

                    {/* ─── DATA TAB ─── */}
                    {activeTab === 'data' && (
                        <Section title="จัดการข้อมูล" subtitle="สำรองและรีเซ็ตข้อมูลระบบ">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                    <label>เลขที่ผู้เสียภาษี</label>
                                    <input value={settings.tax_id} onChange={e => set('tax_id', e.target.value)} placeholder="1234567890123" />
                                </div>
                                <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 14, padding: '1.25rem' }}>
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-red-500/10 rounded-xl shrink-0">
                                            <AlertCircle className="text-red-400" size={24} />
                                        </div>
                                        <div className="flex-1">
                                            <h4 style={{ color: '#fca5a5', fontSize: '1rem', fontWeight: 700, marginBottom: '0.25rem' }}>โซนอันตราย</h4>
                                            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1rem', lineHeight: 1.5 }}>
                                                การรีเซ็ตข้อมูลจะลบข้อมูลที่เลือกออกจากระบบอย่างถาวร <b>ไม่สามารถกู้คืนได้</b> กรุณาตรวจสอบให้แน่ใจก่อนดำเนินการ
                                            </p>
                                            <button type="button" className="group relative overflow-hidden px-6 py-3 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 transition-all font-bold text-sm flex items-center gap-2"
                                                onClick={() => setIsResetModalOpen(true)}>
                                                <Database size={16} /> รีเซ็ตข้อมูล...
                                                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Section>
                    )}

                    {/* ─── TIKTOK TAB ─── */}
                    {activeTab === 'tiktok' && (
                        <Section title="จัดการ TikTok" subtitle="แนบลิงก์วิดีโอเพื่อแสดงผลในหน้าแรก">
                            <div className="space-y-4">
                                <div className="p-4 bg-sky-500/5 border border-sky-500/10 rounded-xl mb-4">
                                    <p className="text-[10px] uppercase font-bold text-sky-400 tracking-widest mb-1 italic">วิธีใช้งาน</p>
                                    <p className="text-xs text-stone-400">คัดลอกลิงก์วิดีโอ TikTok (เช่น https://www.tiktok.com/@user/video/123) มาวางในช่องด้านล่าง ระบบจะดึงคลิปไปแสดงผลที่หน้าแรกอัตโนมัติครับ</p>
                                </div>

                                <div className="space-y-3">
                                    {(() => {
                                        let urls = [];
                                        try {
                                            urls = typeof settings.tiktok_urls === 'string' ? JSON.parse(settings.tiktok_urls) : (settings.tiktok_urls || []);
                                        } catch { urls = []; }

                                        if (!Array.isArray(urls)) urls = [];

                                        const handleUrlChange = (index, value) => {
                                            const newUrls = [...urls];
                                            newUrls[index] = value;
                                            set('tiktok_urls', JSON.stringify(newUrls.filter(u => u !== '')));
                                        };

                                        const addUrlField = () => {
                                            const newUrls = [...urls, ''];
                                            set('tiktok_urls', JSON.stringify(newUrls));
                                        };

                                        const removeUrlField = (index) => {
                                            const newUrls = urls.filter((_, i) => i !== index);
                                            set('tiktok_urls', JSON.stringify(newUrls));
                                        };

                                        return (
                                            <>
                                                {urls.map((url, index) => (
                                                    <div key={index} className="flex gap-2">
                                                        <input
                                                            value={url}
                                                            onChange={e => handleUrlChange(index, e.target.value)}
                                                            placeholder="https://www.tiktok.com/@username/video/..."
                                                            className="flex-1"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => removeUrlField(index)}
                                                            className="px-3 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                                                        >
                                                            ลบ
                                                        </button>
                                                    </div>
                                                ))}
                                                <button
                                                    type="button"
                                                    onClick={addUrlField}
                                                    className="w-full py-2.5 rounded-xl border border-dashed border-white/10 text-stone-400 text-xs font-bold hover:border-sky-500/30 hover:text-sky-400 transition-all flex items-center justify-center gap-2"
                                                >
                                                    + เพิ่มลิงก์วิดีโอ
                                                </button>
                                            </>
                                        );
                                    })()}
                                </div>

                                <div className="mt-8 pt-8 border-t border-white/5 space-y-6">
                                    <h4 className="text-sm font-bold text-white mb-4">ช่องทางโซเชียลอื่นๆ (เพิ่มได้หลายลิงก์)</h4>

                                    {/* Facebook List */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-blue-400">
                                            <Building size={16} />
                                            <span className="text-xs font-bold uppercase tracking-wider">Facebook URLs</span>
                                        </div>
                                        {(() => {
                                            const key = 'social_fb';
                                            let urls = [];
                                            try { urls = typeof settings[key] === 'string' ? JSON.parse(settings[key]) : (settings[key] || []); } catch { urls = []; }
                                            if (!Array.isArray(urls)) urls = [];
                                            const update = (newUrls) => set(key, JSON.stringify(newUrls.filter(u => u !== '' || urls.length === 0)));
                                            return (
                                                <div className="space-y-2">
                                                    {urls.map((url, i) => (
                                                        <div key={i} className="flex gap-2">
                                                            <input value={url} onChange={e => { const n = [...urls]; n[i] = e.target.value; update(n); }} placeholder="https://facebook.com/..." className="flex-1" />
                                                            <button type="button" onClick={() => update(urls.filter((_, idx) => idx !== i))} className="px-3 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors">ลบ</button>
                                                        </div>
                                                    ))}
                                                    <button type="button" onClick={() => update([...urls, ''])} className="w-full py-2 rounded-lg border border-dashed border-white/10 text-stone-500 text-[10px] font-bold hover:border-blue-500/30 hover:text-blue-400 transition-all">+ เพิ่ม Facebook</button>
                                                </div>
                                            );
                                        })()}
                                    </div>

                                    {/* Instagram List */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-pink-400">
                                            <Store size={16} />
                                            <span className="text-xs font-bold uppercase tracking-wider">Instagram URLs</span>
                                        </div>
                                        {(() => {
                                            const key = 'social_ig';
                                            let urls = [];
                                            try { urls = typeof settings[key] === 'string' ? JSON.parse(settings[key]) : (settings[key] || []); } catch { urls = []; }
                                            if (!Array.isArray(urls)) urls = [];
                                            const update = (newUrls) => set(key, JSON.stringify(newUrls.filter(u => u !== '' || urls.length === 0)));
                                            return (
                                                <div className="space-y-2">
                                                    {urls.map((url, i) => (
                                                        <div key={i} className="flex gap-2">
                                                            <input value={url} onChange={e => { const n = [...urls]; n[i] = e.target.value; update(n); }} placeholder="https://instagram.com/..." className="flex-1" />
                                                            <button type="button" onClick={() => update(urls.filter((_, idx) => idx !== i))} className="px-3 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors">ลบ</button>
                                                        </div>
                                                    ))}
                                                    <button type="button" onClick={() => update([...urls, ''])} className="w-full py-2 rounded-lg border border-dashed border-white/10 text-stone-500 text-[10px] font-bold hover:border-pink-500/30 hover:text-pink-400 transition-all">+ เพิ่ม Instagram</button>
                                                </div>
                                            );
                                        })()}
                                    </div>

                                    {/* YouTube List */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-red-500">
                                            <Youtube size={16} />
                                            <span className="text-xs font-bold uppercase tracking-wider">YouTube URLs</span>
                                        </div>
                                        {(() => {
                                            const key = 'social_yt';
                                            let urls = [];
                                            try { urls = typeof settings[key] === 'string' ? JSON.parse(settings[key]) : (settings[key] || []); } catch { urls = []; }
                                            if (!Array.isArray(urls)) urls = [];
                                            const update = (newUrls) => set(key, JSON.stringify(newUrls.filter(u => u !== '' || urls.length === 0)));
                                            return (
                                                <div className="space-y-2">
                                                    {urls.map((url, i) => (
                                                        <div key={i} className="flex gap-2">
                                                            <input value={url} onChange={e => { const n = [...urls]; n[i] = e.target.value; update(n); }} placeholder="https://youtube.com/..." className="flex-1" />
                                                            <button type="button" onClick={() => update(urls.filter((_, idx) => idx !== i))} className="px-3 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors">ลบ</button>
                                                        </div>
                                                    ))}
                                                    <button type="button" onClick={() => update([...urls, ''])} className="w-full py-2 rounded-lg border border-dashed border-white/10 text-stone-500 text-[10px] font-bold hover:border-red-500/30 hover:text-red-400 transition-all">+ เพิ่ม YouTube</button>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>
                        </Section>
                    )}

                </div>

                {/* Save Button */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem', alignItems: 'stretch' }}>
                    {status && (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            fontSize: '0.875rem',
                            color: status.type === 'success' ? '#10b981' : '#ef4444',
                            background: status.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                            padding: '0.625rem 1rem', borderRadius: 12,
                            border: `1px solid ${status.type === 'success' ? '#10b981' : '#ef4444'}33`
                        }}>
                            {status.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                            {status.message}
                        </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button type="submit" className="btn btn-primary" disabled={saving}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 2rem' }}>
                            {saving ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <Save size={18} />}
                            {saving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
                        </button>
                    </div>
                </div>
            </form>

            <style>{`
                @media (max-width: 639px) {
                    .form-grid { grid-template-columns: 1fr !important; }
                    .form-grid [style*="grid-column: span 2"] { grid-column: span 1 !important; }
                }
                @keyframes scale-in {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .animate-scale-in { animation: scale-in 0.2s ease-out forwards; }
            `}</style>

            <ResetModal
                isOpen={isResetModalOpen}
                onClose={() => setIsResetModalOpen(false)}
                onConfirm={handleReset}
            />
        </div>
    );
}
