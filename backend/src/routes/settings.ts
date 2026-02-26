import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get all system settings
router.get('/', async (req, res) => {
    try {
        const settings = await prisma.systemSetting.findMany();
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

// Update or create multiple settings (Bulk Update)
router.patch('/', authenticate, requireAdmin, async (req, res) => {
    const settings = req.body;
    const updates = [];

    try {
        for (const [key, value] of Object.entries(settings)) {
            updates.push(
                prisma.systemSetting.upsert({
                    where: { key },
                    update: { value: String(value) },
                    create: { key, value: String(value) },
                })
            );
        }
        await Promise.all(updates);
        res.json({ message: 'Settings updated successfully' });
    } catch (error) {
        console.error('Failed to update settings:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

// Update or create a single system setting
router.post('/', authenticate, requireAdmin, async (req, res) => {
    const { key, value, description } = req.body;

    if (!key) {
        return res.status(400).json({ error: 'Key is required' });
    }

    try {
        const setting = await prisma.systemSetting.upsert({
            where: { key },
            update: { value: String(value), description },
            create: { key, value: String(value), description },
        });
        res.json(setting);
    } catch (error) {
        res.status(500).json({ error: 'Failed to save setting' });
    }
});

export default router;
