import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Egg, Plus, Thermometer, Calendar, CheckCircle, XCircle, X } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

function fmtDate(d) {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
}

const EMPTY_FORM = {
    femaleId: '', maleId: '', breedingId: '',
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
            femaleId: r.femaleId, maleId: r.maleId, breedingId: r.breedingId || '',
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

    async function handleSave(e) {
        e.preventDefault();
        setSaving(true);
        const url = editingId ? `${API}/incubation-records/${editingId}` : `${API}/incubation-records`;
        const method = editingId ? 'PUT' : 'POST';
        const payload = { ...form };
        if (!payload.breedingId) delete payload.breedingId;
        const res = await fetch(url, { method, headers: headers(), body: JSON.stringify(payload) });
        if (res.ok) { setIsOpen(false); load(); }
        setSaving(false);
    }

    async function handleDelete(id) {
        if (!confirm('ลบบันทึกนี้?')) return;
        await fetch(`${API}/incubation-records/${id}`, { method: 'DELETE', headers: headers() });
        load();
    }

    return (
        <div className="page">
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

                    {/* Desktop Table */}
                    <div className="data-table-wrapper">
                        <table className="data-table" style={{ width: '100%' }}>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>ตัวเมีย (0.1)</th>
                                    <th>ตัวผู้ (1.0)</th>
                                    <th>เข้าเครื่องฟัก</th>
                                    <th>เริ่มบุ๋ม</th>
                                    <th>วันฟัก</th>
                                    <th>อุณหภูมิ</th>
                                    <th>ฟักจริง</th>
                                    <th>เสีย</th>
                                    <th>หมายเหตุ</th>
                                    <th>จัดการ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.map((r, i) => (
                                    <tr key={r.id}>
                                        <td>{i + 1}</td>
                                        <td>
                                            <button onClick={() => navigate(`/snakes/${r.femaleId}`)} style={{ color: '#fca5a5', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', textDecoration: 'underline' }}>
                                                {r.female?.name} {r.female?.code && <span style={{ opacity: 0.5 }}>({r.female.code})</span>}
                                            </button>
                                        </td>
                                        <td>
                                            <button onClick={() => navigate(`/snakes/${r.maleId}`)} style={{ color: '#93c5fd', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', textDecoration: 'underline' }}>
                                                {r.male?.name} {r.male?.code && <span style={{ opacity: 0.5 }}>({r.male.code})</span>}
                                            </button>
                                        </td>
                                        <td>{fmtDate(r.incubationStart)}</td>
                                        <td>{fmtDate(r.pippingDate)}</td>
                                        <td>{fmtDate(r.hatchDate)}</td>
                                        <td>{r.temperature ? `${r.temperature}°C` : '-'}</td>
                                        <td style={{ color: '#6ee7b7', fontWeight: 600 }}>{r.actualHatched ?? '-'}</td>
                                        <td style={{ color: '#f87171', fontWeight: 600 }}>{r.deadCount ?? '-'}</td>
                                        <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.notes || '-'}</td>
                                        <td>
                                            <div className="action-btns" style={{ justifyContent: 'flex-start' }}>
                                                <button className="btn btn-sm btn-outline" onClick={() => openEdit(r)}>แก้ไข</button>
                                                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(r.id)}>ลบ</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="mobile-card-list">
                        {records.map((r, i) => (
                            <div key={r.id} className="card" style={{ padding: '1rem' }}>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>#{i + 1}</span>
                                    <button onClick={() => navigate(`/snakes/${r.femaleId}`)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, padding: '0.2rem 0.5rem', color: '#fca5a5', cursor: 'pointer', fontSize: '0.75rem' }}>
                                        ♀ {r.female?.name}
                                    </button>
                                    <span style={{ color: '#64748b' }}>×</span>
                                    <button onClick={() => navigate(`/snakes/${r.maleId}`)} style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 6, padding: '0.2rem 0.5rem', color: '#93c5fd', cursor: 'pointer', fontSize: '0.75rem' }}>
                                        ♂ {r.male?.name}
                                    </button>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                                    <div><span style={{ color: '#64748b', fontSize: '0.65rem' }}>เข้าเครื่อง</span><br /><span style={{ color: '#f8fafc' }}>{fmtDate(r.incubationStart)}</span></div>
                                    <div><span style={{ color: '#64748b', fontSize: '0.65rem' }}>เริ่มบุ๋ม</span><br /><span style={{ color: '#f8fafc' }}>{fmtDate(r.pippingDate)}</span></div>
                                    <div><span style={{ color: '#64748b', fontSize: '0.65rem' }}>วันฟัก</span><br /><span style={{ color: '#f8fafc' }}>{fmtDate(r.hatchDate)}</span></div>
                                    <div><span style={{ color: '#64748b', fontSize: '0.65rem' }}>อุณหภูมิ</span><br /><span style={{ color: '#f8fafc' }}>{r.temperature ? `${r.temperature}°C` : '-'}</span></div>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                        <CheckCircle size={14} style={{ color: '#6ee7b7' }} />
                                        <span style={{ color: '#6ee7b7', fontWeight: 600, fontSize: '0.85rem' }}>{r.actualHatched ?? '-'}</span>
                                        <span style={{ color: '#64748b', fontSize: '0.7rem' }}>ฟักจริง</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                        <XCircle size={14} style={{ color: '#f87171' }} />
                                        <span style={{ color: '#f87171', fontWeight: 600, fontSize: '0.85rem' }}>{r.deadCount ?? '-'}</span>
                                        <span style={{ color: '#64748b', fontSize: '0.7rem' }}>เสีย</span>
                                    </div>
                                </div>

                                {r.notes && <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.5rem' }}>{r.notes}</p>}

                                <div className="action-btns">
                                    <button className="btn btn-sm btn-outline" onClick={() => openEdit(r)}>แก้ไข</button>
                                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(r.id)}>ลบ</button>
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
                                    <div className="form-group">
                                        <label>ตัวเมีย ♀ *</label>
                                        <select value={form.femaleId} onChange={e => setForm({ ...form, femaleId: e.target.value })} required>
                                            <option value="">-- เลือก --</option>
                                            {femaleSnakes.map(s => <option key={s.id} value={s.id}>{s.code ? `${s.code} - ` : ''}{s.name}</option>)}
                                            {femaleSnakes.length === 0 && snakes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>ตัวผู้ ♂ *</label>
                                        <select value={form.maleId} onChange={e => setForm({ ...form, maleId: e.target.value })} required>
                                            <option value="">-- เลือก --</option>
                                            {maleSnakes.map(s => <option key={s.id} value={s.id}>{s.code ? `${s.code} - ` : ''}{s.name}</option>)}
                                            {maleSnakes.length === 0 && snakes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                    {breedingRecords.length > 0 && (
                                        <div className="form-group" style={{ gridColumn: '1/-1' }}>
                                            <label>เชื่อมโยงกับบันทึกผสมพันธุ์ (ถ้ามี)</label>
                                            <select value={form.breedingId} onChange={e => setForm({ ...form, breedingId: e.target.value })}>
                                                <option value="">-- ไม่เชื่อมโยง --</option>
                                                {breedingRecords.map(br => (
                                                    <option key={br.id} value={br.id}>
                                                        {br.female?.name} × {br.male?.name} ({fmtDate(br.pairedDate)})
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
                                    <label>วันเริ่มบุ๋ม (Pipping)</label>
                                    <input type="date" value={form.pippingDate} onChange={e => setForm({ ...form, pippingDate: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>วันฟัก (Hatch)</label>
                                    <input type="date" value={form.hatchDate} onChange={e => setForm({ ...form, hatchDate: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>อุณหภูมิ (°C)</label>
                                    <input type="number" step="0.1" min="0" value={form.temperature} onChange={e => setForm({ ...form, temperature: e.target.value })} placeholder="เช่น 31.5" />
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
        </div>
    );
}
