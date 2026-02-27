import { useState, useEffect, useRef } from 'react';
import {
    Save, Building, Phone, Monitor, CreditCard, Bell, Database,
    CheckCircle2, AlertCircle, Clock, Banknote, ArrowLeftRight,
    MessageSquare, Store, Settings as SettingsIcon, Youtube,
    ChevronDown, Check, Download, RefreshCcw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import BankBadge, { THAI_BANKS } from '../components/BankBadge';

const API = import.meta.env.VITE_API_URL || 'http://103.142.150.196:5000/api';

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



/* ── Main Component ────────────────────────────────────────────── */
export default function Settings() {
    const [activeTab, setActiveTab] = useState('store');
    const [settings, setSettings] = useState({
        // Store
        store_name: '', store_phone: '', store_email: '', store_address: '',
        tax_id: '', receipt_footer: '', reset_time: '00:00',
        // POS
        receipt_prefix: 'POS', tax_rate: 7, enable_vat: true,
        max_discount_cashier: 10, max_discount_manager: 30,
        show_cost_price: true, auto_print_receipt: true,
        // Payment
        accept_cash: true, accept_transfer: true,
        payment_enabled: true,
        bank_account_name: '',
        bank_account_number: '',
        bank_name: '',
        promptpay_enabled: true,
        promptpay_id: '',
        qr_expiry_minutes: 15,
        // Contact
        contact_phone: '',
        contact_email: '',
        contact_line: '',
        contact_address: '',
        opening_hours: '',
        // Notifications
        notify_low_stock: true, notify_sales_target: true,
        daily_target: 10000, notify_sound: false,
        // Data
        currency_symbol: '฿',
        // TikTok
        tiktok_urls: '[]',
        // Social Links
        social_fb: '[]',
        social_ig: '[]',
        social_yt: '[]',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState(null);
    const { user, getToken } = useAuth();
    const [isBankDropdownOpen, setIsBankDropdownOpen] = useState(false);
    const bankDropdownRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (bankDropdownRef.current && !bankDropdownRef.current.contains(event.target)) {
                setIsBankDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleBackup = async () => {
        try {
            const token = getToken();
            const res = await fetch(`${API}/settings/backup`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `snake_pos_backup_${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                toast.success('ดาวน์โหลดไฟล์สำรองข้อมูลเรียบร้อยแล้ว');
            } else {
                toast.error('ไม่สามารถสำรองข้อมูลได้');
            }
        } catch (error) {
            console.error('Backup failed:', error);
            toast.error('เกิดข้อผิดพลาดในการสำรองข้อมูล');
        }
    };

    const handleResetData = async () => {
        if (user?.role !== 'admin') {
            toast.error('เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถรีเซ็ตข้อมูลได้');
            return;
        }

        const confirm1 = window.confirm('คำเตือน: คุณกำลังจะลบข้อมูลธุรกรรม สินค้า และประวัติทั้งหมดในระบบ (ยกเว้นผู้ใช้และการตั้งค่า) ต้องการดำเนินการต่อหรือไม่?');
        if (!confirm1) return;

        const confirm2 = window.confirm('กรุณายืนยันอีกครั้ง! การกระทำนี้ไม่สามารถย้อนกลับได้ ข้อมูลจะหายไปถาวร');
        if (!confirm2) return;

        setSaving(true);
        try {
            const token = getToken();
            const res = await fetch(`${API}/settings/reset`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success('รีเซ็ตข้อมูลระบบเรียบร้อยแล้ว');
                window.location.reload();
            } else {
                toast.error('ไม่สามารถรีเซ็ตข้อมูลได้');
            }
        } catch (error) {
            console.error('Reset failed:', error);
            toast.error('เกิดข้อผิดพลาดในการรีเซ็ตข้อมูล');
        } finally {
            setSaving(false);
        }
    };

    async function loadSettings() {
        setLoading(true);
        try {
            const token = getToken();
            const res = await fetch(`${API}/settings`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                // Backend stores all values as strings — parse them back to correct types
                const parsed = {};
                const iterable = Array.isArray(data) ? data.map(item => [item.key, item.value]) : Object.entries(data);

                for (const [key, val] of iterable) {
                    if (val === 'true') parsed[key] = true;
                    else if (val === 'false') parsed[key] = false;
                    else if (val !== null && val !== '' && !isNaN(Number(val)) && typeof val === 'string' && val.trim() !== '') {
                        // Check if the key is expected to be a number
                        const numericKeys = ['tax_rate', 'max_discount_cashier', 'max_discount_manager', 'daily_target', 'qr_expiry_minutes'];
                        parsed[key] = numericKeys.includes(key) ? Number(val) : val;
                    }
                    else parsed[key] = val;
                }
                setSettings(prev => ({ ...prev, ...parsed }));
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }

    useEffect(() => { loadSettings(); }, []);

    async function handleSave(e) {
        e?.preventDefault();
        setSaving(true); setStatus(null);
        try {
            const token = getToken();

            // Clean up empty URLs from arrays before saving
            const cleanedSettings = { ...settings };
            ['tiktok_urls', 'social_fb', 'social_ig', 'social_yt'].forEach(k => {
                try {
                    const arr = JSON.parse(cleanedSettings[k]);
                    if (Array.isArray(arr)) {
                        cleanedSettings[k] = JSON.stringify(arr.filter(u => u && u.trim() !== ''));
                    }
                } catch (e) { }
            });

            const res = await fetch(`${API}/settings`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(cleanedSettings)
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
            {/* Header */}
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
            <form onSubmit={handleSave} style={{ maxWidth: 960 }}>
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
                                        <input value={settings.contact_facebook} onChange={e => set('contact_facebook', e.target.value)} placeholder="https://facebook.com/DexterReptiles" />
                                    </div>
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                        <label>ที่อยู่</label>
                                        <textarea rows={3} value={settings.contact_address} onChange={e => set('contact_address', e.target.value)} placeholder="ที่อยู่ที่แสดงบนใบเสร็จ" style={{ resize: 'none' }} />
                                    </div>
                                    <div className="form-group">
                                        <label>เวลาทำการ</label>
                                        <input value={settings.opening_hours} onChange={e => set('opening_hours', e.target.value)} placeholder="10:00 - 20:00" />
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
                                </div>
                            </Section>
                            <Section title="ข้อมูลบัญชีธนาคาร">
                                <div className="form-group">
                                    <label>ธนาคารทื่ใช้รับเงิน</label>
                                    <div className="relative" ref={bankDropdownRef}>
                                        <button
                                            type="button"
                                            onClick={() => setIsBankDropdownOpen(!isBankDropdownOpen)}
                                            className={`input-field flex items-center gap-3 text-left w-full h-11 bg-slate-900 border border-slate-800 rounded-xl px-4 hover:border-sky-500/50 transition-all ${isBankDropdownOpen ? 'border-sky-500 ring-2 ring-sky-500/10' : ''}`}
                                        >
                                            {settings.bank_name ? (
                                                <>
                                                    <BankBadge bankName={settings.bank_name} size={24} />
                                                    <span className="text-stone-100 font-medium">{settings.bank_name}</span>
                                                </>
                                            ) : (
                                                <span className="text-stone-500">เลือกธนาคาร</span>
                                            )}
                                            <ChevronDown size={18} className={`ml-auto text-stone-500 transition-transform ${isBankDropdownOpen ? 'rotate-180' : ''}`} />
                                        </button>

                                        {isBankDropdownOpen && (
                                            <div className="absolute z-[100] left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                                <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                                                    {THAI_BANKS.map(bank => (
                                                        <button
                                                            key={bank.id}
                                                            type="button"
                                                            onClick={() => {
                                                                set('bank_name', bank.name);
                                                                setIsBankDropdownOpen(false);
                                                            }}
                                                            className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left ${settings.bank_name === bank.name ? 'bg-sky-500/10' : ''}`}
                                                        >
                                                            <BankBadge bankName={bank.name} size={24} />
                                                            <span className={`text-sm ${settings.bank_name === bank.name ? 'text-sky-400 font-bold' : 'text-stone-300'}`}>
                                                                {bank.name}
                                                            </span>
                                                            {settings.bank_name === bank.name && (
                                                                <Check className="ml-auto text-sky-400" size={16} />
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="form-group mt-4">
                                    <label>ชื่อบัญชีธนาคาร</label>
                                    <input value={settings.bank_account_name} onChange={e => set('bank_account_name', e.target.value)} placeholder="ชื่อบัญชี" />
                                </div>
                                <div className="form-group mt-4">
                                    <label>เลขบัญชีธนาคาร</label>
                                    <input value={settings.bank_account_number} onChange={e => set('bank_account_number', e.target.value)} placeholder="เลขบัญชี" />
                                </div>
                            </Section>
                            <Section title="PromptPay QR">
                                <div className="form-group">
                                    <label>PromptPay ID (เบอร์/เลขบัตรประชาชน)</label>
                                    <input value={settings.promptpay_id} onChange={e => set('promptpay_id', e.target.value)} placeholder="0812345678 หรือ 1234567890123" />
                                </div>
                                <div className="form-group mt-4">
                                    <label>ระยะเวลาหมดอายุของ QR Code (นาที)</label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="number"
                                            value={settings.qr_expiry_minutes}
                                            onChange={e => set('qr_expiry_minutes', Number(e.target.value))}
                                            placeholder="15"
                                            className="w-24"
                                            min={1}
                                        />
                                        <span className="text-slate-400 text-sm">ถ้าไม่ระบุจะไม่มีการจับเวลา</span>
                                    </div>
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
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="form-group">
                                        <label>สัญลักษณ์สกุลเงิน</label>
                                        <input value={settings.currency_symbol} onChange={e => set('currency_symbol', e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label>เลขที่ผู้เสียภาษี</label>
                                        <input value={settings.tax_id} onChange={e => set('tax_id', e.target.value)} placeholder="1234567890123" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={handleBackup}
                                        className="p-6 bg-white/5 border border-white/10 rounded-2xl text-left hover:bg-white/10 transition-all group flex flex-col items-center text-center"
                                    >
                                        <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                            <Download className="text-emerald-400" size={24} />
                                        </div>
                                        <h3 className="text-white font-bold mb-1">สำรองข้อมูลทั้งหมด</h3>
                                        <p className="text-slate-400 text-xs">ดาวน์โหลดข้อมูลทุกตารางออกมาเป็นไฟล์ JSON เพื่อเก็บรักษา</p>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleResetData}
                                        disabled={user?.role !== 'admin'}
                                        className="p-6 bg-white/5 border border-white/10 rounded-2xl text-left hover:bg-red-500/5 hover:border-red-500/20 transition-all group flex flex-col items-center text-center disabled:opacity-50"
                                    >
                                        <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                            <RefreshCcw className="text-red-400" size={24} />
                                        </div>
                                        <h3 className="text-white font-bold mb-1">ล้างข้อมูลธุรกรรม</h3>
                                        <p className="text-slate-400 text-xs">ลบประวัติการขาย สินค้า และรายการเดินบัญชีทั้งหมด (ผู้ใช้คงเดิม)</p>
                                    </button>
                                </div>

                                <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl">
                                    <div className="flex gap-2 text-amber-500 mb-2">
                                        <AlertCircle size={16} />
                                        <span className="text-xs font-bold uppercase">ข้อควรระวัง</span>
                                    </div>
                                    <p className="text-xs text-stone-400">การสำรองข้อมูลเป็นเพียงการดาวน์โหลดไฟล์ JSON เท่านั้น ระบบยังไม่มีความสามารถในการ Restore ข้ามไฟล์อัตโนมัติ การล้างข้อมูลจะลบเกือบทุกอย่างออกจากฐานข้อมูลทันที</p>
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
                                        } catch (e) { urls = []; }

                                        if (!Array.isArray(urls)) urls = [];

                                        const handleUrlChange = (index, value) => {
                                            const newUrls = [...urls];
                                            newUrls[index] = value;
                                            set('tiktok_urls', JSON.stringify(newUrls));
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
                                            try { urls = typeof settings[key] === 'string' ? JSON.parse(settings[key]) : (settings[key] || []); } catch (e) { urls = []; }
                                            if (!Array.isArray(urls)) urls = [];
                                            const update = (newUrls) => set(key, JSON.stringify(newUrls));
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
                                            try { urls = typeof settings[key] === 'string' ? JSON.parse(settings[key]) : (settings[key] || []); } catch (e) { urls = []; }
                                            if (!Array.isArray(urls)) urls = [];
                                            const update = (newUrls) => set(key, JSON.stringify(newUrls));
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
                                            try { urls = typeof settings[key] === 'string' ? JSON.parse(settings[key]) : (settings[key] || []); } catch (e) { urls = []; }
                                            if (!Array.isArray(urls)) urls = [];
                                            const update = (newUrls) => set(key, JSON.stringify(newUrls));
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
            </form >

            <style>{`
                @media (max-width: 639px) {
                    .form-grid { grid-template-columns: 1fr !important; }
                    .form-grid [style*="grid-column: span 2"] { grid-column: span 1 !important; }
                }
            `}</style>
        </div >
    );
}
