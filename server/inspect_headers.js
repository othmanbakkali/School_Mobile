const xlsx = require('xlsx');
const path = require('path');

const dir = 'C:\\Users\\othma\\OneDrive\\Bureau\\alibdaealamia';
const files = [
    'Export_58394W_3APG-1_LANGUE ARABE_08062026091857.xlsx',
    'export_notesCC_1APG-1_0012.xlsx',
    'export_notesCC_6APG-1_0019 (2).xlsx'
];

files.forEach(f => {
    console.log('---------------------------------------------------------');
    console.log('FILE:', f);
    const wb = xlsx.readFile(path.join(dir, f));
    const sheet = wb.Sheets['NotesCC'] || wb.Sheets[wb.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    for (let i = 5; i <= 18; i++) {
        console.log(`Row ${i}:`, JSON.stringify(rows[i]));
    }
});
