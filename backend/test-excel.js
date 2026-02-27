const ExcelJS = require('exceljs');

async function main() {
    const workbook = new ExcelJS.Workbook();
    console.log('Loading workbook...');
    await workbook.xlsx.readFile('data.xlsx');
    console.log('Workbook loaded');
    const sheet = workbook.getWorksheet('❌❌❌CODE❌ห้ามแก้ไข❌❌❌');
    if (!sheet) return console.log('Sheet not found');
    for (let i = 2; i <= 20; i++) {
        const codeCell = sheet.getCell('A' + i);
        const code = codeCell.value;
        const morphCell = sheet.getCell('B' + i);
        const morph = morphCell.value;
        const isStrike = morphCell.font && morphCell.font.strike;
        console.log('Row ' + i + ':', code, typeof morph === 'object' ? JSON.stringify(morph) : morph, 'Strike:', isStrike);
    }
}
main();
