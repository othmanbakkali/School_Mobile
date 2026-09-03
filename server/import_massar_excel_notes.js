const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const rawOdooUrl = process.env.ODOO_URL || 'http://68.183.19.16:8069';
const ODOO_URL = rawOdooUrl.replace(/\/+$/, '');
const ODOO_DB = process.env.ODOO_DB || 'alibdaealamia';
const ADMIN_USER = process.env.ODOO_ADMIN_USER || 'othmanbakkali@gmail.com';
const ADMIN_PASS = process.env.ODOO_ADMIN_PASS || 'Admin@2026';

const callOdoo = async (service, method, args, kwargs = {}) => {
    const response = await axios.post(`${ODOO_URL}/jsonrpc`, {
        jsonrpc: '2.0',
        method: 'call',
        params: { service, method, args, kwargs },
        id: Math.floor(Math.random() * 1000)
    });
    if (response.data.error) {
        throw new Error(JSON.stringify(response.data.error));
    }
    return response.data.result;
};

async function importMassarFile(filePath, adminUid) {
    const fileName = path.basename(filePath);
    console.log(`\n📂 Traitement du fichier : ${fileName}`);

    const wb = xlsx.readFile(filePath);
    const sheet = wb.Sheets['NotesCC'] || wb.Sheets[wb.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    let detectedSubject = '';
    let detectedTeacher = '';
    let detectedLevel = '';
    let detectedSemester = 'S1';
    let detectedCC = 'cc1';

    // 1. Lire les métadonnées d'entête
    for (let r = 0; r < Math.min(16, rows.length); r++) {
        const row = rows[r] || [];
        for (let c = 0; c < row.length; c++) {
            const val = String(row[c] || '').trim();
            if (val === 'المادة') {
                detectedSubject = row.slice(c + 1).find(x => x && String(x).trim().length > 0) || '';
            } else if (val === 'الاستاذ' || val === 'الأستاذ') {
                detectedTeacher = row.slice(c + 1).find(x => x && String(x).trim().length > 0) || '';
            } else if (val.includes('المستوى') || val.includes('القسم')) {
                const found = row.slice(c + 1).find(x => x && String(x).trim().length > 0);
                if (found && (!detectedLevel || found.length < detectedLevel.length)) detectedLevel = found;
            } else if (val.includes('الدورة')) {
                const s = row.slice(c + 1).find(x => x && String(x).trim().length > 0) || '';
                if (s.includes('ثانية') || s.includes('2')) detectedSemester = 'S2';
                else if (s.includes('أولى') || s.includes('1')) detectedSemester = 'S1';
            } else if (val.includes('نقط') || val.includes('الفرض')) {
                const cc = row.slice(c + 1).find(x => x && String(x).trim().length > 0) || '';
                if (cc.includes('ثاني') || cc.includes('2')) detectedCC = 'cc2';
                else if (cc.includes('أول') || cc.includes('1')) detectedCC = 'cc1';
            }
        }
    }

    console.log(`   - Niveau/Classe : ${detectedLevel}`);
    console.log(`   - Matière       : ${detectedSubject}`);
    console.log(`   - Enseignant    : ${detectedTeacher || '(Non spécifié)'}`);
    console.log(`   - Session       : ${detectedSemester} (${detectedCC.toUpperCase()})`);

    // 2. Trouver la matière dans Odoo
    const subjects = await callOdoo('object', 'execute_kw', [
        ODOO_DB, adminUid, ADMIN_PASS, 'school.subject', 'search_read',
        [[]],
        { fields: ['id', 'name'] }
    ]);

    let targetSubject = subjects.find(s => 
        detectedSubject && s.name.toLowerCase().includes(detectedSubject.toLowerCase())
    );
    if (!targetSubject && detectedSubject) {
        if (detectedSubject.includes('عرب')) targetSubject = subjects.find(s => s.name.includes('عربية'));
        else if (detectedSubject.includes('فرنس')) targetSubject = subjects.find(s => s.name.toLowerCase().includes('français'));
        else if (detectedSubject.includes('رياض')) targetSubject = subjects.find(s => s.name.includes('رياضيات'));
        else if (detectedSubject.includes('إسلام')) targetSubject = subjects.find(s => s.name.includes('إسلام'));
        else if (detectedSubject.includes('اجتماع')) targetSubject = subjects.find(s => s.name.includes('اجتماع'));
        else if (detectedSubject.includes('علم')) targetSubject = subjects.find(s => s.name.includes('علم'));
        else if (detectedSubject.includes('فن')) targetSubject = subjects.find(s => s.name.includes('فن'));
    }

    // 3. Trouver la ligne d'entête des élèves
    let headerRow = -1;
    let massarCol = -1;
    let nameCol = -1;

    for (let r = 12; r < Math.min(22, rows.length); r++) {
        const row = rows[r] || [];
        for (let c = 0; c < row.length; c++) {
            const v = String(row[c] || '').trim();
            if (v.includes('رقم') && v.includes('تلميذ')) {
                headerRow = r;
                massarCol = c;
            } else if (v.includes('إسم') && v.includes('تلميذ')) {
                nameCol = c;
            }
        }
    }

    if (headerRow === -1 || massarCol === -1) {
        console.log(`   ⚠️ Ligne d'entête des élèves non trouvée dans ${fileName}`);
        return;
    }

    // 4. Identifier les colonnes de sous-matières
    const headerCols = rows[headerRow] || [];
    const compCols = [];
    for (let c = massarCol + 2; c < headerCols.length; c += 2) {
        const compName = String(headerCols[c] || '').trim().replace(/[\r\n]+/g, ' ');
        if (compName && !compName.includes('ملاحظات') && !compName.includes('الأستاذ') && compName !== '-') {
            compCols.push({ col: c, name: compName });
        }
    }

    console.log(`   - Composantes identifiées (${compCols.length}) :`, compCols.map(c => c.name).join(', '));

    // 5. Parcourir les élèves
    let countNotes = 0;
    for (let r = headerRow + 2; r < rows.length; r++) {
        const row = rows[r] || [];
        const massarVal = String(row[massarCol] || '').trim();
        const studentName = nameCol !== -1 ? String(row[nameCol] || '').trim() : '';

        if (!massarVal && !studentName) continue;

        // Chercher l'élève dans Odoo
        let students = [];
        if (massarVal) {
            students = await callOdoo('object', 'execute_kw', [
                ODOO_DB, adminUid, ADMIN_PASS, 'school.student', 'search_read',
                [[['massar_number', '=', massarVal]]],
                { fields: ['id', 'name', 'level_id'] }
            ]);
        }
        if (students.length === 0 && studentName) {
            students = await callOdoo('object', 'execute_kw', [
                ODOO_DB, adminUid, ADMIN_PASS, 'school.student', 'search_read',
                [[['name', '=', studentName]]],
                { fields: ['id', 'name', 'level_id'] }
            ]);
        }

        if (students.length === 0) continue;
        const student = students[0];

        // Extraire les notes
        const marks = [];
        for (const comp of compCols) {
            const val = row[comp.col];
            if (val !== undefined && val !== null && val !== '') {
                const num = parseFloat(val);
                if (!isNaN(num)) marks.push(num);
            }
        }

        if (marks.length > 0) {
            const calculatedMark = marks.reduce((a, b) => a + b, 0) / marks.length;

            const existingGrade = await callOdoo('object', 'execute_kw', [
                ODOO_DB, adminUid, ADMIN_PASS, 'school.grade', 'search_read',
                [[
                    ['student_id', '=', student.id],
                    ['subject_id', '=', targetSubject ? targetSubject.id : false],
                    ['semester', '=', detectedSemester]
                ]],
                { fields: ['id', 'cc1', 'cc2', 'final_mark'] }
            ]);

            const vals = {
                student_id: student.id,
                subject_id: targetSubject ? targetSubject.id : false,
                subject: targetSubject ? targetSubject.name : detectedSubject,
                semester: detectedSemester
            };

            if (detectedCC === 'cc1') vals.cc1 = calculatedMark;
            else if (detectedCC === 'cc2') vals.cc2 = calculatedMark;

            if (existingGrade.length > 0) {
                const eg = existingGrade[0];
                if (detectedCC === 'cc1') {
                    vals.final_mark = eg.cc2 > 0 ? (calculatedMark + eg.cc2) / 2 : calculatedMark;
                } else {
                    vals.final_mark = eg.cc1 > 0 ? (eg.cc1 + calculatedMark) / 2 : calculatedMark;
                }
                await callOdoo('object', 'execute_kw', [
                    ODOO_DB, adminUid, ADMIN_PASS, 'school.grade', 'write',
                    [[eg.id], vals]
                ]);
            } else {
                vals.final_mark = calculatedMark;
                await callOdoo('object', 'execute_kw', [
                    ODOO_DB, adminUid, ADMIN_PASS, 'school.grade', 'create',
                    [vals]
                ]);
            }
            countNotes++;
        }
    }

    console.log(`   ✨ ${countNotes} notes d'élèves enregistrées/mises à jour dans Odoo.`);
}

async function main() {
    try {
        const adminUid = await callOdoo('common', 'login', [ODOO_DB, ADMIN_USER, ADMIN_PASS]);
        console.log(`✅ Connecté en tant qu'admin (UID: ${adminUid})`);

        const dir = 'C:\\Users\\othma\\OneDrive\\Bureau\\alibdaealamia';
        const files = fs.readdirSync(dir).filter(f => f.endsWith('.xlsx') && !f.startsWith('~$'));

        for (const f of files) {
            await importMassarFile(path.join(dir, f), adminUid);
        }

        console.log('\n🎉 TOUS LES FICHIERS MASSAR ONT ÉTÉ IMPORTÉS AVEC SUCCÈS DANS ODOO !');

    } catch (e) {
        console.error('❌ Erreur:', e.message);
    }
}

main();
