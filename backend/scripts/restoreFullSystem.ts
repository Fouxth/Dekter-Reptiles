import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import ExcelJS from 'exceljs';
import path from 'path';

const prisma = new PrismaClient();

const parseDateString = (str: string) => {
    if (!str) return null;
    const s = str.toString().trim();
    if (s.length === 6) {
        const dd = s.substring(0, 2);
        const mm = s.substring(2, 4);
        const yy = "20" + (parseInt(s.substring(4, 6)) - 43).toString();
        return new Date(`${yy}-${mm}-${dd}T00:00:00Z`);
    } else if (s.match(/^\d{4}-\d{2}-\d{2}/)) {
        return new Date(s);
    }
    return null;
};

const getCellValue = (cell: any) => {
    if (cell && cell.value !== null && typeof cell.value === 'object' && cell.value.result !== undefined) {
        return cell.value.result?.toString().trim();
    }
    return cell.value?.toString().trim();
};

const getRichText = (cell: any) => {
    if (cell.value && (cell.value as any).richText) {
        return (cell.value as any).richText.map((rt: any) => rt.text).join('').trim();
    }
    return cell.value?.toString().trim() || '';
};

async function main() {
    console.log('🚀 Starting Full System Restoration...');

    // 1. Create Admin User
    console.log('👤 Creating Admin User...');
    const passwordHash = await bcrypt.hash('admin1234', 10);
    await prisma.user.upsert({
        where: { email: 'admin@dexter.com' },
        update: {},
        create: {
            email: 'admin@dexter.com',
            passwordHash,
            name: 'Admin Dexter',
            role: 'admin',
        },
    });
    console.log('✅ Admin user created: admin@dexter.com / admin1234');

    // 2. Restore System Settings
    console.log('⚙️ Restoring System Settings...');
    const settings = [
        { key: 'store_name', value: 'Dexter Reptiles' },
        { key: 'contact_phone', value: '080-123-4567' },
        { key: 'contact_email', value: 'hello@dexter.com' },
        { key: 'contact_line', value: '@dexterreptiles' },
        { key: 'contact_address', value: '123 ถนนสุขุมวิท แขวงคลองเตย กรุงเทพมหานคร 10110' },
        { key: 'opening_hours', value: '10:00 - 20:00' },
        { key: 'bank_name', value: 'กสิกรไทย' },
        { key: 'bank_account_name', value: 'บริษัท เด็กซ์เตอร์ เรปไทล์ จำกัด' },
        { key: 'bank_account_number', value: '123-4-56789-0' },
        { key: 'shipping_fee', value: '100' },
        { key: 'free_shipping_min', value: '2000' },
        { key: 'reset_time', value: '00:00' },
        { key: 'google_map_url', value: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15501.9!2d100.5!3d13.7!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTPCsDQyJzAwLjAiTiAxMDDCsDMwJzAwLjAiRQ!5e0!3m2!1sth!2sth!4v1740676800000!5m2!1sth!2sth' },
    ];

    for (const s of settings) {
        await prisma.systemSetting.upsert({
            where: { key: s.key },
            update: { value: s.value },
            create: { key: s.key, value: s.value },
        });
    }
    console.log('✅ System settings restored.');

    // 3. Import from Excel (data_full.xlsx)
    console.log('📊 Importing Data from data_full.xlsx...');
    const filePath = path.join(__dirname, '../data_full.xlsx');
    const workbook = new ExcelJS.Workbook();

    try {
        await workbook.xlsx.readFile(filePath);
    } catch (error) {
        console.error('❌ Failed to load data_full.xlsx. Make sure it exists in the backend folder.');
        return;
    }

    // --- Category Setup ---
    const defaultCategory = await prisma.category.upsert({ where: { id: 1 }, update: { name: 'Ball Python' }, create: { id: 1, name: 'Ball Python' } });
    const otherCategory = await prisma.category.upsert({ where: { id: 2 }, update: { name: 'Other Snakes' }, create: { id: 2, name: 'Other Snakes' } });
    const equipCategory = await prisma.category.upsert({ where: { id: 3 }, update: { name: 'ของจิปาถะ' }, create: { id: 3, name: 'ของจิปาถะ' } });

    const snakeDataToInsert: any[] = [];

    // - FOR SALE -
    const saleSheet = workbook.getWorksheet('❌❌❌CODE❌ห้ามแก้ไข❌❌❌');
    if (saleSheet) {
        saleSheet.eachRow((row, rowNumber) => {
            if (rowNumber <= 2) return;
            const code = row.getCell(2).value?.toString().trim();
            if (!code) return;

            const nameMorphCell = row.getCell(4);
            const rawMorph = getRichText(nameMorphCell);
            let snakeName = '';
            let snakeMorph = rawMorph;
            const nameMatch = rawMorph.match(/^\(([^)]+)\)-(.*)$/);
            if (nameMatch) {
                snakeName = nameMatch[1].trim();
                snakeMorph = nameMatch[2].trim();
            } else {
                snakeName = rawMorph || code;
            }

            const isMale = row.getCell(5).value?.toString() === '1.0';
            const gender = isMale ? 'male' : (row.getCell(5).value?.toString() === '0.1' ? 'female' : null);

            snakeDataToInsert.push({
                code, name: snakeName, morph: snakeMorph, gender, year: row.getCell(6).value?.toString() || '',
                forSale: code.startsWith('FS'), stock: 1, price: 0, cost: 0, categoryId: defaultCategory.id
            });
        });
    }

    // - STOCK BALL -
    const stockSheet = workbook.getWorksheet('✅BALL PYTHON-อัพเดทน้ำหนัก');
    if (stockSheet) {
        stockSheet.eachRow((row, rowNumber) => {
            if (rowNumber <= 5) return;
            const code = getCellValue(row.getCell(2));
            if (!code || code === '-' || snakeDataToInsert.some(s => s.code === code)) return;
            const rawMorph = getRichText(row.getCell(3)) || '';
            let snakeName = rawMorph;
            let snakeMorph = rawMorph;
            const nameMatch = rawMorph.match(/^\(([^)]+)\)-(.*)$/);
            if (nameMatch) { snakeName = nameMatch[1].trim(); snakeMorph = nameMatch[2].trim(); }

            snakeDataToInsert.push({
                code, name: snakeName, morph: snakeMorph, gender: getCellValue(row.getCell(4)) === '1.0' ? 'male' : 'female',
                year: getCellValue(row.getCell(5)) || '',
                forSale: false, stock: 1, price: 0, cost: 0, categoryId: defaultCategory.id
            });
        });
    }

    // - OTHER -
    const otherSheet = workbook.getWorksheet('🔥OTHER-อัพเดทน้ำหนัก');
    if (otherSheet) {
        otherSheet.eachRow((row, rowNumber) => {
            if (rowNumber <= 5) return;
            const code = getCellValue(row.getCell(2));
            if (!code || code === '-' || snakeDataToInsert.some(s => s.code === code)) return;
            const rawMorph = getRichText(row.getCell(3)) || '';
            let snakeName = rawMorph;
            let snakeMorph = rawMorph;
            const nameMatch = rawMorph.match(/^\(([^)]+)\)-(.*)$/);
            if (nameMatch) { snakeName = nameMatch[1].trim(); snakeMorph = nameMatch[2].trim(); }

            snakeDataToInsert.push({
                code, name: snakeName, morph: snakeMorph, gender: getCellValue(row.getCell(4)) === '1.0' ? 'male' : 'female',
                year: getCellValue(row.getCell(5)) || '',
                forSale: false, stock: 1, price: 0, cost: 0, categoryId: otherCategory.id
            });
        });
    }

    // - EQUIPMENT -
    const equipSheet = workbook.getWorksheet('Stock');
    if (equipSheet) {
        equipSheet.eachRow((row, rowNumber) => {
            if (rowNumber <= 4) return;
            const codeVal = getCellValue(row.getCell(4));
            const name = getRichText(row.getCell(5));
            if (!name && !codeVal) return;
            if (name === 'Other' || name === 'Product') return;

            const finalCode = codeVal ? `EQUIP-${codeVal}` : `EQUIP-GEN-${rowNumber.toString().padStart(4, '0')}`;
            const cost = parseFloat(getCellValue(row.getCell(2)) || '0');
            const price = parseFloat(getCellValue(row.getCell(3)) || '0');
            const stock = parseInt(getCellValue(row.getCell(10)) || '0');

            snakeDataToInsert.push({
                code: finalCode, name: name || codeVal || 'Unnamed Item', species: 'Equipment', morph: 'Equipment',
                forSale: true, stock: isNaN(stock) ? 0 : stock, price: isNaN(price) ? 0 : price, cost: isNaN(cost) ? 0 : cost,
                categoryId: equipCategory.id
            });
        });
    }

    if (snakeDataToInsert.length > 0) {
        await prisma.snake.createMany({ data: snakeDataToInsert, skipDuplicates: true });
        console.log(`✅ Inserted ${snakeDataToInsert.length} items.`);
    }

    console.log('🎉 Restoration Complete!');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
