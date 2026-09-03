const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const dir = 'C:\\Users\\othma\\OneDrive\\Bureau\\alibdaealamia';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.xlsx'));

console.log(`Found ${files.length} excel files.\n`);

files.forEach(file => {
    console.log(`=======================================================`);
    console.log(`FILE: ${file}`);
    const filePath = path.join(dir, file);
    try {
        const wb = xlsx.readFile(filePath);
        console.log(`Sheet Names:`, wb.SheetNames);
        const firstSheet = wb.Sheets[wb.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(firstSheet, { header: 1 });
        console.log(`Total Rows:`, data.length);
        console.log(`First 10 rows:`);
        data.slice(0, 12).forEach((row, i) => {
            console.log(`  Row ${i}:`, JSON.stringify(row));
        });
    } catch (e) {
        console.error(`Error reading ${file}:`, e.message);
    }
    console.log(`\n`);
});
