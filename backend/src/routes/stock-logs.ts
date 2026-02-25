import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();

// GET /api/stock-logs?snakeId=1
router.get('/', async (req: Request, res: Response) => {
    const prisma: PrismaClient = (req as any).prisma;
    const { snakeId } = req.query;
    try {
        const logs = await prisma.stockLog.findMany({
            where: snakeId ? { snakeId: Number(snakeId) } : undefined,
            include: { snake: { select: { id: true, name: true } } },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
        return res.json(logs);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
});

// POST /api/stock-logs  (manual adjustment)
router.post('/', async (req: Request, res: Response) => {
    const prisma: PrismaClient = (req as any).prisma;
    const { snakeId, change, reason, note } = req.body;

    if (!snakeId || change === undefined) {
        return res.status(400).json({ error: 'กรุณาระบุ snakeId และ change' });
    }

    try {
        const snake = await prisma.snake.findUnique({ where: { id: Number(snakeId) } });
        if (!snake) return res.status(404).json({ error: 'ไม่พบงู' });

        const newStock = snake.stock + Number(change);
        if (newStock < 0) return res.status(400).json({ error: 'สต็อกจะติดลบ ไม่สามารถปรับได้' });

        const [log] = await prisma.$transaction([
            prisma.stockLog.create({
                data: { snakeId: Number(snakeId), change: Number(change), reason: reason || 'adjustment', note },
                include: { snake: { select: { id: true, name: true } } },
            }),
            prisma.snake.update({
                where: { id: Number(snakeId) },
                data: { stock: newStock },
            }),
        ]);

        return res.status(201).json(log);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
});

export default router;
