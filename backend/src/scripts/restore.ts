import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

// Helper to parse date strings back to Date objects during JSON parsing
function parseDates(key: string, value: any) {
    if (typeof value === 'string') {
        const isoDatePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})?$/;
        if (isoDatePattern.test(value)) {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
                return date;
            }
        }
    }
    return value;
}

// Resets PostgreSQL auto-increment sequences for a table
async function resetSequence(tableName: string) {
    try {
        await prisma.$executeRawUnsafe(
            `SELECT setval(pg_get_serial_sequence('"${tableName}"', 'id'), coalesce(max(id), 1), max(id) IS NOT null) FROM "${tableName}";`
        );
        console.log(`🔄 [Sequence] Reset sequence counter for table: "${tableName}"`);
    } catch (e: any) {
        console.warn(`⚠️ [Sequence] Warning: Could not reset sequence for table "${tableName}": ${e.message}`);
    }
}

async function main() {
    const backupFilePath = process.argv[2];

    if (!backupFilePath) {
        console.error('❌ Error: Backup file path is required.');
        console.log('\nUsage: npx tsx src/scripts/restore.ts <path-to-backup-json>');
        console.log('Example: npx tsx src/scripts/restore.ts BackupDexter/backup_2026-05-20_02-00-00.json\n');
        process.exit(1);
    }

    const resolvedPath = path.resolve(process.cwd(), backupFilePath);

    if (!fs.existsSync(resolvedPath)) {
        console.error(`❌ Error: Backup file not found at: ${resolvedPath}`);
        process.exit(1);
    }

    console.log(`📖 Loading backup file: ${backupFilePath}...`);
    let backupObj: any;
    try {
        const fileContent = fs.readFileSync(resolvedPath, 'utf8');
        backupObj = JSON.parse(fileContent, parseDates);
    } catch (error: any) {
        console.error(`❌ Error: Failed to parse backup JSON file: ${error.message}`);
        process.exit(1);
    }

    if (!backupObj.data || typeof backupObj.data !== 'object') {
        console.error('❌ Error: Invalid backup file structure (missing "data" field).');
        process.exit(1);
    }

    console.log('⚠️  WARNING: Restoring will overwrite all existing data in the database!');
    console.log('Press Ctrl+C to abort, or wait 5 seconds to proceed...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('🔥 Initiating database restoration transaction...');

    try {
        // Execute deletions in order of leaf-nodes to parents (bottom-up) to satisfy Foreign Key constraints
        console.log('🗑️  Step 1: Deleting existing records (foreign-key safe order)...');
        
        await prisma.$transaction([
            prisma.orderItem.deleteMany(),
            prisma.order.deleteMany(),
            prisma.stockLog.deleteMany(),
            prisma.healthRecord.deleteMany(),
            prisma.feedingLog.deleteMany(),
            prisma.breedingMale.deleteMany(),
            prisma.incubationRecord.deleteMany(),
            prisma.breedingRecord.deleteMany(),
            prisma.snake.deleteMany(),
            prisma.category.deleteMany(),
            prisma.expense.deleteMany(),
            prisma.expenseCategory.deleteMany(),
            prisma.notification.deleteMany(),
            prisma.article.deleteMany(),
            prisma.customer.deleteMany(),
            prisma.user.deleteMany(),
            prisma.systemSetting.deleteMany(),
        ]);
        console.log('✨ Database cleared successfully.');

        // Insert new records in order of parent-nodes to children (top-down)
        console.log('📥 Step 2: Restoring records from backup...');
        const d = backupObj.data;

        // 1. System Settings
        if (d.systemSettings?.length) {
            console.log(`- Restoring ${d.systemSettings.length} SystemSettings...`);
            await prisma.systemSetting.createMany({ data: d.systemSettings });
        }

        // 2. Users
        if (d.users?.length) {
            console.log(`- Restoring ${d.users.length} Users...`);
            await prisma.user.createMany({ data: d.users });
        }

        // 3. Customers
        if (d.customers?.length) {
            console.log(`- Restoring ${d.customers.length} Customers...`);
            await prisma.customer.createMany({ data: d.customers });
        }

        // 4. Articles
        if (d.articles?.length) {
            console.log(`- Restoring ${d.articles.length} Articles...`);
            await prisma.article.createMany({ data: d.articles });
        }

        // 5. Notifications
        if (d.notifications?.length) {
            console.log(`- Restoring ${d.notifications.length} Notifications...`);
            await prisma.notification.createMany({ data: d.notifications });
        }

        // 6. Expense Categories
        if (d.expenseCategories?.length) {
            console.log(`- Restoring ${d.expenseCategories.length} ExpenseCategories...`);
            await prisma.expenseCategory.createMany({ data: d.expenseCategories });
        }

        // 7. Expenses
        if (d.expenses?.length) {
            console.log(`- Restoring ${d.expenses.length} Expenses...`);
            await prisma.expense.createMany({ data: d.expenses });
        }

        // 8. Categories
        if (d.categories?.length) {
            console.log(`- Restoring ${d.categories.length} Categories...`);
            await prisma.category.createMany({ data: d.categories });
        }

        // 9. Snakes
        if (d.snakes?.length) {
            console.log(`- Restoring ${d.snakes.length} Snakes...`);
            await prisma.snake.createMany({ data: d.snakes });
        }

        // 10. Breeding Records
        if (d.breedingRecords?.length) {
            console.log(`- Restoring ${d.breedingRecords.length} BreedingRecords...`);
            await prisma.breedingRecord.createMany({ data: d.breedingRecords });
        }

        // 11. Breeding Males (Explicit model pairing)
        if (d.breedingMales?.length) {
            console.log(`- Restoring ${d.breedingMales.length} BreedingMale pairings...`);
            await prisma.breedingMale.createMany({ data: d.breedingMales });
        }

        // 12. Incubation Records (Implicit many-to-many "males" needs connection mapping)
        if (d.incubationRecords?.length) {
            console.log(`- Restoring ${d.incubationRecords.length} IncubationRecords with relationships...`);
            for (const record of d.incubationRecords) {
                const { males, ...directFields } = record;
                await prisma.incubationRecord.create({
                    data: {
                        ...directFields,
                        males: {
                            connect: (males || []).map((m: any) => ({ id: m.id }))
                        }
                    }
                });
            }
        }

        // 13. Feeding Logs
        if (d.feedingLogs?.length) {
            console.log(`- Restoring ${d.feedingLogs.length} FeedingLogs...`);
            await prisma.feedingLog.createMany({ data: d.feedingLogs });
        }

        // 14. Health Records
        if (d.healthRecords?.length) {
            console.log(`- Restoring ${d.healthRecords.length} HealthRecords...`);
            await prisma.healthRecord.createMany({ data: d.healthRecords });
        }

        // 15. Stock Logs
        if (d.stockLogs?.length) {
            console.log(`- Restoring ${d.stockLogs.length} StockLogs...`);
            await prisma.stockLog.createMany({ data: d.stockLogs });
        }

        // 16. Orders
        if (d.orders?.length) {
            console.log(`- Restoring ${d.orders.length} Orders...`);
            await prisma.order.createMany({ data: d.orders });
        }

        // 17. Order Items
        if (d.orderItems?.length) {
            console.log(`- Restoring ${d.orderItems.length} OrderItems...`);
            await prisma.orderItem.createMany({ data: d.orderItems });
        }

        console.log('✅ All data inserted successfully.');

        // Step 3: Reset autoincrement sequence counters in PostgreSQL
        console.log('🔄 Step 3: Resetting database auto-increment sequences...');
        const tables = [
            'SystemSetting', 'User', 'Customer', 'Article', 'Notification',
            'ExpenseCategory', 'Expense', 'Category', 'Snake', 'BreedingRecord',
            'BreedingMale', 'IncubationRecord', 'FeedingLog', 'HealthRecord',
            'StockLog', 'Order', 'OrderItem'
        ];
        for (const table of tables) {
            await resetSequence(table);
        }

        console.log('\n🎉 DATABASE RESTORE COMPLETED SUCCESSFULY! 🎉\n');

    } catch (error: any) {
        console.error('❌ Database restoration failed!');
        console.error(error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
