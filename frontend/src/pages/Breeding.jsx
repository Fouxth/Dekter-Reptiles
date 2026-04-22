import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';

const API = import.meta.env.VITE_API_URL;

function fmtDate(d) {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
}

const capitalize = (str) => {
    if (!str) return str;
    return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
};

const EMPTY_MALE = { maleId: '', pairedDate: new Date().toISOString().slice(0, 10), lockDate: '', separateDate: '', daysCohabited: '', isLockSuccessful: false };

const EMPTY_FORM = {
    femaleId: '', 
    males: [{ ...EMPTY_MALE }],
    ovulationDate: '', preLayShed: false,
    clutchDate: '', eggCount: '', goodEggs: '', badEggs: '',
    offspringCount: '', notes: ''
};

export default function Breeding() {
    const navigate = useNavigate();
    const { getToken } = useAuth();
    const [records, setRecords] = useState([]);
    const [snakes, setSnakes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [itemToDelete, setItemToDelete] = useState(null);

    const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` });
    const femaleSnakes = snakes.filter(s => s.gender === 'female');
    const maleSnakes = snakes.filter(s => s.gender === 'male');

    async function load() {
        setLoading(true);
        const [recRes, snkRes] = await Promise.all([
            fetch(`${API}/breeding-records`, { headers: headers() }),
            fetch(`${API}/snakes`, { headers: headers() }),
        ]);
        if (recRes.ok) setRecords(await recRes.json());
        if (snkRes.ok) setSnakes(await snkRes.json());
        setLoading(false);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { load(); }, []);

    function openNew() {
        setEditingId(null);
        setForm(EMPTY_FORM);
        setIsOpen(true);
    }

    function openEdit(r) {
        setEditingId(r.id);
        setForm({
            femaleId: r.femaleId, 
            males: r.males?.length > 0 ? r.males.map(m => ({
                maleId: m.maleId,
                pairedDate: m.pairedDate?.slice(0, 10) || '',
                lockDate: m.lockDate?.slice(0, 10) || '',
                separateDate: m.separateDate?.slice(0, 10) || '',
                daysCohabited: m.daysCohabited ?? '',
                isLockSuccessful: m.isLockSuccessful || false
            })) : [{ ...EMPTY_MALE }],
            ovulationDate: r.ovulationDate?.slice(0, 10) || '',
            preLayShed: r.preLayShed || false,
            clutchDate: r.clutchDate?.slice(0, 10) || '',
            eggCount: r.eggCount ?? '',
            goodEggs: r.goodEggs ?? '',
            badEggs: r.badEggs ?? '',
            offspringCount: r.offspringCount ?? '',
            notes: r.notes || '',
        });
        setIsOpen(true);
    }

    function addMaleSlot() {
        setForm(prev => ({ ...prev, males: [...prev.males, { ...EMPTY_MALE }] }));
    }

    function removeMaleSlot(index) {
        if (form.males.length === 1) return;
        setForm(prev => ({ ...prev, males: prev.males.filter((_, i) => i !== index) }));
    }

    function updateMale(index, field, value) {
        setForm(prev => {
            const newMales = [...prev.males];
            newMales[index] = { ...newMales[index], [field]: value };
            return { ...prev, males: newMales };
        });
    }

    async function handleSave(e) {
        e.preventDefault();
        
        // Validation
        const emptyMales = form.males.filter(m => !m.maleId);
        if (emptyMales.length > 0) {
            toast.error('กรุณาเลือกตัวผู้ให้ครบทุกช่อง');
            return;
        }

        setSaving(true);
        const url = editingId ? `${API}/breeding-records/${editingId}` : `${API}/breeding-records`;
        const method = editingId ? 'PUT' : 'POST';
        const res = await fetch(url, { method, headers: headers(), body: JSON.stringify(form) });
        if (res.ok) { setIsOpen(false); load(); }
        else { toast.error('เกิดข้อผิดพลาดในการบันทึก'); }
        setSaving(false);
    }

    function handleDelete(r) {
        setItemToDelete(r);
    }

    async function confirmDelete() {
        if (!itemToDelete) return;
        try {
            const res = await fetch(`${API}/breeding-records/${itemToDelete.id}`, { method: 'DELETE', headers: headers() });
            if (res.ok) {
                toast.success('ลบบันทึกสำเร็จ');
                load();
            } else {
                toast.error('ไม่สามารถลบบันทึกได้');
            }
        } catch (error) {
            console.error(error);
            toast.error('เกิดข้อผิดพลาดในการลบ');
        } finally {
            setItemToDelete(null);
        }
    }

    const InfoRow = ({ label, value, color }) => (
        <div>
            <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
            <div style={{ color: color || '#f8fafc', fontSize: '0.85rem', fontWeight: 500 }}>{value}</div>
        </div>
    );

    return (
        <div className="page breeding-page">
            <div className="page-header">
                <div>
                    <h1>🥚 บันทึกการผสมพันธุ์</h1>
                    <p className="page-subtitle">ติดตามการผสมพันธุ์, Lock, ไข่ และ Genetics</p>
                </div>
                <button className="btn btn-primary" onClick={openNew}>+ เพิ่มบันทึก</button>
            </div>

            {loading ? <div className="loading-center"><div className="spinner" /></div> : (
                <>
                    {records.length === 0 && (
                        <div className="loading-center" style={{ flexDirection: 'column', gap: '1rem', padding: '3rem' }}>
                            <div style={{ fontSize: '4rem' }}>🥚</div>
                            <p style={{ color: '#64748b' }}>ยังไม่มีบันทึกการผสมพันธุ์</p>
                        </div>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(340px, 100%),1fr))', gap: '1rem' }}>
                        {records.map(r => (
                            <div key={r.id} className="card" style={{ padding: '1.25rem' }}>
                                {/* Pairing header */}
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
                                    <button onClick={() => navigate(`/snakes/${r.femaleId}`)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '0.3rem 0.75rem', color: '#fca5a5', cursor: 'pointer', fontSize: '0.8rem' }}>
                                        ♀ {capitalize(r.female?.name)} {r.female?.code && <span style={{ opacity: 0.6 }}>({r.female.code})</span>}
                                    </button>
                                    <span style={{ color: '#64748b', fontSize: '1.1rem' }}>×</span>
                                    {r.males?.map((m, idx) => (
                                        <button key={idx} onClick={() => navigate(`/snakes/${m.maleId}`)} style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, padding: '0.3rem 0.75rem', color: '#93c5fd', cursor: 'pointer', fontSize: '0.8rem' }}>
                                            ♂ {capitalize(m.male?.name)} {m.male?.code && <span style={{ opacity: 0.6 }}>({m.male.code})</span>}
                                        </button>
                                    ))}
                                </div>

                                {/* Timeline section - ก่อนผสม */}
                                <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: '0.75rem', marginBottom: '0.75rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase' }}>📅 พ่อพันธุ์ (ก่อนผสม)</div>
                                    {r.males?.map((m, i) => (
                                        <div key={i} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginBottom: '0.5rem', paddingBottom: '0.5rem', borderBottom: i < r.males.length - 1 ? '1px dashed rgba(255,255,255,0.1)' : 'none' }}>
                                            <div style={{ gridColumn: '1/-1', color: '#93c5fd', fontSize: '0.8rem', fontWeight: 500 }}>
                                                ♂ {capitalize(m.male?.name)} {m.isLockSuccessful && <span style={{ color: '#6ee7b7' }}>✅ (Lock)</span>}
                                            </div>
                                            <InfoRow label="วันเข้า (Intro)" value={fmtDate(m.pairedDate)} />
                                            <InfoRow label="วัน Lock" value={fmtDate(m.lockDate)} />
                                            <InfoRow label="วันแยก (Out)" value={fmtDate(m.separateDate)} />
                                            <InfoRow label="อยู่ด้วยกัน" value={m.daysCohabited ? `${m.daysCohabited} วัน` : '-'} />
                                        </div>
                                    ))}
                                </div>

                                {/* Egg section - หลังผสม */}
                                <div style={{ background: 'rgba(234,179,8,0.05)', borderRadius: 10, padding: '0.75rem', marginBottom: '0.75rem', border: '1px solid rgba(234,179,8,0.1)' }}>
                                    <div style={{ fontSize: '0.7rem', color: '#eab308', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase' }}>🥚 หลังผสม / ข้อมูลไข่</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                                        <InfoRow label="Ovulation" value={fmtDate(r.ovulationDate)} />
                                        <InfoRow label="Pre-Lay Shed" value={r.preLayShed ? '✅ ลอกแล้ว' : '-'} color={r.preLayShed ? '#6ee7b7' : undefined} />
                                        {(r.clutchDate || r.eggCount || r.offspringCount) && (
                                            <>
                                                <div style={{ gridColumn: '1/-1', height: 1, background: 'rgba(234,179,8,0.1)', margin: '0.25rem 0' }} />
                                                <InfoRow label="วันออกไข่" value={fmtDate(r.clutchDate)} />
                                                <InfoRow label="จำนวนไข่" value={r.eggCount ?? '-'} />
                                                <InfoRow label="ไข่ดี" value={r.goodEggs ?? '-'} color="#6ee7b7" />
                                                <InfoRow label="ไข่เสีย" value={r.badEggs ?? '-'} color="#f87171" />
                                                {r.offspringCount != null && <InfoRow label="จำนวนลูก" value={`🐍 ${r.offspringCount} ตัว`} color="#6ee7b7" />}
                                            </>
                                        )}
                                    </div>
                                </div>

                                {(r.female?.genetics || r.males?.some(m => m.male?.genetics)) && (
                                    <div style={{ background: 'rgba(139,92,246,0.08)', borderRadius: 8, padding: '0.5rem 0.75rem', marginBottom: '0.5rem', fontSize: '0.75rem', color: '#c4b5fd' }}>
                                        🧬 {capitalize(r.female?.genetics) || '?'} × {r.males?.map(m => capitalize(m.male?.genetics) || '?').join(', ')}
                                    </div>
                                )}

                                {r.notes && <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.75rem' }}>{r.notes}</p>}

                                <div className="action-btns">
                                    <button className="btn btn-sm btn-outline" onClick={() => openEdit(r)}>แก้ไข</button>
                                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(r)}>ลบ</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Modal */}
            {isOpen && createPortal(
                <div className="modal-overlay" onClick={() => setIsOpen(false)}>
                    <div className="modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingId ? 'แก้ไขบันทึก' : '🥚 เพิ่มบันทึกผสมพันธุ์'}</h2>
                            <button className="modal-close" onClick={() => setIsOpen(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSave} style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', maxHeight: 'calc(100vh - 10rem)' }}>
                            <div className="form-grid">
                                {/* Pairing Selection */}
                                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                                    <label>ตัวเมีย ♀ (0.1) *</label>
                                    <select value={form.femaleId} onChange={e => setForm({ ...form, femaleId: e.target.value })} required disabled={!!editingId}>
                                        <option value="">-- เลือกตัวเมีย --</option>
                                        {femaleSnakes.map(s => <option key={s.id} value={s.id}>{s.code ? `${s.code} - ` : ''}{s.name} {s.morph ? `(${s.morph})` : ''}</option>)}
                                        {femaleSnakes.length === 0 && snakes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>

                                {/* Timeline - ก่อนผสม (Multiple Males) */}
                                <div className="form-group" style={{ gridColumn: '1/-1', marginTop: '0.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>📅 พ่อพันธุ์ (ก่อนผสม)</div>
                                        <button type="button" className="btn btn-sm btn-outline" onClick={addMaleSlot} style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>+ เพิ่มพ่อพันธุ์</button>
                                    </div>
                                    
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {form.males.map((maleSlot, idx) => (
                                            <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '1rem', position: 'relative' }}>
                                                {form.males.length > 1 && (
                                                    <button type="button" onClick={() => removeMaleSlot(idx)} style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
                                                )}
                                                
                                                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                                                    <label>ตัวผู้ ♂ (1.0) *</label>
                                                    <select value={maleSlot.maleId} onChange={e => updateMale(idx, 'maleId', e.target.value)} required>
                                                        <option value="">-- เลือกตัวผู้ --</option>
                                                        {maleSnakes.map(s => <option key={s.id} value={s.id}>{s.code ? `${s.code} - ` : ''}{s.name} {s.morph ? `(${s.morph})` : ''}</option>)}
                                                        {maleSnakes.length === 0 && snakes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                                    </select>
                                                </div>

                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                                        <label>วันเข้า (Intro) *</label>
                                                        <input type="date" value={maleSlot.pairedDate} onChange={e => updateMale(idx, 'pairedDate', e.target.value)} required />
                                                    </div>
                                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                                        <label>วันออก (Out)</label>
                                                        <input type="date" value={maleSlot.separateDate} onChange={e => updateMale(idx, 'separateDate', e.target.value)} />
                                                    </div>
                                                    <div className="form-group" style={{ marginBottom: 0, gridColumn: '1/-1', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                        <div style={{ flex: 1 }}>
                                                            <label>วัน Lock</label>
                                                            <input type="date" value={maleSlot.lockDate} onChange={e => updateMale(idx, 'lockDate', e.target.value)} />
                                                        </div>
                                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem', flex: 1, cursor: 'pointer' }}>
                                                            <input type="checkbox" checked={maleSlot.isLockSuccessful} onChange={e => updateMale(idx, 'isLockSuccessful', e.target.checked)} style={{ width: 16, height: 16 }} />
                                                            ✅ เป็นช็อตที่ถูก (Lock)
                                                        </label>
                                                    </div>
                                                    <div className="form-group" style={{ marginBottom: 0, gridColumn: '1/-1' }}>
                                                        <label>จำนวนวันที่อยู่ด้วยกัน</label>
                                                        <input type="number" min="0" value={maleSlot.daysCohabited} onChange={e => updateMale(idx, 'daysCohabited', e.target.value)} placeholder="0" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* หลังผสม */}
                                <div className="form-group" style={{ gridColumn: '1/-1', marginTop: '1rem' }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#eab308', marginBottom: '0.5rem', textTransform: 'uppercase' }}>🥚 หลังผสม</div>
                                </div>
                                <div className="form-group">
                                    <label>วัน Ovulation (คลกไข่)</label>
                                    <input type="date" value={form.ovulationDate} onChange={e => setForm({ ...form, ovulationDate: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <input type="checkbox" checked={form.preLayShed} onChange={e => setForm({ ...form, preLayShed: e.target.checked })} style={{ width: 16, height: 16 }} />
                                        ลอกคราบก่อนออกไข่ (Pre-Lay Shed)
                                    </label>
                                </div>
                                <div className="form-group">
                                    <label>วันออกไข่ (Lay Date)</label>
                                    <input type="date" value={form.clutchDate} onChange={e => setForm({ ...form, clutchDate: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>จำนวนไข่ทั้งหมด</label>
                                    <input type="number" min="0" value={form.eggCount} onChange={e => setForm({ ...form, eggCount: e.target.value })} placeholder="0" />
                                </div>
                                <div className="form-group">
                                    <label>ไข่ดี</label>
                                    <input type="number" min="0" value={form.goodEggs} onChange={e => setForm({ ...form, goodEggs: e.target.value })} placeholder="0" />
                                </div>
                                <div className="form-group">
                                    <label>ไข่เสีย</label>
                                    <input type="number" min="0" value={form.badEggs} onChange={e => setForm({ ...form, badEggs: e.target.value })} placeholder="0" />
                                </div>
                                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                                    <label>หมายเหตุ</label>
                                    <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="เช่น เกี่ยว AL-PIE มาก่อน" />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-outline" onClick={() => setIsOpen(false)}>ยกเลิก</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'กำลังบันทึก...' : 'บันทึก'}</button>
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
                title="ยืนยันการลบบันทึก"
                message="คุณต้องการลบบันทึกการผสมพันธุ์นี้ใช่หรือไม่?"
                itemName={itemToDelete ? `${capitalize(itemToDelete.female?.name)}` : ''}
            />
        </div>
    );
}
