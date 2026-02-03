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
        const { name, description, price, stock, image, color, age, gender, categoryId } = req.body;

        const snake = await prisma.snake.create({
            data: {
                name,
                description,
                price: Number(price),
                stock: Number(stock) || 0,
                image,
                color,
                age,
                gender,
                categoryId: Number(categoryId),
            },
            include: { category: true },
        });

        res.status(201).json(snake);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create snake' });
    }
});

// Update snake
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const prisma: PrismaClient = (req as any).prisma;
        const { name, description, price, stock, image, color, age, gender, categoryId } = req.body;

        const snake = await prisma.snake.update({
            where: { id: Number(req.params.id) },
            data: {
                name,
                description,
                price: price !== undefined ? Number(price) : undefined,
                stock: stock !== undefined ? Number(stock) : undefined,
                image,
                color,
                age,
                gender,
                categoryId: categoryId !== undefined ? Number(categoryId) : undefined,
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
