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
        id: 1
    });
    return response.data.result;
};

const screenshotStudents = [
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

function normalize(s) {
    if (!s) return '';
    return s.toString().trim()
        .replace(/[إأآا]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .replace(/\bال/g, '')
        .replace(/\bل/g, '')
        .replace(/\s+/g, ' ');
}

async function run() {
    const uid = await callOdoo('common', 'login', [ODOO_DB, ADMIN_USER, ADMIN_PASS]);
    const students = await callOdoo('object', 'execute_kw', [
        ODOO_DB, uid, ADMIN_PASS, 'school.student', 'search_read',
        [[['active', '=', true]]],
        { fields: ['id', 'name', 'massar_number', 'level_id', 'parent_id'] }
    ]);
    
    console.log('N° | Élève (Image) | Massar (Image) | ID Odoo | Nom Odoo | Massar Odoo | Niveau Odoo | Statut');
    screenshotStudents.forEach((st, idx) => {
        const matchByMassar = students.find(s => s.massar_number === st.massar);
        const matchByName = students.find(s => {
            const n1 = normalize(s.name).split(' ').sort().join(' ');
            const n2 = normalize(st.name).split(' ').sort().join(' ');
            return n1 === n2 || n1.includes(n2) || n2.includes(n1);
        });
        const match = matchByMassar || matchByName;
        if (match) {
            const isMatch = (match.massar_number === st.massar);
            console.log(`${idx+1} | ${st.name} | ${st.massar} | ${match.id} | ${match.name} | ${match.massar_number} | ${match.level_id ? match.level_id[1] : ''} | ${isMatch ? '✅ EXACT' : '❌ ERREUR'}`);
        } else {
            console.log(`${idx+1} | ${st.name} | ${st.massar} | - | INTROUVABLE | - | - | ❌ MANQUANT`);
        }
    });
}

run().catch(console.error);
