import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';

const API = import.meta.env.VITE_API_URL || 'http://103.142.150.196:5000/api';

function fmtDate(d) {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
}

const capitalize = (str) => {
    if (!str) return str;
    return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
};

const EMPTY_FORM = {
    femaleId: '', maleId: '',
    pairedDate: new Date().toISOString().slice(0, 10),
    lockDate: '', separateDate: '', daysCohabited: '',
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
            femaleId: r.femaleId, maleId: r.maleId,
            pairedDate: r.pairedDate?.slice(0, 10) || '',
            lockDate: r.lockDate?.slice(0, 10) || '',
            separateDate: r.separateDate?.slice(0, 10) || '',
            daysCohabited: r.daysCohabited ?? '',
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

    async function handleSave(e) {
        e.preventDefault();
        setSaving(true);
        const url = editingId ? `${API}/breeding-records/${editingId}` : `${API}/breeding-records`;
        const method = editingId ? 'PUT' : 'POST';
        const res = await fetch(url, { method, headers: headers(), body: JSON.stringify(form) });
        if (res.ok) { setIsOpen(false); load(); }
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
                                    <button onClick={() => navigate(`/snakes/${r.maleId}`)} style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, padding: '0.3rem 0.75rem', color: '#93c5fd', cursor: 'pointer', fontSize: '0.8rem' }}>
                                        ♂ {capitalize(r.male?.name)} {r.male?.code && <span style={{ opacity: 0.6 }}>({r.male.code})</span>}
                                    </button>
                                </div>

                                {/* Timeline section - ก่อนผสม */}
                                <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: '0.75rem', marginBottom: '0.75rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase' }}>📅 ไทม์ไลน์</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                                        <InfoRow label="วันเข้า (Intro)" value={fmtDate(r.pairedDate)} />
                                        <InfoRow label="วัน Lock" value={fmtDate(r.lockDate)} />
                                        <InfoRow label="วันแยก (Out)" value={fmtDate(r.separateDate)} />
                                        <InfoRow label="อยู่ด้วยกัน" value={r.daysCohabited ? `${r.daysCohabited} วัน` : '-'} />
                                        <InfoRow label="Ovulation" value={fmtDate(r.ovulationDate)} />
                                        <InfoRow label="Pre-Lay Shed" value={r.preLayShed ? '✅ ลอกแล้ว' : '-'} color={r.preLayShed ? '#6ee7b7' : undefined} />
                                    </div>
                                </div>

                                {/* Egg section - หลังผสม */}
                                {(r.clutchDate || r.eggCount || r.offspringCount) && (
                                    <div style={{ background: 'rgba(234,179,8,0.05)', borderRadius: 10, padding: '0.75rem', marginBottom: '0.75rem', border: '1px solid rgba(234,179,8,0.1)' }}>
                                        <div style={{ fontSize: '0.7rem', color: '#eab308', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase' }}>🥚 ข้อมูลไข่</div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                                            <InfoRow label="วันออกไข่" value={fmtDate(r.clutchDate)} />
                                            <InfoRow label="จำนวนไข่" value={r.eggCount ?? '-'} />
                                            <InfoRow label="ไข่ดี" value={r.goodEggs ?? '-'} color="#6ee7b7" />
                                            <InfoRow label="ไข่เสีย" value={r.badEggs ?? '-'} color="#f87171" />
                                            {r.offspringCount != null && <InfoRow label="จำนวนลูก" value={`🐍 ${r.offspringCount} ตัว`} color="#6ee7b7" />}
                                        </div>
                                    </div>
                                )}

                                {(r.female?.genetics || r.male?.genetics) && (
                                    <div style={{ background: 'rgba(139,92,246,0.08)', borderRadius: 8, padding: '0.5rem 0.75rem', marginBottom: '0.5rem', fontSize: '0.75rem', color: '#c4b5fd' }}>
                                        🧬 {[capitalize(r.female?.genetics), capitalize(r.male?.genetics)].filter(Boolean).join(' × ')}
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
                                {!editingId && <>
                                    <div className="form-group">
                                        <label>ตัวเมีย ♀ (0.1) *</label>
                                        <select value={form.femaleId} onChange={e => setForm({ ...form, femaleId: e.target.value })} required>
                                            <option value="">-- เลือกตัวเมีย --</option>
                                            {femaleSnakes.map(s => <option key={s.id} value={s.id}>{s.code ? `${s.code} - ` : ''}{s.name} {s.morph ? `(${s.morph})` : ''}</option>)}
                                            {femaleSnakes.length === 0 && snakes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>ตัวผู้ ♂ (1.0) *</label>
                                        <select value={form.maleId} onChange={e => setForm({ ...form, maleId: e.target.value })} required>
                                            <option value="">-- เลือกตัวผู้ --</option>
                                            {maleSnakes.map(s => <option key={s.id} value={s.id}>{s.code ? `${s.code} - ` : ''}{s.name} {s.morph ? `(${s.morph})` : ''}</option>)}
                                            {maleSnakes.length === 0 && snakes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                </>}

                                {/* Timeline - ก่อนผสม */}
                                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase' }}>📅 ก่อนผสม</div>
                                </div>
                                <div className="form-group">
                                    <label>วันเข้า (Intro) *</label>
                                    <input type="date" value={form.pairedDate} onChange={e => setForm({ ...form, pairedDate: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>วัน Lock</label>
                                    <input type="date" value={form.lockDate} onChange={e => setForm({ ...form, lockDate: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>วันแยก (ออก)</label>
                                    <input type="date" value={form.separateDate} onChange={e => setForm({ ...form, separateDate: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>อยู่ด้วยกัน (วัน)</label>
                                    <input type="number" min="0" value={form.daysCohabited} onChange={e => setForm({ ...form, daysCohabited: e.target.value })} placeholder="จำนวนวัน" />
                                </div>

                                {/* หลังผสม */}
                                <div className="form-group" style={{ gridColumn: '1/-1' }}>
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
                itemName={itemToDelete ? `${capitalize(itemToDelete.female?.name)} × ${capitalize(itemToDelete.male?.name)}` : ''}
            />
        </div>
    );
}
