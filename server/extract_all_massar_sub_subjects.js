const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const dir = 'C:\\Users\\othma\\OneDrive\\Bureau\\alibdaealamia';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.xlsx') && !f.startsWith('~$'));

const subjectComponentsMap = new Map(); // SubjectName -> Set of sub-subjects

files.forEach(f => {
    const wb = xlsx.readFile(path.join(dir, f));
    const sheet = wb.Sheets['NotesCC'] || wb.Sheets[wb.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    let subjectName = '';
    let levelName = '';

    for (let i = 0; i < 14; i++) {
        const r = rows[i] || [];
        for (let j = 0; j < r.length; j++) {
            const cell = String(r[j] || '').trim();
            if (cell.includes('المادة')) subjectName = String(r[j+2] || r[j+1] || '').trim();
            if (cell.includes('المستوى')) levelName = String(r[j+1] || '').trim();
        }
    }

    if (!subjectName) {
        // Déduire du nom de fichier
        if (f.includes('LANGUE ARABE')) subjectName = 'اللغة العربية';
        else if (f.includes('HISTOIRE GEOGRAPHIE')) subjectName = 'الاجتماعيات';
        else if (f.includes('INSTRUCTION ISLAMIQUE')) subjectName = 'التربية الإسلامية';
        else if (f.includes('EDUCATION ARTISTIQUE')) subjectName = 'التربية الفنية';
        else if (f.includes('0012')) subjectName = 'اللغة الفرنسية';
        else if (f.includes('0019')) subjectName = 'الرياضيات';
    }

    let headerRowIndex = -1;
    for (let i = 12; i < Math.min(rows.length, 20); i++) {
        const r = rows[i] || [];
        if (r.some(c => String(c).includes('رقم') || String(c).includes('إسم') || String(c).includes('تلميذ'))) {
            headerRowIndex = i;
            break;
        }
    }

    if (headerRowIndex !== -1) {
        const headerCols = rows[headerRowIndex] || [];
        if (!subjectComponentsMap.has(subjectName)) {
            subjectComponentsMap.set(subjectName, new Map());
        }
        const subjMap = subjectComponentsMap.get(subjectName);

        for (let c = 6; c < headerCols.length; c += 2) {
            const rawComp = String(headerCols[c] || '').trim();
            if (rawComp && !rawComp.includes('ملاحظات') && !rawComp.includes('الأستاذ') && rawComp !== '-') {
                const cleanedComp = rawComp.replace(/[\r\n]+/g, ' ').trim();
                subjMap.set(cleanedComp, (subjMap.get(cleanedComp) || 0) + 1);
            }
        }
    }

    console.log(`Fichier: ${f} -> Matière: ${subjectName}`);
});

console.log('\n================ EXACT MASSAR SUB-SUBJECTS BY SUBJECT ================');
subjectComponentsMap.forEach((compMap, subj) => {
    console.log(`\n📚 [${subj}] :`);
    compMap.forEach((count, comp) => {
        console.log(`   - ${comp}`);
    });
});
