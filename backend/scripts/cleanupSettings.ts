import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🧹 Cleaning up SystemSetting table...');

    // Delete keys that are just numbers (like "0", "4", etc.)
    // and keys that have "[object Object]" as value
    const settings = await prisma.systemSetting.findMany();

    let deletedCount = 0;
    for (const s of settings) {
        const isNumericKey = /^\d+$/.test(s.key);
        const isObjectValue = s.value === '[object Object]';

        if (isNumericKey || isObjectValue) {
            console.log(`🗑️ Deleting junk setting: key="${s.key}", value="${s.value}"`);
            await prisma.systemSetting.delete({
                where: { id: s.id }
            });
            deletedCount++;
        }
    }

    console.log(`✅ Cleanup complete. Deleted ${deletedCount} items.`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
