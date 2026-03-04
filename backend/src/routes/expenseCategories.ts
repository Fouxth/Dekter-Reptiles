import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// GET /api/expense-categories
router.get('/', async (req: Request, res: Response) => {
    const prisma: PrismaClient = (req as any).prisma;
    try {
        const categories = await prisma.expenseCategory.findMany({
            orderBy: { name: 'asc' },
        });
        return res.json(categories);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
});

// POST /api/expense-categories
router.post('/', async (req: Request, res: Response) => {
    const prisma: PrismaClient = (req as any).prisma;
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'กรุณากรอกชื่อหมวดหมู่' });
    }

    try {
        const category = await prisma.expenseCategory.create({
            data: { name },
        });
        return res.status(201).json(category);
    } catch (err: any) {
        if (err.code === 'P2002') return res.status(400).json({ error: 'ชื่อหมวดหมู่นี้มีอยู่แล้ว' });
        console.error(err);
        return res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
});

// DELETE /api/expense-categories/:id
router.delete('/:id', async (req: Request, res: Response) => {
    const prisma: PrismaClient = (req as any).prisma;
    try {
        await prisma.expenseCategory.delete({
            where: { id: Number(req.params.id) },
        });
        return res.json({ message: 'ลบสำเร็จ' });
    } catch (err: any) {
        if (err.code === 'P2025') return res.status(404).json({ error: 'ไม่พบข้อมูล' });
        console.error(err);
        return res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
});

export default router;
