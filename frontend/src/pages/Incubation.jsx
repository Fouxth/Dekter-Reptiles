import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Egg, Plus, Thermometer, Calendar, CheckCircle, XCircle, X } from 'lucide-react';
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

const EMPTY_FORM = {
    femaleId: '', maleIds: [''], breedingId: '',
    incubationStart: '', pippingDate: '', hatchDate: '',
    temperature: '', actualHatched: '', deadCount: '', notes: ''
};

export default function Incubation() {
    const navigate = useNavigate();
    const { getToken } = useAuth();
    const [records, setRecords] = useState([]);
    const [snakes, setSnakes] = useState([]);
    const [breedingRecords, setBreedingRecords] = useState([]);
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
        const [incRes, snkRes, brRes] = await Promise.all([
            fetch(`${API}/incubation-records`, { headers: headers() }),
            fetch(`${API}/snakes`, { headers: headers() }),
            fetch(`${API}/breeding-records`, { headers: headers() }),
        ]);
        if (incRes.ok) setRecords(await incRes.json());
        if (snkRes.ok) setSnakes(await snkRes.json());
        if (brRes.ok) setBreedingRecords(await brRes.json());
        setLoading(false);
    }

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
            maleIds: r.males?.length > 0 ? r.males.map(m => m.id) : [''], 
            breedingId: r.breedingId || '',
            incubationStart: r.incubationStart?.slice(0, 10) || '',
            pippingDate: r.pippingDate?.slice(0, 10) || '',
            hatchDate: r.hatchDate?.slice(0, 10) || '',
            temperature: r.temperature ?? '',
            actualHatched: r.actualHatched ?? '',
            deadCount: r.deadCount ?? '',
            notes: r.notes || '',
        });
        setIsOpen(true);
    }

    function addMaleSlot() {
        setForm(prev => ({ ...prev, maleIds: [...prev.maleIds, ''] }));
    }

    function removeMaleSlot(index) {
        if (form.maleIds.length === 1) return;
        setForm(prev => ({ ...prev, maleIds: prev.maleIds.filter((_, i) => i !== index) }));
    }

    function updateMale(index, value) {
        setForm(prev => {
            const newMales = [...prev.maleIds];
            newMales[index] = value;
            return { ...prev, maleIds: newMales };
        });
    }

    async function handleSave(e) {
        e.preventDefault();
        const validMaleIds = form.maleIds.filter(Boolean);
        if (validMaleIds.length === 0) {
            toast.error('กรุณาเลือกตัวผู้อย่างน้อย 1 ตัว');
            return;
        }

        setSaving(true);
        const url = editingId ? `${API}/incubation-records/${editingId}` : `${API}/incubation-records`;
        const method = editingId ? 'PUT' : 'POST';
        const payload = { ...form, maleIds: validMaleIds };
        if (!payload.breedingId) delete payload.breedingId;
        const res = await fetch(url, { method, headers: headers(), body: JSON.stringify(payload) });
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
            const res = await fetch(`${API}/incubation-records/${itemToDelete.id}`, { method: 'DELETE', headers: headers() });
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
        <div className="page incubation-page">
            <div className="page-header">
                <div>
                    <h1>🔥 ฟักไข่</h1>
                    <p className="page-subtitle">ติดตามการฟักไข่, อุณหภูมิ และผลฟักลูก</p>
                </div>
                <button className="btn btn-primary" onClick={openNew}><Plus size={16} style={{ marginRight: 4 }} /> เพิ่มบันทึก</button>
            </div>

            {loading ? <div className="loading-center"><div className="spinner" /></div> : (
                <>
                    {records.length === 0 && (
                        <div className="loading-center" style={{ flexDirection: 'column', gap: '1rem', padding: '3rem' }}>
                            <div style={{ fontSize: '4rem' }}>🔥</div>
                            <p style={{ color: '#64748b' }}>ยังไม่มีบันทึกการฟักไข่</p>
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
                                        <button key={idx} onClick={() => navigate(`/snakes/${m.id}`)} style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, padding: '0.3rem 0.75rem', color: '#93c5fd', cursor: 'pointer', fontSize: '0.8rem' }}>
                                            ♂ {capitalize(m.name)} {m.code && <span style={{ opacity: 0.6 }}>({m.code})</span>}
                                        </button>
                                    ))}
                                </div>

                                {/* Incubation Details */}
                                <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: '0.75rem', marginBottom: '0.75rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase' }}>📅 รายละเอียดการฟัก</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                                        <InfoRow label="เข้าเครื่องฟัก" value={fmtDate(r.incubationStart)} />
                                        <InfoRow label="อุณหภูมิ" value={r.temperature ? `${r.temperature}°C` : '-'} color="#fbbf24" />
                                        <InfoRow label="วันเริ่มบุ๋ม" value={fmtDate(r.pippingDate)} />
                                        <InfoRow label="วันฟักจริง" value={fmtDate(r.hatchDate)} />
                                    </div>
                                </div>

                                {/* Results section */}
                                <div style={{ background: 'rgba(110,231,183,0.05)', borderRadius: 10, padding: '0.75rem', marginBottom: '0.75rem', border: '1px solid rgba(110,231,183,0.1)' }}>
                                    <div style={{ fontSize: '0.7rem', color: '#6ee7b7', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase' }}>🐍 ผลการฟัก</div>
                                    <div style={{ display: 'flex', gap: '2rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <CheckCircle size={16} style={{ color: '#6ee7b7' }} />
                                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#6ee7b7' }}>{r.actualHatched ?? 0}</div>
                                            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>ฟักจริง</div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <XCircle size={16} style={{ color: '#f87171' }} />
                                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f87171' }}>{r.deadCount ?? 0}</div>
                                            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>เสีย</div>
                                        </div>
                                    </div>
                                </div>

                                {r.notes && (
                                    <div style={{ padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: 8, marginBottom: '0.75rem', fontSize: '0.8rem', color: '#94a3b8' }}>
                                        📝 {r.notes}
                                    </div>
                                )}

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
                    <div className="modal" style={{ maxWidth: 540 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingId ? 'แก้ไขฟักไข่' : '🔥 เพิ่มบันทึกฟักไข่'}</h2>
                            <button className="modal-close" onClick={() => setIsOpen(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSave} style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', maxHeight: 'calc(100vh - 10rem)' }}>
                            <div className="form-grid">
                                {!editingId && <>
                                    <div className="form-group" style={{ gridColumn: '1/-1' }}>
                                        <label>ตัวเมีย ♀ *</label>
                                        <select value={form.femaleId} onChange={e => setForm({ ...form, femaleId: e.target.value })} required>
                                            <option value="">-- เลือก --</option>
                                            {femaleSnakes.map(s => <option key={s.id} value={s.id}>{s.code ? `${s.code} - ` : ''}{s.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group" style={{ gridColumn: '1/-1' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                            <label style={{ marginBottom: 0 }}>ตัวผู้ ♂ *</label>
                                            <button type="button" className="btn btn-sm btn-outline" onClick={addMaleSlot} style={{ padding: '0.1rem 0.4rem', fontSize: '0.7rem' }}>+ เพิ่มตัวผู้</button>
                                        </div>
                                        {form.maleIds.map((mId, idx) => (
                                            <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                <select value={mId} onChange={e => updateMale(idx, e.target.value)} required style={{ flex: 1 }}>
                                                    <option value="">-- เลือกตัวผู้ --</option>
                                                    {maleSnakes.map(s => <option key={s.id} value={s.id}>{s.code ? `${s.code} - ` : ''}{s.name}</option>)}
                                                </select>
                                                {form.maleIds.length > 1 && (
                                                    <button type="button" onClick={() => removeMaleSlot(idx)} style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', borderRadius: 8, padding: '0 0.75rem', cursor: 'pointer' }}>✕</button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    {breedingRecords.length > 0 && (
                                        <div className="form-group" style={{ gridColumn: '1/-1' }}>
                                            <label>เชื่อมโยงกับบันทึกผสมพันธุ์ (ถ้ามี)</label>
                                            <select value={form.breedingId} onChange={e => {
                                                const selectedId = e.target.value;
                                                setForm(prev => {
                                                    const newState = { ...prev, breedingId: selectedId };
                                                    if (selectedId) {
                                                        const breedingRec = breedingRecords.find(br => br.id == selectedId);
                                                        if (breedingRec && breedingRec.males) {
                                                            newState.maleIds = breedingRec.males.map(m => String(m.maleId));
                                                        }
                                                    }
                                                    return newState;
                                                });
                                            }}>
                                                <option value="">-- ไม่เชื่อมโยง --</option>
                                                {breedingRecords.filter(br => !form.femaleId || String(br.femaleId) === String(form.femaleId)).map(br => (
                                                    <option key={br.id} value={br.id}>
                                                        {br.female?.name} × {br.males?.map(m => m.male?.name).join(', ')} ({fmtDate(br.males?.[0]?.pairedDate || br.createdAt)})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </>}

                                <div className="form-group">
                                    <label>วันเข้าเครื่องฟัก</label>
                                    <input type="date" value={form.incubationStart} onChange={e => setForm({ ...form, incubationStart: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>อุณหภูมิ (°C)</label>
                                    <input type="number" step="0.1" min="0" value={form.temperature} onChange={e => setForm({ ...form, temperature: e.target.value })} placeholder="เช่น 31.5" />
                                </div>
                                <div className="form-group">
                                    <label>วันเริ่มบุ๋ม (Pipping)</label>
                                    <input type="date" value={form.pippingDate} onChange={e => setForm({ ...form, pippingDate: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>วันฟัก (Hatch)</label>
                                    <input type="date" value={form.hatchDate} onChange={e => setForm({ ...form, hatchDate: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>จำนวนฟักจริง</label>
                                    <input type="number" min="0" value={form.actualHatched} onChange={e => setForm({ ...form, actualHatched: e.target.value })} placeholder="0" />
                                </div>
                                <div className="form-group">
                                    <label>จำนวนเสีย</label>
                                    <input type="number" min="0" value={form.deadCount} onChange={e => setForm({ ...form, deadCount: e.target.value })} placeholder="0" />
                                </div>
                                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                                    <label>หมายเหตุ / ข้อผิดพลาด</label>
                                    <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} />
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
            <ConfirmModal
                isOpen={!!itemToDelete}
                onClose={() => setItemToDelete(null)}
                onConfirm={confirmDelete}
                title="ยืนยันการลบบันทึก"
                message="คุณต้องการลบบันทึกการฟักไข่นี้ใช่หรือไม่?"
                itemName={itemToDelete ? `${capitalize(itemToDelete.female?.name)}` : ''}
            />
        </div>
    );
}
