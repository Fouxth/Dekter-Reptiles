import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

const SOCKET_URL = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace('/api', '')
    : 'http://43.229.149.151:5000';
const API = import.meta.env.VITE_API_URL;

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
    const [notifications, setNotifications] = useState([]);

    const fetchNotifications = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const res = await fetch(`${API}/notifications`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
                const unread = data.filter(n => !n.isRead).length;
                setUnreadCount(unread);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    }, []);

    const markRead = useCallback(async (id) => {
        const token = localStorage.getItem('token');
        try {
            await fetch(`${API}/notifications/${id}/read`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark read:', error);
        }
    }, []);

    const markAllRead = useCallback(async () => {
        const token = localStorage.getItem('token');
        try {
            await fetch(`${API}/notifications/read-all`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all read:', error);
        }
    }, []);

    const clearAll = useCallback(async () => {
        const token = localStorage.getItem('token');
        try {
            await fetch(`${API}/notifications`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setNotifications([]);
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to clear notifications:', error);
        }
    }, []);

    const clearUnread = useCallback(() => {
        markAllRead();
    }, [markAllRead]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        fetchNotifications();

        const socket = io(SOCKET_URL, {
            transports: ['polling', 'websocket'],
            reconnectionAttempts: 10,
            reconnectionDelay: 3000,
            timeout: 10000,
            upgrade: true,
        });

        socketRef.current = socket;

        const playSoundIfEnabled = async () => {
            try {
                const res = await fetch(`${API}/settings`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const settings = await res.json();
                    const soundEnabled = settings.notify_sound === 'true' || settings.notify_sound === true;
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
            fetchNotifications(); // Refresh to get the persistent record
            playSoundIfEnabled();
        });

        socket.on('order_status_changed', (data) => {
            const prev = STATUS_LABELS[data.previousStatus] || data.previousStatus;
            const curr = STATUS_LABELS[data.status] || data.status;
            const msg = `ออเดอร์ #${data.orderNo?.slice(-8) || data.orderId}: ${prev} → ${curr}`;
            toast(msg, { duration: 4000, icon: '🔄' });
            fetchNotifications();
            playSoundIfEnabled();
        });

        socket.on('low_stock_alert', (data) => {
            const msg = `${data.name} เหลือสต็อกเพียง ${data.stock} ตัว`;
            toast(msg, {
                duration: 6000,
                icon: '⚠️',
                style: { background: '#451a03', color: '#fbbf24', border: '1px solid #92400e' },
            });
            fetchNotifications();
            playSoundIfEnabled();
        });

        socket.on('sales_target_reached', (data) => {
            const msg = `ฉลอง! ยอดขายวันนี้ถึงเป้า ฿${Number(data.target).toLocaleString('th-TH')} แล้ว (ปัจจุบัน ฿${Number(data.total).toLocaleString('th-TH')})`;
            toast.success(msg, {
                duration: 10000,
                icon: '🎉',
                style: { background: '#064e3b', color: '#6ee7b7', border: '1px solid #059669' },
            });
            fetchNotifications();
            playSoundIfEnabled();
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [fetchNotifications]);

    return (
        // eslint-disable-next-line react-hooks/refs
        <SocketContext.Provider value={{
            socket: socketRef.current,
            connected,
            unreadCount,
            notifications,
            markRead,
            markAllRead,
            clearAll,
            clearUnread,
            refresh: fetchNotifications
        }}>
            {children}
        </SocketContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSocket() {
    return useContext(SocketContext);
}
