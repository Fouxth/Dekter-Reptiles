import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// GET /api/incubation-records
router.get('/', async (req: Request, res: Response) => {
    const prisma: PrismaClient = (req as any).prisma;
    const { breedingId } = req.query;
    try {
        const records = await prisma.incubationRecord.findMany({
            where: breedingId ? { breedingId: Number(breedingId) } : undefined,
            include: {
                female: { select: { id: true, name: true, code: true, morph: true } },
                male: { select: { id: true, name: true, code: true, morph: true } },
                breeding: { select: { id: true, pairedDate: true, clutchDate: true, eggCount: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        return res.json(records);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
});

// POST /api/incubation-records
router.post('/', async (req: Request, res: Response) => {
    const prisma: PrismaClient = (req as any).prisma;
    const {
        breedingId, femaleId, maleId,
        incubationStart, pippingDate, hatchDate,
        temperature, actualHatched, deadCount, notes
    } = req.body;

    if (!femaleId || !maleId) {
        return res.status(400).json({ error: 'กรุณาระบุ femaleId และ maleId' });
    }
    try {
        const record = await prisma.incubationRecord.create({
            data: {
                breedingId: breedingId ? Number(breedingId) : undefined,
                femaleId: Number(femaleId),
                maleId: Number(maleId),
                incubationStart: incubationStart ? new Date(incubationStart) : undefined,
                pippingDate: pippingDate ? new Date(pippingDate) : undefined,
                hatchDate: hatchDate ? new Date(hatchDate) : undefined,
                temperature: temperature ? Number(temperature) : undefined,
                actualHatched: actualHatched ? Number(actualHatched) : undefined,
                deadCount: deadCount ? Number(deadCount) : undefined,
                notes,
            },
            include: {
                female: { select: { id: true, name: true, code: true, morph: true } },
                male: { select: { id: true, name: true, code: true, morph: true } },
            },
        });
        return res.status(201).json(record);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
});

// PUT /api/incubation-records/:id
router.put('/:id', async (req: Request, res: Response) => {
    const prisma: PrismaClient = (req as any).prisma;
    const {
        incubationStart, pippingDate, hatchDate,
        temperature, actualHatched, deadCount, notes
    } = req.body;
    try {
        const record = await prisma.incubationRecord.update({
            where: { id: Number(req.params.id) },
            data: {
                incubationStart: incubationStart ? new Date(incubationStart) : incubationStart === null ? null : undefined,
                pippingDate: pippingDate ? new Date(pippingDate) : pippingDate === null ? null : undefined,
                hatchDate: hatchDate ? new Date(hatchDate) : hatchDate === null ? null : undefined,
                temperature: temperature !== undefined ? (temperature === null ? null : Number(temperature)) : undefined,
                actualHatched: actualHatched !== undefined ? (actualHatched === null ? null : Number(actualHatched)) : undefined,
                deadCount: deadCount !== undefined ? (deadCount === null ? null : Number(deadCount)) : undefined,
                notes,
            },
            include: {
                female: { select: { id: true, name: true, code: true, morph: true } },
                male: { select: { id: true, name: true, code: true, morph: true } },
            },
        });
        return res.json(record);
    } catch (err: any) {
        if (err.code === 'P2025') return res.status(404).json({ error: 'ไม่พบข้อมูล' });
        console.error(err);
        return res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
});

// DELETE /api/incubation-records/:id
router.delete('/:id', async (req: Request, res: Response) => {
    const prisma: PrismaClient = (req as any).prisma;
    try {
        await prisma.incubationRecord.delete({ where: { id: Number(req.params.id) } });
        return res.json({ message: 'ลบสำเร็จ' });
    } catch (err: any) {
        if (err.code === 'P2025') return res.status(404).json({ error: 'ไม่พบข้อมูล' });
        console.error(err);
        return res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
});

export default router;
