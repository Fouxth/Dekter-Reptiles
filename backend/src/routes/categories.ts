import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();

// Get all categories
router.get('/', async (req: Request, res: Response) => {
    try {
        const prisma: PrismaClient = (req as any).prisma;
        const categories = await prisma.category.findMany({
            include: {
                _count: { select: { snakes: true } },
            },
            orderBy: { name: 'asc' },
        });

        res.json(categories);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

// Get single category
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const prisma: PrismaClient = (req as any).prisma;
        const category = await prisma.category.findUnique({
            where: { id: Number(req.params.id) },
            include: { snakes: true },
        });

        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        res.json(category);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch category' });
    }
});

// Create category
router.post('/', async (req: Request, res: Response) => {
    try {
        const prisma: PrismaClient = (req as any).prisma;
        const { name, description, image } = req.body;

        const category = await prisma.category.create({
            data: { name, description, image },
        });

        res.status(201).json(category);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create category' });
    }
});

// Update category
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const prisma: PrismaClient = (req as any).prisma;
        const { name, description, image } = req.body;

        const category = await prisma.category.update({
            where: { id: Number(req.params.id) },
            data: { name, description, image },
        });

        res.json(category);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update category' });
    }
});

// Delete category
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const prisma: PrismaClient = (req as any).prisma;

        // Check if category has snakes
        const category = await prisma.category.findUnique({
            where: { id: Number(req.params.id) },
            include: { _count: { select: { snakes: true } } },
        });

        if (category && category._count.snakes > 0) {
            return res.status(400).json({ error: 'Cannot delete category with snakes. Remove snakes first.' });
        }

        await prisma.category.delete({
            where: { id: Number(req.params.id) },
        });

        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete category' });
    }
});

export default router;
