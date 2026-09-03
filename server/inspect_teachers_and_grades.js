const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const dir = 'C:\\Users\\othma\\OneDrive\\Bureau\\alibdaealamia';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.xlsx') && !f.startsWith('~$'));

console.log(`Found ${files.length} Excel files:`);

files.forEach(f => {
    const wb = xlsx.readFile(path.join(dir, f));
    const sheet = wb.Sheets['NotesCC'] || wb.Sheets[wb.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    let teacher = '';
    let subject = '';
    let level = '';
    let session = '';

    for (let r = 0; r < Math.min(15, rows.length); r++) {
        const row = rows[r] || [];
        for (let c = 0; c < row.length; c++) {
            const val = String(row[c] || '').trim();
            if (val.includes('الأستاذ') || val.includes('الاستاذ') || val.includes('Professeur') || val.includes('Enseignant')) {
                teacher = String(row[c+1] || row[c+2] || row[c-1] || '').trim();
            }
            if (val.includes('المادة') || val.includes('Matière')) {
                subject = String(row[c+1] || row[c+2] || '').trim();
            }
            if (val.includes('المستوى') || val.includes('القسم') || val.includes('Classe')) {
                level = String(row[c+1] || row[c+2] || '').trim();
            }
            if (val.includes('الدورة') || val.includes('الفرض') || val.includes('Semestre')) {
                session += ' ' + val + ': ' + String(row[c+1] || row[c+2] || '').trim();
            }
        }
    }

    console.log(`\n📄 [${f}]`);
    console.log(`   - Niveau / Classe : ${level}`);
    console.log(`   - Matière         : ${subject}`);
    console.log(`   - Enseignant/Prof : ${teacher || '(Non spécifié ou à extraire)'}`);
    console.log(`   - Période / CC    : ${session.trim()}`);
});
