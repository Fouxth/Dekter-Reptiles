import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// PATCH /api/users/profile - Update current user's profile
router.patch('/profile', async (req: any, res: Response) => {
    const { name, email, password } = req.body;
    const userId = req.user.id;
    const prisma = (req as any).prisma;

    try {
        const data: any = {};
        if (name !== undefined) data.name = name;
        if (email !== undefined) data.email = email;
        if (password) data.passwordHash = await bcrypt.hash(password, 10);

        const user = await prisma.user.update({
            where: { id: userId },
            data,
            select: { id: true, email: true, name: true, role: true, isActive: true },
        });
        return res.json(user);
    } catch (err: any) {
        if (err.code === 'P2002') return res.status(400).json({ error: 'อีเมลนี้ถูกใช้แล้ว' });
        console.error(err);
        return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัปเดตโปรไฟล์' });
    }
});

router.use(requireAdmin);

// GET /api/users
router.get('/', async (req: Request, res: Response) => {
    const prisma = (req as any).prisma;
    try {
        const users = await prisma.user.findMany({
            select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
        });
        return res.json(users);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
});

// POST /api/users
router.post('/', async (req: Request, res: Response) => {
    const { email, password, name, role } = req.body;
    const prisma = (req as any).prisma;

    if (!email || !password || !name) {
        return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบ' });
    }

    try {
        const passwordHash = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { email, passwordHash, name, role: role || 'staff' },
            select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
        });
        return res.status(201).json(user);
    } catch (err: any) {
        if (err.code === 'P2002') {
            return res.status(400).json({ error: 'อีเมลนี้ถูกใช้แล้ว' });
        }
        console.error(err);
        return res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
});

// PUT /api/users/:id
router.put('/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, role, isActive, password } = req.body;
    const prisma = (req as any).prisma;

    try {
        const data: any = {};
        if (name !== undefined) data.name = name;
        if (role !== undefined) data.role = role;
        if (isActive !== undefined) data.isActive = isActive;
        if (password) data.passwordHash = await bcrypt.hash(password, 10);

        const user = await prisma.user.update({
            where: { id: Number(id) },
            data,
            select: { id: true, email: true, name: true, role: true, isActive: true },
        });
        return res.json(user);
    } catch (err: any) {
        if (err.code === 'P2025') return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
        console.error(err);
        return res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
});

// DELETE /api/users/:id
router.delete('/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const prisma = (req as any).prisma;
    try {
        await prisma.user.delete({ where: { id: Number(id) } });
        return res.json({ message: 'ลบผู้ใช้สำเร็จ' });
    } catch (err: any) {
        if (err.code === 'P2025') return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
        console.error(err);
        return res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
});

export default router;
