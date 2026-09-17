const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const dir = 'C:\\Users\\othma\\OneDrive\\Bureau\\alibdaealamia';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.xlsx') && !f.startsWith('~'));

function norm(s) {
  if (!s) return '';
  return s.toString().trim()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u065F]/g, '')
    .replace(/\bال/g, '')
    .replace(/\bل/g, '')
    .replace(/\s+/g, ' ');
}

// Master
const masterFile = files.find(f => f.includes('élèves') || f.includes('Ã©lÃ©ves'));
const masterWb = xlsx.readFile(path.join(dir, masterFile));
const masterStudents = xlsx.utils.sheet_to_json(masterWb.Sheets['التلاميذ']);

// All massar by class
const massarFilesByClass = [
  { levelCode: '1APG-1', file: 'export_notesCC_1APG-1_0012.xlsx' },
  { levelCode: '2APG-1', file: 'export_notesCC_2APG-1_0012.xlsx' },
  { levelCode: '3APG-1', file: 'Export_58394W_3APG-1_LANGUE ARABE_08062026091857.xlsx' },
  { levelCode: '4APG-1', file: 'Export_58394W_4APG-1_LANGUE ARABE_08062026091858.xlsx' },
  { levelCode: '6APG-1', file: 'Export_58394W_6APG-1_LANGUE ARABE_03042026092334.xlsx' }
];

let totalMassarStudents = 0;
let matchedWithParent = 0;

massarFilesByClass.forEach(cfg => {
  const wb = xlsx.readFile(path.join(dir, cfg.file));
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  const classStudents = [];
  data.forEach(row => {
    let code = null;
    let name = null;
    row.forEach(cell => {
      if (typeof cell === 'string') {
        const t = cell.trim();
        if (/^[A-Za-z]\d{8,10}$/.test(t)) code = t.toUpperCase();
        else if (cell && /[\u0600-\u06FF]/.test(cell) && cell.length > 3 && 
                 !cell.includes('المستوى') && !cell.includes('الدورة') && 
                 !cell.includes('مؤسسة') && !cell.includes('مادة') && !cell.includes('الامتحان')) {
          name = cell.trim();
        }
      }
    });
    if (code && name) classStudents.push({ code, name });
  });

  console.log(`\n=== Classe ${cfg.levelCode} (${cfg.file}) : ${classStudents.length} élèves ===`);
  totalMassarStudents += classStudents.length;

  classStudents.forEach(st => {
    const sNorm = norm(st.name);
    const sTokens = sNorm.split(' ').filter(w => w.length > 1);

    const pMatch = masterStudents.find(ms => {
      const mNorm = norm(ms['اسم التلميذ/ة']);
      if (mNorm === sNorm) return true;
      const mTokens = mNorm.split(' ').filter(w => w.length > 1);
      const common = sTokens.filter(t => mTokens.includes(t)).length;
      return common >= 2 && common === Math.min(sTokens.length, mTokens.length);
    });

    if (pMatch) {
      matchedWithParent++;
    } else {
      console.log(`  Sans parent dans master: ${st.code} | ${st.name}`);
    }
  });
});

console.log(`\nTotal élèves Massar : ${totalMassarStudents}`);
console.log(`Élèves avec parent trouvé dans master : ${matchedWithParent} / ${totalMassarStudents}`);
