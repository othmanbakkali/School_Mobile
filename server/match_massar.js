const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const axios = require('axios');
require('dotenv').config({ path: './.env' });

const ODOO_URL = (process.env.ODOO_URL || 'http://68.183.19.16:8069').replace(/\/+$/, '');
const ODOO_DB = process.env.ODOO_DB || 'alibdaealamia';
const ADMIN_USER = process.env.ODOO_ADMIN_USER || 'othmanbakkali@gmail.com';
const ADMIN_PASS = process.env.ODOO_ADMIN_PASS || 'Admin@2026';

const callOdoo = async (service, method, args, kwargs = {}) => {
    const response = await axios.post(ODOO_URL + '/jsonrpc', {
        jsonrpc: '2.0',
        method: 'call',
        params: { service, method, args, kwargs },
        id: Math.floor(Math.random() * 10000)
    });
    return response.data.result;
};

// 1. Parse Excel
const dir = 'C:\\Users\\othma\\OneDrive\\Bureau\\alibdaealamia';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.xlsx') && !f.startsWith('~') && !f.includes('élèves') && !f.includes('Ã©lÃ©ves'));

function normalizeArabic(str) {
    if (!str) return '';
    return str.toString().trim()
        .replace(/[إأآا]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .replace(/[\u064B-\u065F]/g, '')
        .replace(/\s+/g, ' ');
}

function stripAl(str) {
    return normalizeArabic(str).replace(/\bال/g, '').replace(/\bل/g, '').replace(/\s+/g, ' ').trim();
}

function getTokens(str) {
    return normalizeArabic(str).split(' ').filter(w => w.length > 0).sort().join(' ');
}

function getLooseTokens(str) {
    return stripAl(str).split(' ').filter(w => w.length > 0).sort().join(' ');
}

function matches(name1, name2) {
    if (!name1 || !name2) return false;
    if (getTokens(name1) === getTokens(name2)) return true;
    if (getLooseTokens(name1) === getLooseTokens(name2)) return true;
    
    // Check token intersection
    const t1 = stripAl(name1).split(' ').filter(w => w.length > 1);
    const t2 = stripAl(name2).split(' ').filter(w => w.length > 1);
    const matchCount = t1.filter(t => t2.includes(t)).length;
    if (matchCount >= 2 && matchCount === Math.min(t1.length, t2.length)) return true;
    
    return false;
}

const excelRecords = [];

files.forEach(file => {
    const wb = xlsx.readFile(path.join(dir, file));
    wb.SheetNames.forEach(sName => {
        const sheet = wb.Sheets[sName];
        const data = xlsx.utils.sheet_to_json(sheet, {header: 1});
        data.forEach((row) => {
            let code = null;
            let name = null;
            row.forEach((cell) => {
                if (typeof cell === 'string') {
                    const t = cell.trim();
                    if (/^[A-Za-z]\d{8,10}$/.test(t)) {
                        code = t.toUpperCase();
                    } else if (cell && /[\u0600-\u06FF]/.test(cell) && cell.length > 3 && !cell.includes('المستوى') && !cell.includes('الدورة') && !cell.includes('مؤسسة') && !cell.includes('مادة') && !cell.includes('الامتحان')) {
                        name = cell.trim();
                    }
                }
            });
            if (code && name) {
                excelRecords.push({
                    file,
                    name,
                    code
                });
            }
        });
    });
});

// Also add user provided screenshot mappings explicitly
const imageMap = [
    { name: 'طهاري الياس', code: 'A230068177' },
    { name: 'بحباح فردوس', code: 'A231071997' },
    { name: 'مومني يحيى', code: 'A232105643' },
    { name: 'بن حساين بولعيش دانية', code: 'A234072014' },
    { name: 'القطيبي بيان', code: 'A236063375' },
    { name: 'اشتيوي محمد', code: 'A236072030' },
    { name: 'الريفي الشكري أمينة', code: 'A236099467' },
    { name: 'الدحيمن أمير', code: 'A244070612' },
    { name: 'الحجاوي لقمان', code: 'A244081067' },
    { name: 'حوداس ادم', code: 'A245081084' },
    { name: 'خلو أشرف', code: 'A245099165' },
    { name: 'الغميكي محمد امين', code: 'A246042035' },
    { name: 'امنخفاد نعمة', code: 'A247060906' },
    { name: 'الحيرش عبير', code: 'A247073265' },
    { name: 'المحسيني زياد', code: 'A247097283' },
    { name: 'ابن الاشهاب قمر', code: 'A250000014' },
    { name: 'مطالسي مريم', code: 'A251008257' },
    { name: 'الشيوة ميساء', code: 'A252084748' },
    { name: 'لبحيرة ياسين', code: 'A254000169' },
    { name: 'الفتوح محمد', code: 'A255004031' },
    { name: 'لمزيوي نور', code: 'A255084762' },
    { name: 'الحميدي رزان', code: 'A256000183' },
    { name: 'الخياري ريماس', code: 'A257004034' },
    { name: 'الفيلالي لجين', code: 'A233116805' },
];

imageMap.forEach(i => excelRecords.push({ file: 'screenshot', name: i.name, code: i.code }));

async function run() {
    const uid = await callOdoo('common', 'login', [ODOO_DB, ADMIN_USER, ADMIN_PASS]);
    const students = await callOdoo('object', 'execute_kw', [
        ODOO_DB, uid, ADMIN_PASS, 'school.student', 'search_read',
        [[['active', '=', true]]],
        { fields: ['id', 'name', 'massar_number', 'level_id'] }
    ]);

    console.log(`Total active students in Odoo: ${students.length}`);

    const updates = [];
    const unchanged = [];
    const unmatched = [];

    students.forEach(st => {
        // Find best match in excelRecords
        const matchesFound = excelRecords.filter(rec => matches(st.name, rec.name));
        if (matchesFound.length > 0) {
            // Pick match
            const best = matchesFound[0];
            if (st.massar_number !== best.code) {
                updates.push({
                    id: st.id,
                    name: st.name,
                    level: st.level_id ? st.level_id[1] : '',
                    currentMassar: st.massar_number,
                    matchedName: best.name,
                    correctMassar: best.code,
                    source: best.file
                });
            } else {
                unchanged.push({ id: st.id, name: st.name, massar: st.massar_number });
            }
        } else {
            unmatched.push({ id: st.id, name: st.name, level: st.level_id ? st.level_id[1] : '', massar: st.massar_number });
        }
    });

    console.log(`\n======================================================`);
    console.log(`STUDENTS REQUIRING CORRECTION IN ODOO: ${updates.length}`);
    console.log(`======================================================`);
    updates.forEach(u => {
        console.log(`[ID ${u.id}] "${u.name}" (${u.level})`);
        console.log(`   Current in Odoo : ${u.currentMassar}`);
        console.log(`   Correct Massar  : ${u.correctMassar} (Matched "${u.matchedName}" in ${u.source})\n`);
    });

    console.log(`======================================================`);
    console.log(`STUDENTS ALREADY CORRECT: ${unchanged.length}`);
    console.log(`STUDENTS NOT FOUND IN EXCEL / FILES: ${unmatched.length}`);
    console.log(`======================================================`);
    unmatched.forEach(u => {
        console.log(`[ID ${u.id}] "${u.name}" (${u.level}) - Current: ${u.massar}`);
    });
}

run().catch(console.error);
