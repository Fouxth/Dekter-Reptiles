import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin } from '../middleware/auth';
import { snakeUpload } from '../middleware/snakeUpload';

const router = Router();

// Get all articles
router.get('/', async (req: Request, res: Response) => {
    try {
        const prisma: PrismaClient = (req as any).prisma;
        const { published, category, search } = req.query;

        const articles = await prisma.article.findMany({
            where: {
                ...(published !== undefined && { published: published === 'true' }),
                ...(category && { category: String(category) }),
                ...(search && {
                    OR: [
                        { title: { contains: String(search), mode: 'insensitive' } },
                        { content: { contains: String(search), mode: 'insensitive' } },
                    ],
                }),
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json(articles);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch articles' });
    }
});

// Get single article
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const prisma: PrismaClient = (req as any).prisma;
        const article = await prisma.article.findUnique({
            where: { id: Number(req.params.id) },
        });

        if (!article) {
            return res.status(404).json({ error: 'Article not found' });
        }

        res.json(article);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch article' });
    }
});

// Create article
router.post('/', authenticate, requireAdmin, async (req: Request, res: Response) => {
    try {
        const prisma: PrismaClient = (req as any).prisma;
        const { title, content, excerpt, image, category, author, published } = req.body;

        if (!title || !content) {
            return res.status(400).json({ error: 'Title and content are required' });
        }

        const article = await prisma.article.create({
            data: {
                title,
                content,
                excerpt,
                image,
                category,
                author,
                published: published !== undefined ? published : true,
            },
        });

        res.status(201).json(article);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create article' });
    }
});

// Update article
router.put('/:id', authenticate, requireAdmin, async (req: Request, res: Response) => {
    try {
        const prisma: PrismaClient = (req as any).prisma;
        const { title, content, excerpt, image, category, author, published } = req.body;

        const article = await prisma.article.update({
            where: { id: Number(req.params.id) },
            data: {
                title,
                content,
                excerpt,
                image,
                category,
                author,
                published,
            },
        });

        res.json(article);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update article' });
    }
});

// Delete article
router.delete('/:id', authenticate, requireAdmin, async (req: Request, res: Response) => {
    try {
        const prisma: PrismaClient = (req as any).prisma;
        await prisma.article.delete({
            where: { id: Number(req.params.id) },
        });

        res.json({ message: 'Article deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete article' });
    }
});

// Upload article image
router.post('/upload', authenticate, requireAdmin, ...snakeUpload.single('image'), async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Please upload an image' });
        }

        const imageUrl = `/uploads/articles/${req.file.filename}`;
        res.json({ url: imageUrl });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to upload image' });
    }
});

export default router;
