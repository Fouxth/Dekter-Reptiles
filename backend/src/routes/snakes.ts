import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { snakeUpload } from '../middleware/snakeUpload';
import { getIO } from '../socket';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// Get all snakes
router.get('/', async (req: Request, res: Response) => {
    try {
        const prisma: PrismaClient = (req as any).prisma;
        const { categoryId, search, forSale } = req.query;

        const snakes = await prisma.snake.findMany({
            where: {
                ...(categoryId && { categoryId: Number(categoryId) }),
                ...(forSale !== undefined && { forSale: forSale === 'true' }),
                ...(search && {
                    OR: [
                        { name: { contains: String(search), mode: 'insensitive' } },
                        { description: { contains: String(search), mode: 'insensitive' } },
                        { code: { contains: String(search), mode: 'insensitive' } },
                        { morph: { contains: String(search), mode: 'insensitive' } },
                        { species: { contains: String(search), mode: 'insensitive' } },
                    ],
                }),
            },
            include: { category: true },
            orderBy: { createdAt: 'desc' },
        });

        res.json(snakes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch snakes' });
    }
});

// Get single snake
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const prisma: PrismaClient = (req as any).prisma;
        const snake = await prisma.snake.findUnique({
            where: { id: Number(req.params.id) },
            include: { category: true },
        });

        if (!snake) {
            return res.status(404).json({ error: 'Snake not found' });
        }

        res.json(snake);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch snake' });
    }
});

// Create snake
router.post('/', authenticate, requireAdmin, async (req: Request, res: Response) => {
    try {
        const prisma: PrismaClient = (req as any).prisma;
        const { name, description, price, cost, stock, adminImage, customerImage, color, dateOfBirth, genetics, gender, categoryId, code, species, morph, year, feedSize, forSale } = req.body;

        // Validation - map frontend field names to backend
        const birthDate = dateOfBirth; // Map birthDate to dateOfBirth
        const sex = gender; // Map sex to gender

        // Check required fields
        if (!name || !price) {
            return res.status(400).json({ 
                error: 'Missing required fields: name, price' 
            });
        }

        const snake = await prisma.$transaction(async (tx) => {
            const newSnake = await tx.snake.create({
                data: {
                    name,
                    description,
                    price: Number(price),
                    cost: cost !== undefined ? Number(cost) : undefined,
                    stock: Number(stock) || 0,
                    adminImage,
                    customerImage,
                    color,
                    genetics,
                    dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
                    gender,
                    categoryId: Number(categoryId),
                    code: code || undefined,
                    species,
                    morph,
                    year,
                    feedSize,
                    forSale: forSale === true || forSale === 'true' ? true : false,
                },
                include: { category: true },
            });

            if (newSnake.stock > 0) {
                await tx.stockLog.create({
                    data: {
                        snakeId: newSnake.id,
                        change: newSnake.stock,
                        reason: 'initial',
                        note: 'สต็อกเริ่มต้นจากการเพิ่มสินค้า',
                    },
                });
            }

            return newSnake;
        });

        res.status(201).json(snake);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create snake' });
    }
});

// Bulk create snakes
router.post('/bulk', authenticate, requireAdmin, async (req: Request, res: Response) => {
    try {
        const prisma: PrismaClient = (req as any).prisma;
        const { snakes } = req.body;

        if (!Array.isArray(snakes)) {
            return res.status(400).json({ error: 'snakes must be an array' });
        }

        const createdSnakes = [];
        await prisma.$transaction(async (tx) => {
            for (const s of snakes) {
                const snake = await tx.snake.create({
                    data: {
                        name: s.name,
                        description: s.description,
                        price: Number(s.price),
                        cost: s.cost !== undefined ? Number(s.cost) : undefined,
                        stock: Number(s.stock) || 0,
                        adminImage: s.adminImage,
                        customerImage: s.customerImage,
                        color: s.color,
                        genetics: s.genetics,
                        dateOfBirth: s.dateOfBirth ? new Date(s.dateOfBirth) : undefined,
                        gender: s.gender || 'male',
                        categoryId: Number(s.categoryId),
                        code: s.code || undefined,
                        species: s.species,
                        morph: s.morph,
                        year: s.year,
                        feedSize: s.feedSize,
                        forSale: s.forSale === true || s.forSale === 'true' ? true : false,
                    },
                    include: { category: true },
                });

                if (snake.stock > 0) {
                    await tx.stockLog.create({
                        data: {
                            snakeId: snake.id,
                            change: snake.stock,
                            reason: 'initial',
                            note: 'สต็อกเริ่มต้นจากการเพิ่มสินค้า (แบบกลุ่ม)',
                        },
                    });
                }
                createdSnakes.push(snake);
            }
        });

        res.status(201).json(createdSnakes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to bulk create snakes' });
    }
});

// Update snake
router.put('/:id', authenticate, requireAdmin, async (req: Request, res: Response) => {
    try {
        const prisma: PrismaClient = (req as any).prisma;
        const { name, description, price, cost, stock, adminImage, customerImage, color, dateOfBirth, genetics, gender, categoryId, code, species, morph, year, feedSize, forSale } = req.body;

        // Validation - map frontend field names to backend
        const birthDate = dateOfBirth; // Map birthDate to dateOfBirth
        const sex = gender; // Map sex to gender

        // Check required fields
        if (!name || !price) {
            return res.status(400).json({ 
                error: 'Missing required fields: name, price' 
            });
        }

        const snake = await prisma.snake.update({
            where: { id: Number(req.params.id) },
            data: {
                name,
                description,
                price: price !== undefined ? Number(price) : undefined,
                cost: cost !== undefined ? Number(cost) : undefined,
                stock: stock !== undefined ? Number(stock) : undefined,
                adminImage,
                customerImage,
                color,
                genetics,
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
                gender,
                categoryId: categoryId !== undefined ? Number(categoryId) : undefined,
                code: code !== undefined ? (code || null) : undefined,
                species,
                morph,
                year,
                feedSize,
                forSale: forSale !== undefined ? (forSale === true || forSale === 'true') : undefined,
            },
            include: { category: true },
        });

        // Emit low stock alert if applicable and save to DB
        if (snake.stock !== undefined && snake.stock <= 2) {
            try {
                const settings = await prisma.systemSetting.findUnique({
                    where: { key: 'notify_low_stock' }
                });
                if (settings?.value === 'true') {
                    const stockMsg = `${snake.name} เหลือสต็อกเพียง ${snake.stock} ตัว`;

                    await prisma.notification.create({
                        data: {
                            type: 'low_stock',
                            title: '⚠️ สต็อกต่ำ',
                            message: stockMsg,
                            link: `/inventory?id=${snake.id}`
                        }
                    });

                    getIO().emit('low_stock_alert', {
                        snakeId: snake.id,
                        name: snake.name,
                        stock: snake.stock,
                    });
                }
            } catch (_) { }
        }

        res.json(snake);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update snake' });
    }
});

// Upload snake image
router.post('/upload', authenticate, requireAdmin, ...snakeUpload.single('image'), async (req: Request, res: Response) => {
    try {
        const type = req.query.type === 'admin' ? 'admin' : 'customer';
        if (!req.file) {
            return res.status(400).json({ error: 'Please upload an image' });
        }

        const imageUrl = `/uploads/snakes/${type}/${req.file.filename}`;
        res.json({ url: imageUrl });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to upload image' });
    }
});

// Delete snake
router.delete('/:id', authenticate, requireAdmin, async (req: Request, res: Response) => {
    try {
        const prisma: PrismaClient = (req as any).prisma;
        const id = Number(req.params.id);

        // First check if the snake has ever been sold (has an OrderItem history)
        const orderItemCount = await prisma.orderItem.count({
            where: { snakeId: id }
        });

        if (orderItemCount > 0) {
            return res.status(400).json({
                error: 'ไม่สามารถลบสินค้าที่มีประวัติการขายได้ (ระบบต้องเก็บไว้เป็นหลักฐานการสั่งซื้อ) กรุณาแก้ไขโดยเปลี่ยนสต็อกเป็น 0 แทน'
            });
        }

        // Run deletion of related records in a transaction to safely handle foreign keys
        await prisma.$transaction(async (tx) => {
            await tx.stockLog.deleteMany({ where: { snakeId: id } });
            await tx.healthRecord.deleteMany({ where: { snakeId: id } });
            await tx.feedingLog.deleteMany({ where: { snakeId: id } });

            await tx.incubationRecord.deleteMany({ where: { OR: [{ femaleId: id }, { maleId: id }] } });
            await tx.breedingRecord.deleteMany({ where: { OR: [{ femaleId: id }, { maleId: id }] } });

            await tx.snake.delete({
                where: { id },
            });
        });

        res.json({ message: 'Snake deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete snake' });
    }
});

export default router;
