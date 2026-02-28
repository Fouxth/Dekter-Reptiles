import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin } from '../middleware/auth';
import { getIO } from '../socket';

const router = Router();

// Get all system settings as a flat object
router.get('/', async (req, res) => {
    try {
        const prisma = (req as any).prisma;
        console.log('--- FETCHING SETTINGS ---');
        const settings = await prisma.systemSetting.findMany();
        console.log(`Found ${settings.length} settings in DB`);

        const settingsObject = settings.reduce((acc: any, item: any) => {
            acc[item.key] = item.value;
            return acc;
        }, {});

        console.log('Settings Object:', JSON.stringify(settingsObject, null, 2));
        res.json(settingsObject);
    } catch (error) {
        console.error('Failed to fetch settings:', error);
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
                (req as any).prisma.systemSetting.upsert({
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
            (req as any).prisma.user.findMany(),
            (req as any).prisma.category.findMany(),
            (req as any).prisma.snake.findMany(),
            (req as any).prisma.customer.findMany(),
            (req as any).prisma.order.findMany(),
            (req as any).prisma.orderItem.findMany(),
            (req as any).prisma.stockLog.findMany(),
            (req as any).prisma.healthRecord.findMany(),
            (req as any).prisma.feedingLog.findMany(),
            (req as any).prisma.breedingRecord.findMany(),
            (req as any).prisma.incubationRecord.findMany(),
            (req as any).prisma.systemSetting.findMany(),
            (req as any).prisma.expense.findMany(),
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
        const { targets } = req.body; // Array of strings: 'orders', 'inventory', 'customers', 'expenses', 'records'
        const prisma = (req as any).prisma;

        const deleteOps: any[] = [];

        if (!targets || targets.length === 0 || targets.includes('all')) {
            // Default: Full reset (excluding users and settings)
            deleteOps.push(
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
            );
        } else {
            if (targets.includes('orders')) {
                deleteOps.push(prisma.orderItem.deleteMany(), prisma.order.deleteMany());
            }
            if (targets.includes('inventory')) {
                deleteOps.push(prisma.snake.deleteMany(), prisma.category.deleteMany());
            }
            if (targets.includes('customers')) {
                deleteOps.push(prisma.customer.deleteMany());
            }
            if (targets.includes('expenses')) {
                deleteOps.push(prisma.expense.deleteMany());
            }
            if (targets.includes('records')) {
                deleteOps.push(
                    prisma.stockLog.deleteMany(),
                    prisma.healthRecord.deleteMany(),
                    prisma.feedingLog.deleteMany(),
                    prisma.incubationRecord.deleteMany(),
                    prisma.breedingRecord.deleteMany(),
                );
            }
        }

        if (deleteOps.length > 0) {
            await prisma.$transaction(deleteOps);
        }

        res.json({ message: 'Selected data reset successfully.' });
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
        const setting = await (req as any).prisma.systemSetting.upsert({
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
