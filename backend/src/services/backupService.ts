import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
let isBackupRunning = false;

/**
 * Formats a value to its PostgreSQL SQL literal string representation.
 */
function toSqlValue(val: any): string {
    if (val === null || val === undefined) {
        return 'NULL';
    }
    if (typeof val === 'boolean') {
        return val ? 'TRUE' : 'FALSE';
    }
    if (typeof val === 'number') {
        return String(val);
    }
    if (val instanceof Date) {
        return `'${val.toISOString()}'`;
    }
    // If it's a string representation of a Date
    if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)) {
        return `'${val}'`;
    }
    if (typeof val === 'object') {
        return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
    }
    return `'${String(val).replace(/'/g, "''")}'`;
}

/**
 * Generates a self-contained, transactional PostgreSQL script from Prisma database tables.
 */
function generateSqlScript(d: any): string {
    let sql = `-- Dexter-Reptiles PostgreSQL Database Backup\n`;
    sql += `-- Generated At: ${new Date().toISOString()}\n\n`;
    
    // Disable constraints temporarily during execution for maximum safety
    sql += `BEGIN;\n`;
    sql += `SET CONSTRAINTS ALL DEFERRED;\n\n`;

    // Clear existing records in foreign-key safe order (bottom-up)
    sql += `-- Clean existing data\n`;
    const deleteTables = [
        'OrderItem', 'Order', 'StockLog', 'HealthRecord', 'FeedingLog',
        'BreedingMale', '_IncubationMales', 'IncubationRecord', 'BreedingRecord',
        'Snake', 'Category', 'Expense', 'ExpenseCategory', 'Notification',
        'Article', 'Customer', 'User', 'SystemSetting'
    ];
    for (const table of deleteTables) {
        sql += `DELETE FROM "${table}";\n`;
    }
    sql += `\n`;

    // Function to generate bulk INSERTs for a specific table
    const appendInserts = (tableName: string, rows: any[], columnMapper?: (row: any) => any) => {
        if (!rows || rows.length === 0) return;
        
        sql += `-- Table: "${tableName}" (${rows.length} rows)\n`;
        const sampleRow = columnMapper ? columnMapper(rows[0]) : rows[0];
        const columns = Object.keys(sampleRow).filter(k => sampleRow[k] !== undefined);
        const colNames = columns.map(c => `"${c}"`).join(', ');

        for (const row of rows) {
            const mappedRow = columnMapper ? columnMapper(row) : row;
            const values = columns.map(col => toSqlValue(mappedRow[col])).join(', ');
            sql += `INSERT INTO "${tableName}" (${colNames}) VALUES (${values});\n`;
        }
        sql += `\n`;
    };

    // Append inserts in parent-first order
    appendInserts('SystemSetting', d.systemSettings);
    appendInserts('User', d.users);
    appendInserts('Customer', d.customers);
    appendInserts('Article', d.articles);
    appendInserts('Notification', d.notifications);
    appendInserts('ExpenseCategory', d.expenseCategories);
    appendInserts('Expense', d.expenses);
    appendInserts('Category', d.categories);
    appendInserts('Snake', d.snakes);
    appendInserts('BreedingRecord', d.breedingRecords);
    appendInserts('BreedingMale', d.breedingMales);
    
    // For IncubationRecord, we remove the nested "males" relation for columns mapping
    appendInserts('IncubationRecord', d.incubationRecords, (row) => {
        const { males, ...directFields } = row;
        return directFields;
    });

    // Reconstruct implicit many-to-many "_IncubationMales" relation from memory
    const incubationMalesRows: any[] = [];
    if (d.incubationRecords) {
        for (const record of d.incubationRecords) {
            if (record.males) {
                for (const male of record.males) {
                    incubationMalesRows.push({ A: record.id, B: male.id });
                }
            }
        }
    }
    appendInserts('_IncubationMales', incubationMalesRows);

    appendInserts('FeedingLog', d.feedingLogs);
    appendInserts('HealthRecord', d.healthRecords);
    appendInserts('StockLog', d.stockLogs);
    appendInserts('Order', d.orders);
    appendInserts('OrderItem', d.orderItems);

    // Reset sequences for all SERIAL IDs to the maximum ID inserted
    sql += `-- Reset serial sequence counters for autoincrement keys\n`;
    const tables = [
        'SystemSetting', 'User', 'Customer', 'Article', 'Notification',
        'ExpenseCategory', 'Expense', 'Category', 'Snake', 'BreedingRecord',
        'BreedingMale', 'IncubationRecord', 'FeedingLog', 'HealthRecord',
        'StockLog', 'Order', 'OrderItem'
    ];
    for (const table of tables) {
        sql += `SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), coalesce(max(id), 1), max(id) IS NOT null) FROM "${table}";\n`;
    }

    sql += `\nCOMMIT;\n`;
    return sql;
}

/**
 * Executes a manual backup immediately and returns the created JSON backup file path.
 * It writes both [backup_name].json and [backup_name].sql in the target folder.
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

    // Format file name timestamp: backup_YYYY-MM-DD_HH-mm-ss
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timestampStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
    
    // Save JSON Backup
    const jsonFilename = `backup_${timestampStr}.json`;
    const jsonFilePath = path.join(backupDir, jsonFilename);
    fs.writeFileSync(jsonFilePath, JSON.stringify(backupData, null, 2), 'utf8');
    console.log(`💾 Database JSON backup saved successfully: ${jsonFilePath}`);

    // Generate and Save SQL Backup
    console.log('⚡ Generating transactional PostgreSQL SQL script...');
    const sqlScript = generateSqlScript(backupData.data);
    const sqlFilename = `backup_${timestampStr}.sql`;
    const sqlFilePath = path.join(backupDir, sqlFilename);
    fs.writeFileSync(sqlFilePath, sqlScript, 'utf8');
    console.log(`💾 Database SQL script backup saved successfully: ${sqlFilePath}`);

    // Manage retention (keep only latest 30 backups of each extension)
    await cleanOldBackups(backupDir);

    return jsonFilePath;
}

/**
 * Maintains a rolling 30-day retention of backup files (.json and .sql).
 */
async function cleanOldBackups(backupDir: string) {
    try {
        const files = fs.readdirSync(backupDir);
        
        // Cleanup function for a specific extension
        const cleanupExtension = (ext: '.json' | '.sql') => {
            const backupFiles = files
                .filter(f => f.startsWith('backup_') && f.endsWith(ext))
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
                    console.log(`🗑️ Deleted old ${ext} backup file: ${file.name}`);
                }
            }
        };

        cleanupExtension('.json');
        cleanupExtension('.sql');
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
