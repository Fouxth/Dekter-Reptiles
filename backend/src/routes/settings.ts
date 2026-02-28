import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin } from '../middleware/auth';
import { getIO } from '../socket';

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

// Bulk Update multiple settings
router.patch('/', authenticate, requireAdmin, async (req, res) => {
    const settings = req.body;
    const updates = [];

    if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
        return res.status(400).json({ error: 'Settings must be a flat object of key-value pairs.' });
    }

    try {
        for (const [key, value] of Object.entries(settings)) {
            // Ignore numeric keys which usually come from passing an array to the API
            if (/^\d+$/.test(key)) continue;

            // Ignore [object Object] values which usually come from stringifying objects incorrectly
            const stringValue = String(value);
            if (stringValue === '[object Object]') continue;

            updates.push(
                prisma.systemSetting.upsert({
                    where: { key },
                    update: { value: String(value) },
                    create: { key, value: String(value) },
                })
            );
        }
        await Promise.all(updates);

        const io = getIO();
        io.emit('settings_updated');

        res.json({ message: 'Settings updated successfully' });
    } catch (error) {
        console.error('Failed to update settings:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

// Backup: Export all database tables as JSON
router.get('/backup', authenticate, requireAdmin, async (req, res) => {
    try {
        const [
            users, categories, snakes, customers, orders,
            orderItems, stockLogs, healthRecords, feedingLogs,
            breedingRecords, incubationRecords, systemSettings, expenses
        ] = await Promise.all([
            prisma.user.findMany(),
            prisma.category.findMany(),
            prisma.snake.findMany(),
            prisma.customer.findMany(),
            prisma.order.findMany(),
            prisma.orderItem.findMany(),
            prisma.stockLog.findMany(),
            prisma.healthRecord.findMany(),
            prisma.feedingLog.findMany(),
            prisma.breedingRecord.findMany(),
            prisma.incubationRecord.findMany(),
            prisma.systemSetting.findMany(),
            prisma.expense.findMany(),
        ]);

        const backupData = {
            version: "1.0",
            timestamp: new Date().toISOString(),
            data: {
                users, categories, snakes, customers, orders,
                orderItems, stockLogs, healthRecords, feedingLogs,
                breedingRecords, incubationRecords, systemSettings, expenses
            }
        };

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=snake_pos_backup_${new Date().toISOString().split('T')[0]}.json`);
        res.json(backupData);
    } catch (error) {
        console.error('Backup failed:', error);
        res.status(500).json({ error: 'Failed to generate backup' });
    }
});

// Reset: Delete all clinical/transactional data but keep SystemSettings and Users
router.delete('/reset', authenticate, requireAdmin, async (req, res) => {
    try {
        await prisma.$transaction([
            prisma.stockLog.deleteMany(),
            prisma.healthRecord.deleteMany(),
            prisma.feedingLog.deleteMany(),
            prisma.incubationRecord.deleteMany(),
            prisma.breedingRecord.deleteMany(),
            prisma.orderItem.deleteMany(),
            prisma.order.deleteMany(),
            prisma.snake.deleteMany(),
            prisma.category.deleteMany(),
            prisma.customer.deleteMany(),
            prisma.expense.deleteMany(),
        ]);
        res.json({ message: 'Database reset successfully. Users and settings were preserved.' });
    } catch (error) {
        console.error('Reset failed:', error);
        res.status(500).json({ error: 'Failed to reset database' });
    }
});

// Update or create a single system setting
router.post('/', authenticate, requireAdmin, async (req, res) => {
    const { key, value, description } = req.body;
    if (!key) return res.status(400).json({ error: 'Key is required' });

    try {
        const setting = await prisma.systemSetting.upsert({
            where: { key },
            update: { value: String(value), description },
            create: { key, value: String(value), description },
        });

        const io = getIO();
        io.emit('settings_updated');

        res.json(setting);
    } catch (error) {
        res.status(500).json({ error: 'Failed to save setting' });
    }
});

export default router;
