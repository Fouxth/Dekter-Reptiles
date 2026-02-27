const ExcelJS = require('exceljs');

async function main() {
    const workbook = new ExcelJS.Workbook();
    console.log('Loading workbook...');
    await workbook.xlsx.readFile('data_full.xlsx');

    const tabsToInspect = [
        'Cost',
        'Stock',
        'ฟักไข่'
    ];

    tabsToInspect.forEach(name => {
        const sheet = workbook.getWorksheet(name);
        if (sheet) {
            console.log('\n--- Sheet: ' + name + ' ---');
            for (let i = 1; i <= 5; i++) {
                const row = sheet.getRow(i);
                if (row.values.length > 0) {
                    console.log('Row ' + i + ':', JSON.stringify(row.values));
                }
            }
        } else {
            console.log('\n--- Sheet: ' + name + ' NOT FOUND ---');
        }
    });
}
main();
