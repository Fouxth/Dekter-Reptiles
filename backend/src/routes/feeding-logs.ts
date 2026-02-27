import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// GET /api/feeding-logs?snakeId=X
router.get('/', async (req: Request, res: Response) => {
    const prisma: PrismaClient = (req as any).prisma;
    const { snakeId } = req.query;
    try {
        const logs = await prisma.feedingLog.findMany({
            where: snakeId ? { snakeId: Number(snakeId) } : undefined,
            include: {
                snake: { select: { id: true, name: true, code: true } },
            },
            orderBy: { feedDate: 'desc' },
        });
        return res.json(logs);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
});

// POST /api/feeding-logs
router.post('/', async (req: Request, res: Response) => {
    const prisma: PrismaClient = (req as any).prisma;
    const { snakeId, feedDate, feedSize, feedItem, accepted, note } = req.body;

    if (!snakeId) {
        return res.status(400).json({ error: 'กรุณาระบุ snakeId' });
    }
    try {
        const log = await prisma.feedingLog.create({
            data: {
                snakeId: Number(snakeId),
                feedDate: feedDate ? new Date(feedDate) : new Date(),
                feedSize,
                feedItem,
                accepted: accepted !== undefined ? Boolean(accepted) : true,
                note,
            },
            include: {
                snake: { select: { id: true, name: true, code: true } },
            },
        });
        return res.status(201).json(log);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
});

// DELETE /api/feeding-logs/:id
router.delete('/:id', async (req: Request, res: Response) => {
    const prisma: PrismaClient = (req as any).prisma;
    try {
        await prisma.feedingLog.delete({ where: { id: Number(req.params.id) } });
        return res.json({ message: 'ลบสำเร็จ' });
    } catch (err: any) {
        if (err.code === 'P2025') return res.status(404).json({ error: 'ไม่พบข้อมูล' });
        console.error(err);
        return res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
});

export default router;
