import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
let isBackupRunning = false;

/**
 * Executes a manual backup immediately and returns the created backup file path.
 */
export async function runBackup(): Promise<string> {
    const backupDirName = process.env.BACKUP_DIR || 'BackupDexter';
    const backupDir = path.resolve(process.cwd(), backupDirName);

    // Ensure the backup directory exists
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
        console.log(`📁 Created backup directory: ${backupDir}`);
    }

    console.log('📦 Gathering database records for backup...');

    // Fetch all 17 tables in parallel using Prisma
    const [
        users,
        categories,
        snakes,
        customers,
        orders,
        orderItems,
        stockLogs,
        healthRecords,
        feedingLogs,
        breedingRecords,
        breedingMales,
        incubationRecords,
        systemSettings,
        expenses,
        expenseCategories,
        notifications,
        articles
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
        prisma.breedingMale.findMany(),
        prisma.incubationRecord.findMany({ include: { males: true } }),
        prisma.systemSetting.findMany(),
        prisma.expense.findMany(),
        prisma.expenseCategory.findMany(),
        prisma.notification.findMany(),
        prisma.article.findMany()
    ]);

    const backupData = {
        version: "1.1",
        timestamp: new Date().toISOString(),
        data: {
            users,
            categories,
            snakes,
            customers,
            orders,
            orderItems,
            stockLogs,
            healthRecords,
            feedingLogs,
            breedingRecords,
            breedingMales,
            incubationRecords,
            systemSettings,
            expenses,
            expenseCategories,
            notifications,
            articles
        }
    };

    // Format file name: backup_YYYY-MM-DD_HH-mm-ss.json
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timestampStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
    const filename = `backup_${timestampStr}.json`;
    const filePath = path.join(backupDir, filename);

    // Save JSON to disk
    fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2), 'utf8');
    console.log(`💾 Database backup saved successfully: ${filePath}`);

    // Manage retention (keep only latest 30 backups)
    await cleanOldBackups(backupDir);

    return filePath;
}

/**
 * Maintains a rolling 30-day retention of backup files.
 */
async function cleanOldBackups(backupDir: string) {
    try {
        const files = fs.readdirSync(backupDir);
        const backupFiles = files
            .filter(f => f.startsWith('backup_') && f.endsWith('.json'))
            .map(f => {
                const filePath = path.join(backupDir, f);
                const stat = fs.statSync(filePath);
                return { name: f, path: filePath, mtime: stat.mtime };
            });

        // Sort by modification date (oldest first)
        backupFiles.sort((a, b) => a.mtime.getTime() - b.mtime.getTime());

        const maxRetention = 30;
        if (backupFiles.length > maxRetention) {
            const filesToDelete = backupFiles.slice(0, backupFiles.length - maxRetention);
            for (const file of filesToDelete) {
                fs.unlinkSync(file.path);
                console.log(`🗑️ Deleted old backup file: ${file.name}`);
            }
        }
    } catch (error) {
        console.error('⚠️ Failed to clean up old backups:', error);
    }
}

/**
 * Checks if today has had a backup, running one if missing.
 */
async function checkAndRunBackup() {
    if (isBackupRunning) return;

    try {
        isBackupRunning = true;
        
        // Find last backup completion date
        const lastRunSetting = await prisma.systemSetting.findUnique({
            where: { key: 'backup_last_run' }
        });

        const todayStr = new Date().toDateString(); // e.g., "Wed May 20 2026"
        const lastRunStr = lastRunSetting?.value;

        if (lastRunStr !== todayStr) {
            console.log(`📅 Today's automatic backup is missing (Last Run: ${lastRunStr || 'Never'}). Starting backup now...`);
            await runBackup();
            
            // Save today's completion state to the database
            await prisma.systemSetting.upsert({
                where: { key: 'backup_last_run' },
                update: { value: todayStr, description: 'Last automatic database backup completion date' },
                create: { key: 'backup_last_run', value: todayStr, description: 'Last automatic database backup completion date' }
            });
            console.log(`✅ Daily automatic backup completed: ${todayStr}`);
        } else {
            console.log(`ℹ️ Daily automatic backup is up to date for today (${todayStr}).`);
        }
    } catch (error) {
        console.error('❌ Daily automatic backup failed:', error);
    } finally {
        isBackupRunning = false;
    }
}

/**
 * Initializes the background hourly check scheduler.
 */
export async function initBackupScheduler() {
    console.log('⏰ [Backup Engine] Initializing silent daily backup scheduler...');
    
    // Initial folder verification
    const backupDirName = process.env.BACKUP_DIR || 'BackupDexter';
    const backupDir = path.resolve(process.cwd(), backupDirName);
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
        console.log(`📁 Created backup directory: ${backupDir}`);
    }

    // Run catch-up backup check immediately on server launch
    await checkAndRunBackup();

    // Check hourly (3,600,000 milliseconds)
    setInterval(async () => {
        await checkAndRunBackup();
    }, 60 * 60 * 1000);
}
