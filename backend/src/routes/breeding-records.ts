import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// GET /api/breeding-records
router.get('/', async (req: Request, res: Response) => {
    const prisma: PrismaClient = (req as any).prisma;
    const { snakeId } = req.query;
    try {
        const records = await prisma.breedingRecord.findMany({
            where: snakeId ? {
                OR: [{ femaleId: Number(snakeId) }, { maleId: Number(snakeId) }],
            } : undefined,
            include: {
                female: { select: { id: true, name: true, code: true, morph: true, genetics: true } },
                male: { select: { id: true, name: true, code: true, morph: true, genetics: true } },
            },
            orderBy: { pairedDate: 'desc' },
        });
        return res.json(records);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
});

// POST /api/breeding-records
router.post('/', async (req: Request, res: Response) => {
    const prisma: PrismaClient = (req as any).prisma;
    const {
        femaleId, maleId, pairedDate, lockDate, separateDate,
        daysCohabited, ovulationDate, preLayShed, clutchDate,
        eggCount, goodEggs, badEggs, offspringCount, notes
    } = req.body;

    if (!femaleId || !maleId || !pairedDate) {
        return res.status(400).json({ error: 'กรุณาระบุ femaleId, maleId และ pairedDate' });
    }
    try {
        const record = await prisma.breedingRecord.create({
            data: {
                femaleId: Number(femaleId),
                maleId: Number(maleId),
                pairedDate: new Date(pairedDate),
                lockDate: lockDate ? new Date(lockDate) : undefined,
                separateDate: separateDate ? new Date(separateDate) : undefined,
                daysCohabited: daysCohabited ? Number(daysCohabited) : undefined,
                ovulationDate: ovulationDate ? new Date(ovulationDate) : undefined,
                preLayShed: preLayShed !== undefined ? Boolean(preLayShed) : undefined,
                clutchDate: clutchDate ? new Date(clutchDate) : undefined,
                eggCount: eggCount ? Number(eggCount) : undefined,
                goodEggs: goodEggs ? Number(goodEggs) : undefined,
                badEggs: badEggs ? Number(badEggs) : undefined,
                offspringCount: offspringCount ? Number(offspringCount) : undefined,
                notes: notes || undefined,
            },
            include: {
                female: { select: { id: true, name: true, code: true, morph: true, genetics: true } },
                male: { select: { id: true, name: true, code: true, morph: true, genetics: true } },
            },
        });
        return res.status(201).json(record);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
});

// PUT /api/breeding-records/:id
router.put('/:id', async (req: Request, res: Response) => {
    const prisma: PrismaClient = (req as any).prisma;
    const {
        femaleId, maleId, pairedDate, lockDate, separateDate,
        daysCohabited, ovulationDate, preLayShed, clutchDate,
        eggCount, goodEggs, badEggs, offspringCount, notes
    } = req.body;
    try {
        const record = await prisma.breedingRecord.update({
            where: { id: Number(req.params.id) },
            data: {
                ...(femaleId !== undefined && { femaleId: Number(femaleId) }),
                ...(maleId !== undefined && { maleId: Number(maleId) }),
                ...(pairedDate && { pairedDate: new Date(pairedDate) }),
                lockDate: lockDate ? new Date(lockDate) : lockDate === null ? null : undefined,
                separateDate: separateDate ? new Date(separateDate) : separateDate === null ? null : undefined,
                daysCohabited: daysCohabited !== undefined ? (daysCohabited === null ? null : Number(daysCohabited)) : undefined,
                ovulationDate: ovulationDate ? new Date(ovulationDate) : ovulationDate === null ? null : undefined,
                preLayShed: preLayShed !== undefined ? (preLayShed === null ? null : Boolean(preLayShed)) : undefined,
                clutchDate: clutchDate ? new Date(clutchDate) : clutchDate === null ? null : undefined,
                eggCount: eggCount !== undefined ? (eggCount === null ? null : Number(eggCount)) : undefined,
                goodEggs: goodEggs !== undefined ? (goodEggs === null ? null : Number(goodEggs)) : undefined,
                badEggs: badEggs !== undefined ? (badEggs === null ? null : Number(badEggs)) : undefined,
                offspringCount: offspringCount !== undefined ? (offspringCount === null ? null : Number(offspringCount)) : undefined,
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

// DELETE /api/breeding-records/:id
router.delete('/:id', async (req: Request, res: Response) => {
    const prisma: PrismaClient = (req as any).prisma;
    try {
        await prisma.breedingRecord.delete({ where: { id: Number(req.params.id) } });
        return res.json({ message: 'ลบสำเร็จ' });
    } catch (err: any) {
        if (err.code === 'P2025') return res.status(404).json({ error: 'ไม่พบข้อมูล' });
        console.error(err);
        return res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
});

export default router;
