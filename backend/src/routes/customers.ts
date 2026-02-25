import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();

// GET /api/customers
router.get('/', async (req: Request, res: Response) => {
    const prisma: PrismaClient = (req as any).prisma;
    const { search } = req.query;
    try {
        const customers = await prisma.customer.findMany({
            where: search ? {
                OR: [
                    { name: { contains: String(search), mode: 'insensitive' } },
                    { phone: { contains: String(search), mode: 'insensitive' } },
                ],
            } : undefined,
            include: {
                _count: { select: { orders: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        return res.json(customers);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
});

// GET /api/customers/:id
router.get('/:id', async (req: Request, res: Response) => {
    const prisma: PrismaClient = (req as any).prisma;
    try {
        const customer = await prisma.customer.findUnique({
            where: { id: Number(req.params.id) },
            include: {
                orders: {
                    include: { items: { include: { snake: true } } },
                    orderBy: { createdAt: 'desc' },
                    take: 20,
                },
            },
        });
        if (!customer) return res.status(404).json({ error: 'ไม่พบลูกค้า' });
        return res.json(customer);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
});

// POST /api/customers
router.post('/', async (req: Request, res: Response) => {
    const prisma: PrismaClient = (req as any).prisma;
    const { name, phone, lineId, note } = req.body;
    if (!name) return res.status(400).json({ error: 'กรุณากรอกชื่อลูกค้า' });
    try {
        const customer = await prisma.customer.create({ data: { name, phone, lineId, note } });
        return res.status(201).json(customer);
    } catch (err: any) {
        if (err.code === 'P2002') return res.status(400).json({ error: 'เบอร์โทรนี้ถูกใช้แล้ว' });
        console.error(err);
        return res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
});

// PUT /api/customers/:id
router.put('/:id', async (req: Request, res: Response) => {
    const prisma: PrismaClient = (req as any).prisma;
    const { name, phone, lineId, note } = req.body;
    try {
        const customer = await prisma.customer.update({
            where: { id: Number(req.params.id) },
            data: { name, phone, lineId, note },
        });
        return res.json(customer);
    } catch (err: any) {
        if (err.code === 'P2025') return res.status(404).json({ error: 'ไม่พบลูกค้า' });
        console.error(err);
        return res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
});

// DELETE /api/customers/:id
router.delete('/:id', async (req: Request, res: Response) => {
    const prisma: PrismaClient = (req as any).prisma;
    try {
        await prisma.customer.delete({ where: { id: Number(req.params.id) } });
        return res.json({ message: 'ลบลูกค้าสำเร็จ' });
    } catch (err: any) {
        if (err.code === 'P2025') return res.status(404).json({ error: 'ไม่พบลูกค้า' });
        console.error(err);
        return res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
});

export default router;
