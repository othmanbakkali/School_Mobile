const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const dir = 'C:\\Users\\othma\\OneDrive\\Bureau\\alibdaealamia';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.xlsx') && !f.startsWith('~$'));

const allStudents = new Map();

files.forEach(f => {
    const wb = xlsx.readFile(path.join(dir, f));
    const sheet = wb.Sheets['NotesCC'] || wb.Sheets[wb.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    
    let classCode = '';
    let levelName = '';
    let teacher = '';

    for (let i = 0; i < 12; i++) {
        const r = rows[i] || [];
        for (let j = 0; j < r.length; j++) {
            const cell = String(r[j] || '').trim();
            if (cell.includes('المستوى')) levelName = String(r[j+1] || '').trim();
            if (cell.includes('القسم')) classCode = String(r[j+2] || r[j+1] || '').trim();
            if (cell.includes('الاستاذ') || cell.includes('الأستاذ')) teacher = String(r[j+2] || r[j+1] || '').trim();
        }
    }

    let count = 0;
    for (let r = 17; r < rows.length; r++) {
        const row = rows[r] || [];
        const emsId = row[1];
        const massar = String(row[2] || '').trim();
        const name = String(row[3] || '').trim();
        const birthDate = String(row[5] || '').trim();

        if (massar && name && massar.length >= 4) {
            count++;
            if (!allStudents.has(massar)) {
                allStudents.set(massar, {
                    name,
                    massar_number: massar,
                    ems_id: emsId,
                    birth_date: birthDate,
                    class_code: classCode,
                    level_name: levelName,
                    teacher: teacher
                });
            }
        }
    }
    console.log(`${f} -> Classe: ${classCode} (${levelName}), Prof: ${teacher || 'N/A'}, Nombre d'élèves: ${count}`);
});

console.log(`\nTOTAL ÉLÈVES UNIQUES : ${allStudents.size}`);
