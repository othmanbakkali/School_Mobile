const xlsx = require('xlsx');
const path = require('path');

const dir = 'C:\\Users\\othma\\OneDrive\\Bureau\\alibdaealamia';
const sampleFile = path.join(dir, 'Export_58394W_6APG-1_LANGUE ARABE_03042026092334.xlsx');

const wb = xlsx.readFile(sampleFile);
const sheet = wb.Sheets['NotesCC'];
const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

console.log('Sample file:', sampleFile);
console.log('Rows 10 to 22:');
for (let i = 10; i < Math.min(rows.length, 25); i++) {
    console.log(`Row ${i}:`, JSON.stringify(rows[i]));
}
