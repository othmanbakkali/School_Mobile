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

const imageMap = [
    { name: 'طهاري الياس', massar: 'A230068177' },
    { name: 'بحباح فردوس', massar: 'A231071997' },
    { name: 'مومني يحيى', massar: 'A232105643' },
    { name: 'بن حساين بولعيش دانية', massar: 'A234072014' },
    { name: 'القطيبي بيان', massar: 'A236063375' },
    { name: 'اشتيوي محمد', massar: 'A236072030' },
    { name: 'الريفي الشكري أمينة', massar: 'A236099467' },
    { name: 'الدحيمن أمير', massar: 'A244070612' },
    { name: 'الحجاوي لقمان', massar: 'A244081067' },
    { name: 'حوداس ادم', massar: 'A245081084' },
    { name: 'خلو أشرف', massar: 'A245099165' },
    { name: 'الغميكي محمد امين', massar: 'A246042035' },
    { name: 'امنخفاد نعمة', massar: 'A247060906' },
    { name: 'الحيرش عبير', massar: 'A247073265' },
    { name: 'المحسيني زياد', massar: 'A247097283' },
    { name: 'ابن الاشهاب قمر', massar: 'A250000014' },
    { name: 'مطالسي مريم', massar: 'A251008257' },
    { name: 'الشيوة ميساء', massar: 'A252084748' },
    { name: 'لبحيرة ياسين', massar: 'A254000169' },
    { name: 'الفتوح محمد', massar: 'A255004031' },
    { name: 'لمزيوي نور', massar: 'A255084762' },
    { name: 'الحميدي رزان', massar: 'A256000183' },
    { name: 'الخياري ريماس', massar: 'A257004034' },
    { name: 'الفيلالي لجين', massar: 'A233116805' },
];

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
    return normalizeArabic(str).replace(/\bال/g, '').replace(/\s+/g, ' ').trim();
}

function getTokens(str) {
    return normalizeArabic(str).split(' ').filter(w => w.length > 0).sort().join(' ');
}

function getLooseTokens(str) {
    return stripAl(str).split(' ').filter(w => w.length > 0).sort().join(' ');
}

function matches(name1, name2) {
    if (getTokens(name1) === getTokens(name2)) return true;
    if (getLooseTokens(name1) === getLooseTokens(name2)) return true;
    return false;
}

async function check() {
    const uid = await callOdoo('common', 'login', [ODOO_DB, ADMIN_USER, ADMIN_PASS]);
    const students = await callOdoo('object', 'execute_kw', [
        ODOO_DB, uid, ADMIN_PASS, 'school.student', 'search_read',
        [[['active', '=', true]]],
        { fields: ['id', 'name', 'massar_number', 'level_id'] }
    ]);

    console.log('Comparing image students with Odoo:');
    let correctCount = 0;
    let wrongCount = 0;
    const toFix = [];

    imageMap.forEach(item => {
        const matched = students.find(s => matches(s.name, item.name));
        if (matched) {
            const isCorrect = (matched.massar_number === item.massar);
            if (isCorrect) correctCount++;
            else {
                wrongCount++;
                toFix.push({ studentId: matched.id, name: matched.name, current: matched.massar_number, expected: item.massar });
            }
            console.log(`[ID ${matched.id}] "${matched.name}" -> In Odoo: "${matched.massar_number}" | Expected: "${item.massar}" | Correct? ${isCorrect}`);
        } else {
            console.log(`NOT FOUND IN ODOO: "${item.name}"`);
        }
    });

    console.log(`\nCorrect: ${correctCount}, To Fix: ${wrongCount}`);
    return toFix;
}

check().catch(console.error);
