import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🧹 Starting final SystemSetting cleanup and unification...');

    // 1. Keys to delete (numeric keys, corrupted values, and legacy/redundant keys)
    const settings = await prisma.systemSetting.findMany();

    // Legacy keys we want to remove in favor of contact_ equivalents
    const legacyKeys = ['store_phone', 'store_email', 'store_address'];

    let deletedCount = 0;

    for (const s of settings) {
        const isNumericKey = /^\d+$/.test(s.key);
        const isObjectValue = s.value === '[object Object]';
        const isLegacyKey = legacyKeys.includes(s.key);

        if (isNumericKey || isObjectValue || isLegacyKey) {
            console.log(`🗑️ Deleting junk/legacy setting: key="${s.key}", value="${s.value}"`);
            await prisma.systemSetting.delete({
                where: { id: s.id }
            });
            deletedCount++;
        }
    }

    // 2. Ensure essential keys exist (fallback)
    const essentialKeys = [
        { key: 'store_name', value: 'Dexter Reptiles' },
        { key: 'contact_phone', value: '080-123-4567' },
        { key: 'contact_email', value: 'hello@dexter.com' },
        { key: 'contact_line', value: '@dexterball' },
        { key: 'contact_facebook', value: '' },
        { key: 'contact_address', value: '-' },
        { key: 'opening_hours', value: '10:00 - 20:00' },
        { key: 'google_map_url', value: '' }
    ];

    for (const ek of essentialKeys) {
        const exists = await prisma.systemSetting.findUnique({ where: { key: ek.key } });
        if (!exists) {
            console.log(`✨ Creating missing essential setting: ${ek.key}`);
            await prisma.systemSetting.create({
                data: { key: ek.key, value: ek.value }
            });
        }
    }

    console.log(`✅ Cleanup and Unification complete. Deleted ${deletedCount} items.`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
