import { useState } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';

const API = import.meta.env.VITE_API_URL || 'http://43.229.149.151:5000/api';
const BASE_URL = API.replace('/api', '');

export default function ImageUpload({ value, onChange, label, type = 'admin' }) {
    const [uploading, setUploading] = useState(false);

    const handleUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            toast.error('ไฟล์มีขนาดใหญ่เกินไป (สูงสุด 10MB)');
            return;
        }

        const formData = new FormData();
        formData.append('image', file);

        setUploading(true);
        try {
            const res = await fetch(`${API}/snakes/upload?type=${type}`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!res.ok) throw new Error('Upload failed');

            const data = await res.json();
            onChange(data.url);
            toast.success('อัพโหลดรูปภาพสำเร็จ');
        } catch (error) {
            console.error(error);
            toast.error('อัพโหลดรูปภาพไม่สำเร็จ');
        } finally {
            setUploading(false);
        }
    };

    const removeImage = () => {
        onChange('');
    };

    return (
        <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</label>

            <div className="relative group">
                {value ? (
                    <div className="relative aspect-video rounded-xl overflow-hidden border border-white/10 glass-card bg-slate-900/50">
                        <img
                            src={value.startsWith('http') ? value : `${BASE_URL}${value}`}
                            alt="Preview"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                                type="button"
                                onClick={removeImage}
                                className="p-2 bg-red-500 rounded-lg text-white hover:bg-red-600 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>
                ) : (
                    <label className="flex flex-col items-center justify-center aspect-video rounded-xl border-2 border-dashed border-white/10 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all cursor-pointer group">
                        {uploading ? (
                            <Loader2 size={32} className="text-emerald-500 animate-spin" />
                        ) : (
                            <>
                                <Upload size={32} className="text-slate-500 group-hover:text-emerald-500 transition-colors mb-2" />
                                <span className="text-sm text-slate-400 group-hover:text-emerald-400 transition-colors font-medium">คลิกเพื่ออัพโหลดรูปภาพ</span>
                                <span className="text-[10px] text-slate-500 mt-1">JPG, PNG, WEBP (สูงสุด 10MB)</span>
                            </>
                        )}
                        <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleUpload}
                            disabled={uploading}
                        />
                    </label>
                )}
            </div>
        </div>
    );
}
