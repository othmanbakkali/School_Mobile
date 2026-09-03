const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const dir = 'C:\\Users\\othma\\OneDrive\\Bureau\\alibdaealamia';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.xlsx') && !f.startsWith('~$'));

files.forEach(f => {
    const wb = xlsx.readFile(path.join(dir, f));
    const sheet = wb.Sheets['NotesCC'] || wb.Sheets[wb.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    let nonNullMarks = 0;
    for (let r = 17; r < rows.length; r++) {
        const row = rows[r] || [];
        for (let c = 6; c < row.length; c += 2) {
            if (row[c] !== null && row[c] !== undefined && row[c] !== '') {
                nonNullMarks++;
            }
        }
    }
    console.log(`${f}: ${rows.length - 17} élèves, ${nonNullMarks} notes saisies`);
});
