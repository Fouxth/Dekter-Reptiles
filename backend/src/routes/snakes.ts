import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();

// Get all snakes
router.get('/', async (req: Request, res: Response) => {
    try {
        const prisma: PrismaClient = (req as any).prisma;
        const { categoryId, search } = req.query;

        const snakes = await prisma.snake.findMany({
            where: {
                ...(categoryId && { categoryId: Number(categoryId) }),
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
router.post('/', async (req: Request, res: Response) => {
    try {
        const prisma: PrismaClient = (req as any).prisma;
        const { name, description, price, cost, stock, image, color, dateOfBirth, genetics, gender, categoryId, code, species, morph, year, feedSize, forSale } = req.body;

        const snake = await prisma.$transaction(async (tx) => {
            const newSnake = await tx.snake.create({
                data: {
                    name,
                    description,
                    price: Number(price),
                    cost: cost !== undefined ? Number(cost) : undefined,
                    stock: Number(stock) || 0,
                    image,
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
router.post('/bulk', async (req: Request, res: Response) => {
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
                        image: s.image,
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
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const prisma: PrismaClient = (req as any).prisma;
        const { name, description, price, cost, stock, image, color, dateOfBirth, genetics, gender, categoryId, code, species, morph, year, feedSize, forSale } = req.body;

        const snake = await prisma.snake.update({
            where: { id: Number(req.params.id) },
            data: {
                name,
                description,
                price: price !== undefined ? Number(price) : undefined,
                cost: cost !== undefined ? Number(cost) : undefined,
                stock: stock !== undefined ? Number(stock) : undefined,
                image,
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

        res.json(snake);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update snake' });
    }
});

// Delete snake
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const prisma: PrismaClient = (req as any).prisma;
        await prisma.snake.delete({
            where: { id: Number(req.params.id) },
        });

        res.json({ message: 'Snake deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete snake' });
    }
});

export default router;
