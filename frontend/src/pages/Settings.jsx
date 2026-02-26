import { useState, useEffect } from 'react';
import {
    Save, Building, Phone, Monitor, CreditCard, Bell, Database,
    CheckCircle2, AlertCircle, Clock, Banknote, ArrowLeftRight,
    MessageSquare, Store, Settings as SettingsIcon
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

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
        // Notifications
        notify_low_stock: true, notify_sales_target: true,
        daily_target: 10000, notify_sound: false,
        // Data
        currency_symbol: '฿',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState(null);

    async function loadSettings() {
        setLoading(true);
        try {
            const res = await fetch(`${API}/settings`);
            if (res.ok) {
                const data = await res.json();
                // Backend stores all values as strings — parse them back to correct types
                const parsed = {};
                for (const [key, val] of Object.entries(data)) {
                    if (val === 'true') parsed[key] = true;
                    else if (val === 'false') parsed[key] = false;
                    else if (val !== null && val !== '' && !isNaN(Number(val)) && typeof val === 'string' && val.trim() !== '') {
                        // Check if the key is expected to be a number
                        const numericKeys = ['tax_rate', 'max_discount_cashier', 'max_discount_manager', 'daily_target'];
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
            const res = await fetch(`${API}/settings`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            if (res.ok) { setStatus({ type: 'success', message: 'บันทึกการตั้งค่าเรียบร้อยแล้ว' }); setTimeout(() => setStatus(null), 3000); }
            else throw new Error('บันทึกไม่สำเร็จ');
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
                                        <input value={settings.store_phone} onChange={e => set('store_phone', e.target.value)} placeholder="08X-XXX-XXXX" />
                                    </div>
                                    <div className="form-group">
                                        <label>อีเมล</label>
                                        <input type="email" value={settings.store_email} onChange={e => set('store_email', e.target.value)} placeholder="shop@example.com" />
                                    </div>
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                        <label>ที่อยู่</label>
                                        <textarea rows={3} value={settings.store_address} onChange={e => set('store_address', e.target.value)} placeholder="ที่อยู่ที่แสดงบนใบเสร็จ" style={{ resize: 'none' }} />
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

                            <Section title="การให้ส่วนลด">
                                <div style={{ display: 'grid', gap: '1rem' }} className="form-grid">
                                    <div className="form-group">
                                        <label>ส่วนลดสูงสุด (%) สำหรับ Cashier</label>
                                        <input type="number" value={settings.max_discount_cashier} onChange={e => set('max_discount_cashier', Number(e.target.value))} min={0} max={100} />
                                    </div>
                                    <div className="form-group">
                                        <label>ส่วนลดสูงสุด (%) สำหรับ Manager</label>
                                        <input type="number" value={settings.max_discount_manager} onChange={e => set('max_discount_manager', Number(e.target.value))} min={0} max={100} />
                                    </div>
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
                        <Section title="ช่องทางการชำระเงิน" subtitle="จัดการช่องทางการรับชำระเงิน">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <ToggleRow icon={Banknote} iconColor="#10b981" title="เงินสด" desc="รับชำระด้วยเงินสด" checked={settings.accept_cash} onChange={v => set('accept_cash', v)} />
                                <ToggleRow icon={ArrowLeftRight} iconColor="#3b82f6" title="โอนเงิน" desc="รับโอนเงินผ่านธนาคาร" checked={settings.accept_transfer} onChange={v => set('accept_transfer', v)} />
                            </div>
                        </Section>
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
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>สัญลักษณ์สกุลเงิน</label>
                                    <input value={settings.currency_symbol} onChange={e => set('currency_symbol', e.target.value)} style={{ maxWidth: 120 }} />
                                </div>
                                <div className="form-group">
                                    <label>เลขที่ผู้เสียภาษี</label>
                                    <input value={settings.tax_id} onChange={e => set('tax_id', e.target.value)} placeholder="1234567890123" />
                                </div>
                                <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 14, padding: '1rem' }}>
                                    <h4 style={{ color: '#fca5a5', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>⚠️ โซนอันตราย</h4>
                                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.75rem' }}>การรีเซ็ตข้อมูลจะลบข้อมูลทั้งหมดออกจากระบบอย่างถาวร ไม่สามารถกู้คืนได้</p>
                                    <button type="button" className="btn btn-danger btn-sm" onClick={() => alert('ฟังก์ชันนี้ยังไม่เปิดใช้งาน')}>
                                        รีเซ็ตข้อมูลทั้งหมด
                                    </button>
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
            `}</style>
        </div>
    );
}
