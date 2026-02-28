import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get recent notifications
router.get('/', authenticate, async (req, res) => {
    try {
        const notifications = await prisma.notification.findMany({
            orderBy: { createdAt: 'desc' },
            take: 50
        });
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

// Mark a specific notification as read
router.patch('/:id/read', authenticate, async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.notification.update({
            where: { id: parseInt(id) },
            data: { isRead: true }
        });
        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update notification' });
    }
});

// Mark all as read
router.patch('/read-all', authenticate, async (req, res) => {
    try {
        await prisma.notification.updateMany({
            where: { isRead: false },
            data: { isRead: true }
        });
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update notifications' });
    }
});

// Clear all notifications
router.delete('/', authenticate, async (req, res) => {
    try {
        await prisma.notification.deleteMany();
        res.json({ message: 'All notifications cleared' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to clear notifications' });
    }
});

export default router;
