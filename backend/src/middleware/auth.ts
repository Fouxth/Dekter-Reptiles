import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'snake-pos-secret-key';

export interface AuthRequest extends Request {
    user?: { id: number; email: string; role: string };
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'ไม่มี token' });

    const token = authHeader.split(' ')[1];
    try {
        const payload = jwt.verify(token, JWT_SECRET) as any;
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
