import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET || 'snake-pos-secret-key';

export interface AuthRequest extends Request {
    user?: { id: number; email: string; role: string };
}

export interface DecodedToken {
    id: number;
    email?: string;
    role?: string;
    type?: string;
    iat?: number;
    exp?: number;
}

export function extractBearerToken(authHeader?: string) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    return authHeader.split(' ')[1] || null;
}

export function verifyToken(token: string): DecodedToken {
    return jwt.verify(token, JWT_SECRET) as DecodedToken;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
    const token = extractBearerToken(req.headers.authorization);
    if (!token) return res.status(401).json({ error: 'ไม่มี token' });
    try {
        const payload = verifyToken(token);
        if (!payload?.id || payload.type === 'customer' || !payload.role) {
            return res.status(401).json({ error: 'token ไม่ถูกต้องหรือหมดอายุ' });
        }
        req.user = { id: payload.id, email: payload.email, role: payload.role };
        next();
    } catch {
        return res.status(401).json({ error: 'token ไม่ถูกต้องหรือหมดอายุ' });
    }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'สิทธิ์ไม่เพียงพอ (admin เท่านั้น)' });
    }
    next();
}
