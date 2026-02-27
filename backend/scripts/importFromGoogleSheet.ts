import { PrismaClient } from '@prisma/client';
import ExcelJS from 'exceljs';
import path from 'path';

const prisma = new PrismaClient();

const parseDateString = (str: string) => {
    if (!str) return null;
    const s = str.toString().trim();
    if (s.length === 6) {
        // Example: "220169" -> 22 Jan 2026 (2569 in Thai year)
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
    console.log('⏳ Starting Extended Google Sheet Data Import...');
    const filePath = path.join(__dirname, '../data_full.xlsx');
    const workbook = new ExcelJS.Workbook();

    try {
        await workbook.xlsx.readFile(filePath);
        console.log('✅ Successfully loaded data_full.xlsx');
    } catch (error) {
        console.error('❌ Failed to load. Check file path.');
        process.exit(1);
    }

    // --- Category Setup ---
    let defaultCategory = await prisma.category.findFirst({ where: { name: 'Ball Python' } });
    if (!defaultCategory) {
        defaultCategory = await prisma.category.create({ data: { name: 'Ball Python' } });
    }
    let otherCategory = await prisma.category.findFirst({ where: { name: 'Other Snakes' } });
    if (!otherCategory) {
        otherCategory = await prisma.category.create({ data: { name: 'Other Snakes' } });
    }
    let equipCategory = await prisma.category.findFirst({ where: { name: 'ของจิปาถะ' } });
    if (!equipCategory) {
        equipCategory = await prisma.category.create({ data: { name: 'ของจิปาถะ' } });
    }

    // --- DB Clear ---
    console.log('🗑️ Clearing Database (Full Reset)...');
    try {
        await prisma.stockLog.deleteMany({});
        await prisma.healthRecord.deleteMany({});
        await prisma.feedingLog.deleteMany({});
        await prisma.orderItem.deleteMany({});
        await prisma.incubationRecord.deleteMany({});
        await prisma.breedingRecord.deleteMany({});
        await prisma.snake.deleteMany({});
        // We keep Categories and Users as they are fundamental structures
        console.log('✅ Base tables cleared.');
    } catch (err) {
        console.error('⚠️ Warning during clear:', err);
    }

    const snakeDataToInsert: any[] = [];

    // 1. FOR SALE SHEET
    const saleSheet = workbook.getWorksheet('❌❌❌CODE❌ห้ามแก้ไข❌❌❌');
    if (saleSheet) {
        saleSheet.eachRow((row, rowNumber) => {
            if (rowNumber <= 2) return;
            const codeCell = row.getCell(2);
            const speciesCell = row.getCell(3);
            const nameMorphCell = row.getCell(4);
            const sexCell = row.getCell(5);
            const yearCell = row.getCell(6);

            const code = codeCell.value?.toString().trim();
            if (!code) return;

            const forSale = code.startsWith('FS');
            const isMale = sexCell.value?.toString() === '1.0';
            const isFemale = sexCell.value?.toString() === '0.1';
            let gender: string | null = null;
            if (isMale) gender = 'male';
            if (isFemale) gender = 'female';

            let isSoldOut = false;
            if (nameMorphCell.font && nameMorphCell.font.strike) isSoldOut = true;
            else if (nameMorphCell.value && (nameMorphCell.value as any).richText) {
                isSoldOut = (nameMorphCell.value as any).richText.some((rt: any) => rt.font && rt.font.strike);
            }

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

            const speciesVal = speciesCell.value?.toString().trim() || null;

            snakeDataToInsert.push({
                code, name: snakeName, species: speciesVal, morph: snakeMorph, gender, year: yearCell.value?.toString() || '',
                forSale, stock: isSoldOut ? 0 : 1, price: 0, cost: 0, categoryId: defaultCategory.id
            });
        });
    }

    // 2. STOCK SHEET
    const stockSheet = workbook.getWorksheet('✅BALL PYTHON-อัพเดทน้ำหนัก');
    if (stockSheet) {
        stockSheet.eachRow((row, rowNumber) => {
            if (rowNumber <= 5) return;
            const code = getCellValue(row.getCell(2)); // Col B
            if (!code || code === '-' || code === '#REF!') return;
            if (snakeDataToInsert.some(s => s.code === code)) return;

            const sexVal = getCellValue(row.getCell(4)); // Col D
            const gender = sexVal === '1.0' ? 'male' : (sexVal === '0.1' ? 'female' : null);
            const rawMorph = getCellValue(row.getCell(3)) || ''; // Col C
            let snakeName = rawMorph || code;
            let snakeMorph = rawMorph;
            const nameMatch = rawMorph.match(/^\(([^)]+)\)-(.*)$/);
            if (nameMatch) { snakeName = nameMatch[1].trim(); snakeMorph = nameMatch[2].trim(); }

            snakeDataToInsert.push({
                code, name: snakeName, species: null, morph: snakeMorph, gender, year: getCellValue(row.getCell(5)) || '',
                forSale: false, stock: 1, price: 0, cost: 0, categoryId: defaultCategory.id
            });
        });
    }

    // 3. OTHER SNAKES SHEET
    const otherSheet = workbook.getWorksheet('🔥OTHER-อัพเดทน้ำหนัก');
    if (otherSheet) {
        otherSheet.eachRow((row, rowNumber) => {
            if (rowNumber <= 5) return;
            const code = getCellValue(row.getCell(2));
            if (!code || code === '-' || code === '#REF!') return;
            if (snakeDataToInsert.some(s => s.code === code)) return;

            const sexVal = getCellValue(row.getCell(4));
            const gender = sexVal === '1.0' ? 'male' : (sexVal === '0.1' ? 'female' : null);
            const rawMorph = getCellValue(row.getCell(3)) || '';
            let snakeName = rawMorph || code;
            let snakeMorph = rawMorph;
            const nameMatch = rawMorph.match(/^\(([^)]+)\)-(.*)$/);
            if (nameMatch) { snakeName = nameMatch[1].trim(); snakeMorph = nameMatch[2].trim(); }

            snakeDataToInsert.push({
                code, name: snakeName, species: null, morph: snakeMorph, gender, year: getCellValue(row.getCell(5)) || '',
                forSale: false, stock: 1, price: 0, cost: 0, categoryId: otherCategory.id
            });
        });
    }

    // 4. OLD SNAKES SHEET
    const oldSheet = workbook.getWorksheet('เก่า-อัพเดทน้ำหนัก');
    if (oldSheet) {
        oldSheet.eachRow((row, rowNumber) => {
            if (rowNumber <= 5) return;
            const name = getCellValue(row.getCell(2));
            const morph = getCellValue(row.getCell(3));
            if (!name && !morph) return;

            const sexVal = getCellValue(row.getCell(4));
            const gender = sexVal === '1.0' || sexVal === 'M' ? 'male' : (sexVal === '0.1' || sexVal === 'F' ? 'female' : null);

            snakeDataToInsert.push({
                code: `OLD-${(name || morph || rowNumber).toString().replace(/[^a-zA-Z0-9]/g, '-')}-${rowNumber}`,
                name: name || morph, species: null, morph: morph || '', gender, year: getCellValue(row.getCell(5)) || '',
                forSale: false, stock: 1, price: 0, cost: 0, categoryId: defaultCategory.id
            });
        });
    }

    // 5. EQUIPMENT STOCK SHEET
    const equipSheet = workbook.getWorksheet('Stock');
    if (equipSheet) {
        equipSheet.eachRow((row, rowNumber) => {
            if (rowNumber <= 4) return;
            const codeVal = getCellValue(row.getCell(4)); // D (Code)
            const cost = parseFloat(getCellValue(row.getCell(2)) || '0'); // B (Cost)
            const price = parseFloat(getCellValue(row.getCell(3)) || '0'); // C (Sale)
            const stockStr = getCellValue(row.getCell(10)); // J (Stock)
            const stock = parseInt(stockStr || '0');
            const name = getRichText(row.getCell(5)); // E (Other/Name)

            if (!name && !codeVal) return;

            // Generate code if missing for equipment as per user request
            const finalCode = codeVal ? `EQUIP-${codeVal}` : `EQUIP-GEN-${rowNumber.toString().padStart(4, '0')}`;

            snakeDataToInsert.push({
                code: finalCode,
                name: name || codeVal || 'Unnamed Item',
                species: 'Equipment',
                morph: 'Equipment',
                gender: null,
                year: '',
                forSale: true,
                stock: isNaN(stock) ? 0 : stock,
                price: isNaN(price) ? 0 : price,
                cost: isNaN(cost) ? 0 : cost,
                categoryId: equipCategory.id
            });
        });
    }

    // INSERT ALL SNAKES & EQUIP
    if (snakeDataToInsert.length > 0) {
        await prisma.snake.createMany({ data: snakeDataToInsert, skipDuplicates: true });
        console.log(`✅ Inserted ${snakeDataToInsert.length} items to database.`);
    }

    const allSnakes = await prisma.snake.findMany();

    // 6. UPDATE COST & PRICE
    const costSheet = workbook.getWorksheet('Cost');
    const updatePromises: any[] = [];
    if (costSheet) {
        costSheet.eachRow((row, rowNumber) => {
            if (rowNumber <= 2) return;
            const code = getCellValue(row.getCell(3)); // Code in C
            if (!code) return;
            const costStr = getCellValue(row.getCell(8)); // Cost in H
            const priceStr = getCellValue(row.getCell(9)); // Price in I
            const cost = parseFloat(costStr || '0');
            const price = parseFloat(priceStr || '0');

            const match = allSnakes.find(s => s.code === code);
            if (match && (!isNaN(cost) || !isNaN(price))) {
                // Update only if values are > 0 to not overwrite good values with 0
                if (cost > 0 || price > 0) {
                    updatePromises.push(
                        prisma.snake.update({
                            where: { id: match.id },
                            data: {
                                cost: cost > 0 ? cost : match.cost,
                                price: price > 0 ? price : match.price,
                            }
                        })
                    );
                }
            }
        });
        await Promise.all(updatePromises);
        console.log('✅ Updated Cost & Prices.');
    }

    // 7. FEEDING LOGS
    const logFeedings = async (sheetName: string, idCol: number, szCol: number) => {
        const sheet = workbook.getWorksheet(sheetName);
        if (!sheet) return;
        let count = 0;
        const feedPromises: any[] = [];
        for (let i = 5; i <= sheet.rowCount; i++) {
            const row = sheet.getRow(i);
            const code = getCellValue(row.getCell(idCol));
            const sz = getCellValue(row.getCell(szCol));
            if (code && sz) {
                const snake = allSnakes.find(s => s.code === code || s.name === code);
                if (snake) {
                    feedPromises.push(
                        prisma.feedingLog.create({
                            data: { snakeId: snake.id, feedDate: new Date(), feedSize: sz, feedItem: 'หนู', accepted: true }
                        })
                    );
                    count++;
                }
            }
        }
        await Promise.all(feedPromises);
        console.log(`✅ Inserted ${count} feeding logs from ${sheetName}`);
    };

    await logFeedings('✅BALL PYTHON ตารางให้อาหารงู.', 2, 6); // Code at Col B (2), Size at F (6)
    await logFeedings('🔥for SALE-ตารางให้อาหารงูขาย', 2, 6);
    await logFeedings('🔥OTHER-ตารางให้อาหารงู', 2, 6);

    // 8. BREEDING RECORDS
    const breedSheet = workbook.getWorksheet('ผสม');
    if (breedSheet) {
        let count = 0;
        const breedPromises: any[] = [];
        for (let i = 6; i <= breedSheet.rowCount; i++) {
            const row = breedSheet.getRow(i);
            const fName = getCellValue(row.getCell(2)); // Female
            const mName = getCellValue(row.getCell(3)); // Male
            if (!fName || !mName) continue;

            const fMatch = allSnakes.find(s => s.name === fName || s.morph === fName || s.code === fName);
            const mMatch = allSnakes.find(s => s.name === mName || s.morph === mName || s.code === mName);

            if (fMatch && mMatch) {
                const dateIn = parseDateString(getCellValue(row.getCell(4)));
                const dateLock = parseDateString(getCellValue(row.getCell(5)));
                const dateOut = parseDateString(getCellValue(row.getCell(9)));

                breedPromises.push(
                    prisma.breedingRecord.create({
                        data: {
                            femaleId: fMatch.id,
                            maleId: mMatch.id,
                            pairedDate: dateIn || new Date(),
                            lockDate: dateLock,
                            separateDate: dateOut,
                            notes: getCellValue(row.getCell(16)) || ''
                        }
                    })
                );
                count++;
            }
        }
        await Promise.all(breedPromises);
        console.log(`✅ Inserted ${count} breeding records.`);
    }

    // 9. INCUBATION RECORDS
    const incubationSheet = workbook.getWorksheet('ฟักไข่');
    if (incubationSheet) {
        let count = 0;
        const incPromises: any[] = [];
        for (let i = 5; i <= incubationSheet.rowCount; i++) {
            const row = incubationSheet.getRow(i);
            const fName = getCellValue(row.getCell(2)); // Female
            const mName = getCellValue(row.getCell(3)); // Male
            if (!fName || !mName) continue;

            const fMatch = allSnakes.find(s => s.name === fName || s.morph === fName || s.code === fName);
            const mMatch = allSnakes.find(s => s.name === mName || s.morph === mName || s.code === mName);

            if (fMatch && mMatch) {
                // Find matching breeding record recently created
                const breedRecord = await prisma.breedingRecord.findFirst({
                    where: { femaleId: fMatch.id, maleId: mMatch.id },
                    orderBy: { id: 'desc' }
                });

                if (breedRecord) {
                    const dateLaid = parseDateString(getCellValue(row.getCell(4)));
                    const datePip = parseDateString(getCellValue(row.getCell(5)));
                    const dateHatch = parseDateString(getCellValue(row.getCell(6)));
                    const temp = getCellValue(row.getCell(7));
                    const cntHatched = parseInt(getCellValue(row.getCell(8)) || '0');
                    const cntDead = parseInt(getCellValue(row.getCell(9)) || '0');

                    incPromises.push(
                        prisma.incubationRecord.create({
                            data: {
                                breedingId: breedRecord.id,
                                femaleId: fMatch.id,
                                maleId: mMatch.id,
                                incubationStart: dateLaid,
                                pippingDate: datePip,
                                hatchDate: dateHatch,
                                temperature: parseFloat(temp?.toString() || '0') || null,
                                actualHatched: isNaN(cntHatched) ? null : cntHatched,
                                deadCount: isNaN(cntDead) ? null : cntDead,
                                notes: getCellValue(row.getCell(10)) || ''
                            }
                        })
                    );
                    count++;
                }
            }
        }
        await Promise.all(incPromises);
        console.log(`✅ Inserted ${count} incubation records.`);
    }

    console.log('🎉 Done.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
