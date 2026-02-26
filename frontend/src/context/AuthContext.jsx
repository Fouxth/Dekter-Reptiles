import { createContext, useContext, useState, useEffect } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) { setLoading(false); return; }
        fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.ok ? r.json() : null)
            .then(u => { setUser(u); setLoading(false); })
            .catch(() => { localStorage.removeItem('token'); setLoading(false); });
    }, []);

    async function login(email, password) {
        const res = await fetch(`${API}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'เข้าสู่ระบบไม่สำเร็จ');
        localStorage.setItem('token', data.token);
        setUser(data.user);
        return data.user;
    }

    function logout() {
        localStorage.removeItem('token');
        setUser(null);
    }

    function getToken() { return localStorage.getItem('token'); }

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, getToken }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be inside AuthProvider');
    return ctx;
}
