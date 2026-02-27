import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

const SOCKET_URL = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace('/api', '')
    : 'http://103.142.150.196:5000';
const API = import.meta.env.VITE_API_URL || 'http://103.142.150.196:5000/api';

const SocketContext = createContext(null);

// Notification sound
const notifSound = new Audio('/notification.mp3');
notifSound.volume = 0.5;

const STATUS_LABELS = {
    completed: 'สำเร็จ',
    pending_payment: 'รอชำระเงิน',
    awaiting_verification: 'รอตรวจสอบ',
    processing: 'กำลังเตรียมของ',
    shipping: 'กำลังจัดส่ง',
    cancelled: 'ยกเลิก',
    rejected: 'สลิปไม่ถูกต้อง',
};

export function SocketProvider({ children }) {
    const socketRef = useRef(null);
    const [connected, setConnected] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const clearUnread = useCallback(() => {
        setUnreadCount(0);
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        const socket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 5,
            reconnectionDelay: 2000,
        });

        socketRef.current = socket;

        const playSoundIfEnabled = async () => {
            try {
                const res = await fetch(`${API}/settings`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const settings = await res.json();
                    const soundEnabled = settings.find(s => s.key === 'notify_sound')?.value === 'true';
                    if (soundEnabled) {
                        notifSound.play().catch(e => console.log('Audio play blocked:', e));
                    }
                }
            } catch { console.error('Failed to load sound settings'); }
        };

        socket.on('connect', () => setConnected(true));
        socket.on('disconnect', () => setConnected(false));

        // Notification Listeners
        socket.on('new_order', (data) => {
            const payLabel = data.paymentMethod === 'transfer' ? '💳 โอนเงิน' : '💵 เงินสด';
            const msg = `ออเดอร์ใหม่ #${data.orderNo?.slice(-8) || data.orderId} — ฿${Number(data.total).toLocaleString('th-TH')} (${payLabel})`;
            toast.success(msg, { duration: 5000, icon: '🛒' });
            setUnreadCount(prev => prev + 1);
            playSoundIfEnabled();
        });

        socket.on('order_status_changed', (data) => {
            const prev = STATUS_LABELS[data.previousStatus] || data.previousStatus;
            const curr = STATUS_LABELS[data.status] || data.status;
            const msg = `ออเดอร์ #${data.orderNo?.slice(-8) || data.orderId}: ${prev} → ${curr}`;
            toast(msg, { duration: 4000, icon: '🔄' });
            setUnreadCount(prev => prev + 1);
            playSoundIfEnabled();
        });

        socket.on('low_stock_alert', (data) => {
            const msg = `${data.name} เหลือสต็อกเพียง ${data.stock} ตัว`;
            toast(msg, {
                duration: 6000,
                icon: '⚠️',
                style: { background: '#451a03', color: '#fbbf24', border: '1px solid #92400e' },
            });
            setUnreadCount(prev => prev + 1);
            playSoundIfEnabled();
        });

        socket.on('sales_target_reached', (data) => {
            const msg = `ฉลอง! ยอดขายวันนี้ถึงเป้า ฿${Number(data.target).toLocaleString('th-TH')} แล้ว (ปัจจุบัน ฿${Number(data.total).toLocaleString('th-TH')})`;
            toast.success(msg, {
                duration: 10000,
                icon: '🎉',
                style: { background: '#064e3b', color: '#6ee7b7', border: '1px solid #059669' },
            });
            setUnreadCount(prev => prev + 1);
            playSoundIfEnabled();
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, []);

    return (
        // eslint-disable-next-line react-hooks/refs
        <SocketContext.Provider value={{ socket: socketRef.current, connected, unreadCount, clearUnread }}>
            {children}
        </SocketContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSocket() {
    return useContext(SocketContext);
}
