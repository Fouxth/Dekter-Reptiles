import { useEffect, useRef } from 'react';
import { Bell, X, Trash2, CheckCheck, ShoppingCart, RefreshCw, AlertTriangle } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

function timeAgo(date) {
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (diff < 60) return 'เมื่อกี้';
    if (diff < 3600) return `${Math.floor(diff / 60)} นาทีที่แล้ว`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ชั่วโมงที่แล้ว`;
    return `${Math.floor(diff / 86400)} วันที่แล้ว`;
}

const TYPE_ICON = {
    new_order: ShoppingCart,
    order_status_changed: RefreshCw,
    low_stock_alert: AlertTriangle,
};

const TYPE_COLOR = {
    new_order: { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.2)', icon: '#10b981' },
    order_status_changed: { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.2)', icon: '#3b82f6' },
    low_stock_alert: { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.2)', icon: '#f59e0b' },
};

export default function NotificationPanel({ open, onClose }) {
    const { notifications, unreadCount, markAllRead, clearAll } = useNotifications();
    const panelRef = useRef(null);

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        function handleClick(e) {
            if (panelRef.current && !panelRef.current.contains(e.target)) {
                onClose();
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [open, onClose]);

    // Mark all read on panel open
    useEffect(() => {
        if (open && unreadCount > 0) {
            markAllRead();
        }
    }, [open]);

    return (
        <>
            {/* Backdrop */}
            <div
                style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.4)',
                    zIndex: 998,
                    opacity: open ? 1 : 0,
                    pointerEvents: open ? 'auto' : 'none',
                    transition: 'opacity 0.25s ease',
                    backdropFilter: 'blur(2px)',
                }}
                onClick={onClose}
            />

            {/* Panel */}
            <div
                ref={panelRef}
                style={{
                    position: 'fixed',
                    top: 0,
                    right: 0,
                    height: '100vh',
                    width: '360px',
                    maxWidth: '90vw',
                    background: '#0f172a',
                    borderLeft: '1px solid rgba(255,255,255,0.08)',
                    zIndex: 999,
                    display: 'flex',
                    flexDirection: 'column',
                    transform: open ? 'translateX(0)' : 'translateX(100%)',
                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '-8px 0 40px rgba(0,0,0,0.5)',
                }}
            >
                {/* Header */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1.25rem 1.25rem 1rem',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    background: 'rgba(255,255,255,0.02)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: 10,
                            background: 'rgba(16,185,129,0.12)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Bell size={18} color="#10b981" />
                        </div>
                        <div>
                            <h2 style={{ color: '#f8fafc', fontWeight: 700, fontSize: '1rem', margin: 0 }}>การแจ้งเตือน</h2>
                            <p style={{ color: '#475569', fontSize: '0.7rem', margin: 0 }}>
                                {notifications.length === 0 ? 'ยังไม่มีการแจ้งเตือน' : `${notifications.length} รายการ`}
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                        {notifications.length > 0 && (
                            <button
                                onClick={clearAll}
                                title="ล้างทั้งหมด"
                                style={{
                                    width: 32, height: 32, borderRadius: 8,
                                    background: 'rgba(239,68,68,0.08)',
                                    border: '1px solid rgba(239,68,68,0.15)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', color: '#ef4444', transition: 'background 0.2s',
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.18)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                            >
                                <Trash2 size={14} />
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            style={{
                                width: 32, height: 32, borderRadius: 8,
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', color: '#94a3b8', transition: 'background 0.2s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* Notification List */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem' }}>
                    {notifications.length === 0 ? (
                        <div style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            justifyContent: 'center', height: '100%', gap: '0.75rem', padding: '2rem',
                        }}>
                            <div style={{
                                width: 64, height: 64, borderRadius: '50%',
                                background: 'rgba(255,255,255,0.04)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <Bell size={28} color="#475569" />
                            </div>
                            <p style={{ color: '#475569', fontSize: '0.875rem', textAlign: 'center', margin: 0 }}>
                                ยังไม่มีการแจ้งเตือน<br />
                                <span style={{ fontSize: '0.75rem', color: '#334155' }}>
                                    เมื่อมีออเดอร์ใหม่หรือการเปลี่ยนแปลง<br />จะแสดงที่นี่
                                </span>
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {notifications.map((notif) => {
                                const colors = TYPE_COLOR[notif.type] || TYPE_COLOR.new_order;
                                const IconComp = TYPE_ICON[notif.type] || Bell;
                                return (
                                    <div
                                        key={notif.id}
                                        style={{
                                            padding: '0.875rem',
                                            borderRadius: 12,
                                            background: notif.read ? 'rgba(255,255,255,0.02)' : colors.bg,
                                            border: `1px solid ${notif.read ? 'rgba(255,255,255,0.05)' : colors.border}`,
                                            transition: 'background 0.2s',
                                        }}
                                    >
                                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                            <div style={{
                                                width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                                                background: `${colors.icon}22`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}>
                                                <IconComp size={15} color={colors.icon} />
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p style={{
                                                    fontSize: '0.78rem', fontWeight: 600,
                                                    color: '#f1f5f9', margin: '0 0 0.2rem',
                                                }}>
                                                    {notif.title}
                                                </p>
                                                <p style={{
                                                    fontSize: '0.72rem', color: '#94a3b8',
                                                    margin: 0, lineHeight: 1.5,
                                                }}>
                                                    {notif.message}
                                                </p>
                                                <p style={{ fontSize: '0.65rem', color: '#475569', margin: '0.3rem 0 0' }}>
                                                    {timeAgo(notif.time)}
                                                </p>
                                            </div>
                                            {!notif.read && (
                                                <div style={{
                                                    width: 8, height: 8, borderRadius: '50%',
                                                    background: colors.icon, flexShrink: 0, marginTop: 4,
                                                }} />
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                    <div style={{
                        padding: '0.75rem 1rem',
                        borderTop: '1px solid rgba(255,255,255,0.06)',
                        background: 'rgba(255,255,255,0.01)',
                    }}>
                        <button
                            onClick={markAllRead}
                            style={{
                                width: '100%', padding: '0.6rem',
                                borderRadius: 8, background: 'rgba(16,185,129,0.08)',
                                border: '1px solid rgba(16,185,129,0.15)',
                                color: '#10b981', fontSize: '0.78rem', fontWeight: 600,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                                cursor: 'pointer', transition: 'background 0.2s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(16,185,129,0.16)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(16,185,129,0.08)'}
                        >
                            <CheckCheck size={14} /> อ่านทั้งหมดแล้ว
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}
