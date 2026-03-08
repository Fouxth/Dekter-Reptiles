import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';

const API = import.meta.env.VITE_API_URL;
const resolveImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return url;
};

function calcAge(dob) {
    if (!dob) return '-';
    const diff = Date.now() - new Date(dob).getTime();
    const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30.44));
    if (months < 12) return `${months} เดือน`;
    const years = Math.floor(months / 12);
    const rem = months % 12;
    return rem > 0 ? `${years} ปี ${rem} เดือน` : `${years} ปี`;
}

const localDate = new Date().toLocaleDateString('sv-SE'); // YYYY-MM-DD

function formatDate(d) {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
}

const capitalize = (str) => {
    if (!str) return str;
    return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
};

export default function SnakeDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { getToken } = useAuth();
    const [snake, setSnake] = useState(null);
    const [healthRecords, setHealthRecords] = useState([]);
    const [breedingRecords, setBreedingRecords] = useState([]);
    const [stockLogs, setStockLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('health');
    const [showHealthForm, setShowHealthForm] = useState(false);
    const [healthForm, setHealthForm] = useState({ recordDate: localDate, weight: '', length: '', fed: false, feedItem: '', shed: false, note: '' });
    const [saving, setSaving] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [feedSizes, setFeedSizes] = useState(["Pinky", "Fuzzy", "Hopper", "S", "M", "L", "XL", "RXL"]);

    const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` });

    async function load() {
        setLoading(true);
        const [snakeRes, healthRes, breedingRes, stockRes] = await Promise.all([
            fetch(`${API}/snakes/${id}`, { headers: headers() }),
            fetch(`${API}/health-records?snakeId=${id}`, { headers: headers() }),
            fetch(`${API}/breeding-records?snakeId=${id}`, { headers: headers() }),
            fetch(`${API}/stock-logs?snakeId=${id}`, { headers: headers() }),
        ]);
        if (snakeRes.ok) setSnake(await snakeRes.json());
        if (healthRes.ok) setHealthRecords(await healthRes.json());
        if (breedingRes.ok) setBreedingRecords(await breedingRes.json());
        if (stockRes.ok) setStockLogs(await stockRes.json());

        // Fetch settings for feed sizes
        const settingsRes = await fetch(`${API}/settings`, { headers: headers() });
        if (settingsRes.ok) {
            const settings = await settingsRes.json();
            if (settings.feed_sizes) {
                try {
                    const parsed = JSON.parse(settings.feed_sizes);
                    if (Array.isArray(parsed)) setFeedSizes(parsed);
                } catch (e) { console.error('Error parsing feed_sizes:', e); }
            }
        }
        setLoading(false);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { load(); }, [id]);

    async function saveHealth(e) {
        e.preventDefault();
        setSaving(true);
        const res = await fetch(`${API}/health-records`, {
            method: 'POST', headers: headers(),
            body: JSON.stringify({ ...healthForm, snakeId: Number(id) }),
        });
        if (res.ok) { setShowHealthForm(false); setHealthForm({ recordDate: localDate, weight: '', length: '', fed: false, feedItem: '', shed: false, note: '' }); load(); }
        setSaving(false);
    }

    function deleteHealth(r) {
        setItemToDelete(r);
    }

    // eslint-disable-next-line no-unused-vars
    async function confirmDeleteHealth() {
        if (!itemToDelete) return;
        try {
            const res = await fetch(`${API}/health-records/${itemToDelete.id}`, { method: 'DELETE', headers: headers() });
            if (res.ok) {
                toast.success('ลบบันทึกแล้ว');
                load();
            } else {
                toast.error('ไม่สามารถลบได้');
            }
        } catch (error) {
            console.error(error);
            toast.error('เกิดข้อผิดพลาด');
        } finally {
            setItemToDelete(null);
        }
    }

    if (loading) return <div className="loading-center"><div className="spinner" /></div>;
    if (!snake) return <div style={{ padding: '2rem', color: '#94a3b8' }}>ไม่พบข้อมูลงู</div>;

    return (
        <div className="page snake-detail-page">
            {/* Back button */}
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/inventory')} style={{ marginBottom: '1rem' }}>
                ← กลับ
            </button>

            {/* Snake Header Card */}
            <div className="card snake-header-card" style={{ display: 'flex', gap: '1rem', padding: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <div className="snake-photo">
                    {(() => {
                        const img = snake.adminImage || snake.image; // Fallback to legacy field if present
                        return img ? (
                            <img src={resolveImageUrl(img)} alt={snake.name} style={{ width: '100%', maxWidth: 140, height: 'auto', aspectRatio: '1/1', objectFit: 'cover', borderRadius: 16 }} />
                        ) : (
                            <div style={{ width: '100%', maxWidth: 140, aspectRatio: '1/1', background: 'rgba(255,255,255,0.05)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>🐍</div>
                        );
                    })()}
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'capitalize', letterSpacing: '0.05em', marginBottom: 4 }}>{capitalize(snake.category?.name)}</div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f8fafc', margin: '0 0 0.5rem' }}>{snake.name}</h1>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                        {snake.gender && <span className={`badge ${snake.gender === 'female' ? 'badge-danger' : 'badge-primary'}`}>{snake.gender === 'female' ? '♀ ตัวเมีย' : '♂ ตัวผู้'}</span>}
                        {snake.genetics && <span className="badge badge-gray">🧬 {capitalize(snake.genetics)}</span>}
                        {snake.color && <span className="badge badge-gray">🎨 {capitalize(snake.color)}</span>}
                        <span className={`badge ${snake.stock > 2 ? 'badge-success' : snake.stock > 0 ? 'badge-gray' : 'badge-danger'}`}>
                            📦 Stock: {snake.stock}
                        </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(140px, 100%),1fr))', gap: '0.5rem' }}>
                        {[
                            { label: 'อายุ', value: calcAge(snake.dateOfBirth) },
                            { label: 'วันเกิด', value: formatDate(snake.dateOfBirth) },
                            { label: 'ราคาขาย', value: snake.price ? `฿${snake.price.toLocaleString('th-TH')}` : '-' },
                            { label: 'ราคาทุน', value: snake.cost ? `฿${snake.cost.toLocaleString('th-TH')}` : '-' },
                        ].map(({ label, value }) => (
                            <div key={label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '0.5rem 0.75rem' }}>
                                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{label}</div>
                                <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.9rem' }}>{value}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                {[
                    { key: 'health', label: '🏥 สุขภาพ', count: healthRecords.length },
                    { key: 'breeding', label: '🥚 ผสมพันธุ์', count: breedingRecords.length },
                    { key: 'stock', label: '📦 Stock Log', count: stockLogs.length },
                ].map(tab => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                        className={`btn ${activeTab === tab.key ? 'btn-primary' : 'btn-outline'} btn-sm`}>
                        {tab.label} <span style={{ opacity: 0.7, fontSize: '0.75rem' }}>({tab.count})</span>
                    </button>
                ))}
            </div>

            {/* Health Records Tab */}
            {activeTab === 'health' && (
                <div>
                    <div className="page-header" style={{ marginBottom: '0.75rem' }}>
                        <h2 style={{ color: '#f8fafc', fontSize: '1rem', margin: 0 }}>บันทึกสุขภาพ</h2>
                        <button className="btn btn-primary btn-sm" onClick={() => setShowHealthForm(!showHealthForm)}>
                            {showHealthForm ? 'ยกเลิก' : '+ เพิ่มบันทึก'}
                        </button>
                    </div>

                    {showHealthForm && (
                        <div className="card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
                            <form onSubmit={saveHealth}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(180px, 100%),1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                    <div className="form-group"><label>วันที่</label><input type="date" value={healthForm.recordDate} onChange={e => setHealthForm({ ...healthForm, recordDate: e.target.value })} /></div>
                                    <div className="form-group"><label>น้ำหนัก (กรัม)</label><input type="number" step="0.1" value={healthForm.weight} onChange={e => setHealthForm({ ...healthForm, weight: e.target.value })} placeholder="เช่น 320.5" /></div>
                                    <div className="form-group"><label>ความยาว (ซม.)</label><input type="number" step="0.1" value={healthForm.length} onChange={e => setHealthForm({ ...healthForm, length: e.target.value })} placeholder="เช่น 85" /></div>
                                    <div className="form-group">
                                        <label>อาหารที่ให้</label>
                                        <select value={healthForm.feedItem} onChange={e => setHealthForm({ ...healthForm, feedItem: e.target.value })}>
                                            <option value="">ไม่ระบุ</option>
                                            {feedSizes.map(size => (
                                                <option key={size} value={size}>{size}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '1.5rem', margin: '0.5rem 0 0.75rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#94a3b8', fontSize: '0.875rem' }}>
                                        <input type="checkbox" checked={healthForm.fed} onChange={e => setHealthForm({ ...healthForm, fed: e.target.checked })} />
                                        ✅ ให้อาหารแล้ว
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#94a3b8', fontSize: '0.875rem' }}>
                                        <input type="checkbox" checked={healthForm.shed} onChange={e => setHealthForm({ ...healthForm, shed: e.target.checked })} />
                                        🔄 ลอกคราบ
                                    </label>
                                </div>
                                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                                    <label>หมายเหตุ</label>
                                    <textarea value={healthForm.note} onChange={e => setHealthForm({ ...healthForm, note: e.target.value })} rows={2} />
                                </div>
                                <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>{saving ? 'กำลังบันทึก...' : 'บันทึก'}</button>
                            </form>
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {healthRecords.length === 0 && <div className="loading-center" style={{ padding: '2rem', color: '#64748b' }}>ยังไม่มีบันทึกสุขภาพ</div>}
                        {healthRecords.map(r => (
                            <div key={r.id} className="card" style={{ padding: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                                <div style={{ flex: 1, minWidth: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(120px, 100%),1fr))', gap: '0.5rem' }}>
                                    <div><div style={{ fontSize: '0.7rem', color: '#64748b' }}>วันที่</div><div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.875rem' }}>{formatDate(r.recordDate)}</div></div>
                                    {r.weight && <div><div style={{ fontSize: '0.7rem', color: '#64748b' }}>น้ำหนัก</div><div style={{ color: '#f8fafc', fontSize: '0.875rem' }}>{r.weight} ก.</div></div>}
                                    {r.length && <div><div style={{ fontSize: '0.7rem', color: '#64748b' }}>ความยาว</div><div style={{ color: '#f8fafc', fontSize: '0.875rem' }}>{r.length} ซม.</div></div>}
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', gridColumn: '1/-1', marginTop: 2 }}>
                                        {r.fed && <span className="badge badge-success">✅ ให้อาหาร{r.feedItem ? `: ${r.feedItem}` : ''}</span>}
                                        {r.shed && <span className="badge badge-primary">🔄 ลอกคราบ</span>}
                                        {r.note && <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{r.note}</span>}
                                    </div>
                                </div>
                                <button className="btn btn-sm btn-danger" onClick={() => deleteHealth(r)} style={{ flexShrink: 0 }}>ลบ</button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Breeding Records Tab */}
            {activeTab === 'breeding' && (
                <div>
                    <div className="page-header" style={{ marginBottom: '0.75rem' }}>
                        <h2 style={{ color: '#f8fafc', fontSize: '1rem', margin: 0 }}>ประวัติผสมพันธุ์</h2>
                        <button className="btn btn-primary btn-sm" onClick={() => navigate('/breeding')}>เพิ่มบันทึก</button>
                    </div>
                    {breedingRecords.length === 0 && <div className="loading-center" style={{ padding: '2rem', color: '#64748b' }}>ยังไม่มีบันทึกการผสมพันธุ์</div>}
                    {breedingRecords.map(r => (
                        <div key={r.id} className="card" style={{ padding: '1rem', marginBottom: '0.5rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px,1fr))', gap: '0.5rem' }}>
                                <div><div style={{ fontSize: '0.7rem', color: '#64748b' }}>ตัวเมีย</div><div style={{ fontWeight: 600, color: '#fca5a5', fontSize: '0.875rem' }}>♀ {r.female?.name}</div></div>
                                <div><div style={{ fontSize: '0.7rem', color: '#64748b' }}>ตัวผู้</div><div style={{ fontWeight: 600, color: '#93c5fd', fontSize: '0.875rem' }}>♂ {r.male?.name}</div></div>
                                <div><div style={{ fontSize: '0.7rem', color: '#64748b' }}>วันผสม</div><div style={{ color: '#f8fafc', fontSize: '0.875rem' }}>{formatDate(r.pairedDate)}</div></div>
                                {r.clutchDate && <div><div style={{ fontSize: '0.7rem', color: '#64748b' }}>วันออกไข่/ลูก</div><div style={{ color: '#f8fafc', fontSize: '0.875rem' }}>{formatDate(r.clutchDate)}</div></div>}
                                {r.offspringCount !== null && <div><div style={{ fontSize: '0.7rem', color: '#64748b' }}>จำนวนลูก</div><div style={{ fontWeight: 600, color: '#6ee7b7', fontSize: '0.875rem' }}>{r.offspringCount} ตัว</div></div>}
                                {r.female?.genetics && <div><div style={{ fontSize: '0.7rem', color: '#64748b' }}>Genetics แม่</div><div style={{ color: '#c4b5fd', fontSize: '0.8rem' }}>🧬 {r.female.genetics}</div></div>}
                                {r.male?.genetics && <div><div style={{ fontSize: '0.7rem', color: '#64748b' }}>Genetics พ่อ</div><div style={{ color: '#c4b5fd', fontSize: '0.8rem' }}>🧬 {r.male.genetics}</div></div>}
                                {r.notes && <div style={{ gridColumn: '1/-1' }}><span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{r.notes}</span></div>}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Stock Log Tab */}
            {activeTab === 'stock' && (
                <div>
                    <div className="page-header" style={{ marginBottom: '0.75rem' }}>
                        <h2 style={{ color: '#f8fafc', fontSize: '1rem', margin: 0 }}>ประวัติปรับ Stock</h2>
                    </div>
                    {stockLogs.length === 0 && <div className="loading-center" style={{ padding: '2rem', color: '#64748b' }}>ยังไม่มีประวัติการปรับ stock</div>}
                    <div className="card">
                        <table className="data-table">
                            <thead><tr><th>วันที่</th><th>เปลี่ยนแปลง</th><th>เหตุผล</th><th>หมายเหตุ</th></tr></thead>
                            <tbody>
                                {stockLogs.map(l => (
                                    <tr key={l.id}>
                                        <td style={{ fontSize: '0.8rem' }}>{formatDate(l.createdAt)}</td>
                                        <td><span className={`badge ${l.change > 0 ? 'badge-success' : 'badge-danger'}`}>{l.change > 0 ? '+' : ''}{l.change}</span></td>
                                        <td style={{ fontSize: '0.8rem' }}>{{ purchase: 'ซื้อเข้า', sale: 'ขายออก', adjustment: 'ปรับ', return: 'คืน' }[l.reason] || l.reason}</td>
                                        <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{l.note || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            {/* Confirm Modal */}
            <ConfirmModal
                isOpen={!!itemToDelete}
                onClose={() => setItemToDelete(null)}
                onConfirm={confirmDeleteHealth}
                title="ยืนยันการลบบันทึก"
                message="คุณต้องการลบบันทึกสุขภาพนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้"
                itemName={itemToDelete ? formatDate(itemToDelete.recordDate) : ''}
            />
        </div>
    );
}
