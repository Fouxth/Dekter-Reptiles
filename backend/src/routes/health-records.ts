import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();

// GET /api/health-records?snakeId=X
router.get('/', async (req: Request, res: Response) => {
    const prisma: PrismaClient = (req as any).prisma;
    const { snakeId } = req.query;
    try {
        const records = await prisma.healthRecord.findMany({
            where: snakeId ? { snakeId: Number(snakeId) } : undefined,
            include: { snake: { select: { id: true, name: true } } },
            orderBy: { recordDate: 'desc' },
            take: 100,
        });
        return res.json(records);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
});

// POST /api/health-records
router.post('/', async (req: Request, res: Response) => {
    const prisma: PrismaClient = (req as any).prisma;
    const { snakeId, recordDate, weight, length, fed, feedItem, shed, note } = req.body;
    if (!snakeId) return res.status(400).json({ error: 'กรุณาระบุ snakeId' });
    try {
        const record = await prisma.healthRecord.create({
            data: {
                snakeId: Number(snakeId),
                recordDate: recordDate ? new Date(recordDate) : new Date(),
                weight: weight ? Number(weight) : undefined,
                length: length ? Number(length) : undefined,
                fed: Boolean(fed),
                feedItem: feedItem || undefined,
                shed: Boolean(shed),
                note: note || undefined,
            },
        });
        return res.status(201).json(record);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
});

// PUT /api/health-records/:id
router.put('/:id', async (req: Request, res: Response) => {
    const prisma: PrismaClient = (req as any).prisma;
    const { recordDate, weight, length, fed, feedItem, shed, note } = req.body;
    try {
        const record = await prisma.healthRecord.update({
            where: { id: Number(req.params.id) },
            data: {
                recordDate: recordDate ? new Date(recordDate) : undefined,
                weight: weight !== undefined ? Number(weight) : undefined,
                length: length !== undefined ? Number(length) : undefined,
                fed: fed !== undefined ? Boolean(fed) : undefined,
                feedItem,
                shed: shed !== undefined ? Boolean(shed) : undefined,
                note,
            },
        });
        return res.json(record);
    } catch (err: any) {
        if (err.code === 'P2025') return res.status(404).json({ error: 'ไม่พบข้อมูล' });
        console.error(err);
        return res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
});

// DELETE /api/health-records/:id
router.delete('/:id', async (req: Request, res: Response) => {
    const prisma: PrismaClient = (req as any).prisma;
    try {
        await prisma.healthRecord.delete({ where: { id: Number(req.params.id) } });
        return res.json({ message: 'ลบสำเร็จ' });
    } catch (err: any) {
        if (err.code === 'P2025') return res.status(404).json({ error: 'ไม่พบข้อมูล' });
        console.error(err);
        return res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
});

export default router;
