import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'snake-pos-secret-key';

// Customer Registration
router.post('/register', async (req: Request, res: Response) => {
    const { email, password, name, phone, address, lineId } = req.body;
    const prisma: PrismaClient = (req as any).prisma;

    if (!email || !password || !name) {
        return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน (อีเมล, รหัสผ่าน, ชื่อ)' });
    }

    try {
        const existing = await prisma.customer.findUnique({ where: { email } });
        if (existing) {
            return res.status(400).json({ error: 'อีเมลนี้ถูกใช้งานแล้ว' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const customer = await prisma.customer.create({
            data: {
                email,
                passwordHash,
                name,
                phone,
                address,
                lineId,
            },
        });

        const token = jwt.sign(
            { id: customer.id, email: customer.email, type: 'customer' },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        return res.status(201).json({
            token,
            customer: { id: customer.id, email: customer.email, name: customer.name },
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการลงทะเบียน' });
    }
});

// Customer Login
router.post('/login', async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const prisma: PrismaClient = (req as any).prisma;

    if (!email || !password) {
        return res.status(400).json({ error: 'กรุณากรอกอีเมลและรหัสผ่าน' });
    }

    try {
        const customer = await prisma.customer.findUnique({ where: { email } });
        if (!customer || !customer.isActive || !customer.passwordHash) {
            return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
        }

        const valid = await bcrypt.compare(password, customer.passwordHash);
        if (!valid) {
            return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
        }

        const token = jwt.sign(
            { id: customer.id, email: customer.email, type: 'customer' },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        return res.json({
            token,
            customer: { id: customer.id, email: customer.email, name: customer.name },
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' });
    }
});

// Get Current Customer Profile
router.get('/me', async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'ไม่มี token' });

    const token = authHeader.split(' ')[1];
    try {
        const payload = jwt.verify(token, JWT_SECRET) as any;
        if (payload.type !== 'customer') {
            return res.status(403).json({ error: 'Access denied: Not a customer token' });
        }
        const prisma: PrismaClient = (req as any).prisma;
        const customer = await prisma.customer.findUnique({
            where: { id: payload.id },
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                address: true,
                lineId: true,
                isActive: true
            },
        });
        if (!customer) return res.status(404).json({ error: 'ไม่พบข้อมูลลูกค้า' });
        return res.json(customer);
    } catch {
        return res.status(401).json({ error: 'token ไม่ถูกต้อง' });
    }
});

// Get Customer Order History
router.get('/orders', async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'ไม่มี token' });

    const token = authHeader.split(' ')[1];
    try {
        const payload = jwt.verify(token, JWT_SECRET) as any;
        if (payload.type !== 'customer') return res.status(403).json({ error: 'Access denied' });

        const prisma: PrismaClient = (req as any).prisma;
        const orders = await prisma.order.findMany({
            where: { customerId: payload.id },
            include: {
                items: { include: { snake: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        return res.json(orders);
    } catch {
        return res.status(401).json({ error: 'token ไม่ถูกต้อง' });
    }
});

export default router;
