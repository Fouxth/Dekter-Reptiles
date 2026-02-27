import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

const SOCKET_URL = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace('/api', '')
    : 'http://103.142.150.196:5000';
const API = import.meta.env.VITE_API_URL || 'http://103.142.150.196:5000/api';

// Sound effect
const notifSound = new Audio('/notification.mp3');
notifSound.volume = 0.5;

// Status label maps
const STATUS_LABELS = {
    completed: 'สำเร็จ',
    pending_payment: 'รอชำระเงิน',
    awaiting_verification: 'รอตรวจสอบ',
    processing: 'กำลังเตรียมของ',
    shipping: 'กำลังจัดส่ง',
    cancelled: 'ยกเลิก',
    rejected: 'สลิปไม่ถูกต้อง',
};

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const addNotification = useCallback((notif) => {
        setNotifications(prev => [notif, ...prev].slice(0, 50)); // keep latest 50
        setUnreadCount(prev => prev + 1);
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        const socket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 5,
        });

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
            } catch (e) { }
        };

        socket.on('new_order', (data) => {
            const payLabel = data.paymentMethod === 'transfer' ? '💳 โอนเงิน' : '💵 เงินสด';
            const msg = `ออเดอร์ใหม่ #${data.orderNo?.slice(-8) || data.orderId} — ฿${Number(data.total).toLocaleString('th-TH')} (${payLabel})`;

            toast.success(msg, {
                duration: 5000,
                icon: '🛒',
                style: { maxWidth: 400 },
            });

            playSoundIfEnabled();

            addNotification({
                id: Date.now(),
                type: 'new_order',
                title: '📦 ออเดอร์ใหม่เข้ามา',
                message: msg,
                time: new Date(),
                data,
                read: false,
            });
        });

        socket.on('order_status_changed', (data) => {
            const prev = STATUS_LABELS[data.previousStatus] || data.previousStatus;
            const curr = STATUS_LABELS[data.status] || data.status;
            const msg = `ออเดอร์ #${data.orderNo?.slice(-8) || data.orderId}: ${prev} → ${curr}`;

            toast(msg, {
                duration: 4000,
                icon: '🔄',
            });

            playSoundIfEnabled();

            addNotification({
                id: Date.now(),
                type: 'order_status_changed',
                title: '🔄 สถานะออเดอร์เปลี่ยน',
                message: msg,
                time: new Date(),
                data,
                read: false,
            });
        });

        socket.on('low_stock_alert', (data) => {
            const msg = `${data.name} เหลือสต็อกเพียง ${data.stock} ตัว`;

            toast(msg, {
                duration: 6000,
                icon: '⚠️',
                style: { background: '#451a03', color: '#fbbf24', border: '1px solid #92400e' },
            });

            playSoundIfEnabled();

            addNotification({
                id: Date.now(),
                type: 'low_stock_alert',
                title: '⚠️ สต็อกใกล้หมด',
                message: msg,
                time: new Date(),
                data,
                read: false,
            });
        });

        socket.on('sales_target_reached', (data) => {
            const msg = `ฉลอง! ยอดขายวันนี้ถึงเป้า ฿${Number(data.target).toLocaleString('th-TH')} แล้ว (ปัจจุบัน ฿${Number(data.total).toLocaleString('th-TH')})`;

            toast.success(msg, {
                duration: 10000,
                icon: '🎉',
                style: { background: '#064e3b', color: '#6ee7b7', border: '1px solid #059669' },
            });

            playSoundIfEnabled();

            addNotification({
                id: Date.now(),
                type: 'sales_target_reached',
                title: '🎉 ยอดขายทะลุเป้า!',
                message: msg,
                time: new Date(),
                data,
                read: false,
            });
        });

        return () => {
            socket.disconnect();
        };
    }, [addNotification]);

    function markAllRead() {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
    }

    function clearAll() {
        setNotifications([]);
        setUnreadCount(0);
    }

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, markAllRead, clearAll }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const ctx = useContext(NotificationContext);
    if (!ctx) throw new Error('useNotifications must be inside NotificationProvider');
    return ctx;
}
