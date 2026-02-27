import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// GET /api/expenses?year=2024&month=2
router.get('/', async (req: Request, res: Response) => {
    const prisma: PrismaClient = (req as any).prisma;
    const { year, month } = req.query;

    try {
        let where: any = {};

        if (year && month) {
            const startDate = new Date(Number(year), Number(month) - 1, 1);
            const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59, 999);
            where.date = {
                gte: startDate,
                lte: endDate,
            };
        }

        const expenses = await prisma.expense.findMany({
            where,
            include: { user: { select: { id: true, name: true } } },
            orderBy: { date: 'desc' },
        });
        return res.json(expenses);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
});

// POST /api/expenses
router.post('/', async (req: Request, res: Response) => {
    const prisma: PrismaClient = (req as any).prisma;
    const { amount, description, category, date, userId } = req.body;

    if (!amount || !description || !category) {
        return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }

    try {
        const expense = await prisma.expense.create({
            data: {
                amount: Number(amount),
                description,
                category,
                date: date ? new Date(date) : new Date(),
                userId: userId ? Number(userId) : undefined,
            },
        });
        return res.status(201).json(expense);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
});

// PUT /api/expenses/:id
router.put('/:id', async (req: Request, res: Response) => {
    const prisma: PrismaClient = (req as any).prisma;
    const { amount, description, category, date, userId } = req.body;

    try {
        const expense = await prisma.expense.update({
            where: { id: Number(req.params.id) },
            data: {
                amount: amount !== undefined ? Number(amount) : undefined,
                description,
                category,
                date: date ? new Date(date) : undefined,
                userId: userId ? Number(userId) : undefined,
            },
        });
        return res.json(expense);
    } catch (err: any) {
        if (err.code === 'P2025') return res.status(404).json({ error: 'ไม่พบข้อมูล' });
        console.error(err);
        return res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
});

// DELETE /api/expenses/:id
router.delete('/:id', async (req: Request, res: Response) => {
    const prisma: PrismaClient = (req as any).prisma;
    try {
        await prisma.expense.delete({ where: { id: Number(req.params.id) } });
        return res.json({ message: 'ลบสำเร็จ' });
    } catch (err: any) {
        if (err.code === 'P2025') return res.status(404).json({ error: 'ไม่พบข้อมูล' });
        console.error(err);
        return res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
});

export default router;
