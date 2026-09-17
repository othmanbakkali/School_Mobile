const axios = require('axios');
const xlsx = require('xlsx');
const path = require('path');
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

const secondImageStudents = [
  { name: 'قروان سجى', massar: 'A219127469' },
  { name: 'التيزيني الزرع محمد ونيس', massar: 'A226082311' },
  { name: 'الطويل يوسف', massar: 'A229134563' },
  { name: 'اوتغات ملاك', massar: 'A231060186' },
  { name: 'المودن محمد أنس', massar: 'A231066680' },
  { name: 'الرياحي نور', massar: 'A232123114' },
  { name: 'كوزي محمد اسلام', massar: 'A240036296' },
  { name: 'القبيب إياد', massar: 'A241032554' },
  { name: 'طلحى رانيا', massar: 'A242021913' },
  { name: 'سلام عمران', massar: 'A242032931' },
  { name: 'أقريور رتاج', massar: 'A243021910' },
  { name: 'المودن رتاج', massar: 'A243028480' },
  { name: 'عكراد رؤيا', massar: 'A244022050' },
  { name: 'هاني رتاج', massar: 'A244034536' },
  { name: 'فخار إسراء', massar: 'A244040995' },
  { name: 'فحصي لينا', massar: 'A247028475' },
  { name: 'الشايب فراس', massar: 'A247028476' },
  { name: 'بوسكومة بسمة', massar: 'A247029731' },
  { name: 'الخمالي هداية', massar: 'A248021911' },
  { name: 'بعسين محمد سعيد', massar: 'A248029348' },
  { name: 'بركان سراج الدين', massar: 'A248032932' },
  { name: 'بركان عبدالرحيم', massar: 'A248038737' },
  { name: 'حمداني إسحاق', massar: 'A248043648' },
  { name: 'السمسار هبة', massar: 'A248065141' },
  { name: 'خربوش أسماء', massar: 'A249022224' },
  { name: 'العسري يسرى', massar: 'A249045252' },
];

function normalize(s) {
    if (!s) return '';
    return s.toString().trim()
        .replace(/[إأآا]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .replace(/[\u064B-\u065F]/g, '')
        .replace(/\bال/g, '')
        .replace(/\bل/g, '')
        .replace(/\s+/g, ' ');
}

function getTokens(s) {
    return normalize(s).split(' ').filter(w => w.length > 0).sort().join(' ');
}

function isMatch(name1, name2) {
    if (!name1 || !name2) return false;
    const n1 = normalize(name1);
    const n2 = normalize(name2);
    if (n1 === n2) return true;
    if (getTokens(name1) === getTokens(name2)) return true;
    
    // Check if tokens contain each other
    const t1 = n1.split(' ').filter(w => w.length > 1);
    const t2 = n2.split(' ').filter(w => w.length > 1);
    const common = t1.filter(w => t2.includes(w)).length;
    if (common >= 2 && common === Math.min(t1.length, t2.length)) return true;
    return false;
}

async function auditAndUpdate() {
    const uid = await callOdoo('common', 'login', [ODOO_DB, ADMIN_USER, ADMIN_PASS]);
    const students = await callOdoo('object', 'execute_kw', [
        ODOO_DB, uid, ADMIN_PASS, 'school.student', 'search_read',
        [[['active', '=', true]]],
        { fields: ['id', 'name', 'massar_number', 'level_id', 'parent_id'] }
    ]);

    console.log(`Total active students in Odoo: ${students.length}`);
    console.log(`Auditing ${secondImageStudents.length} students from image 2...`);

    const results = [];

    for (const item of secondImageStudents) {
        // Find by massar first
        let matched = students.find(s => s.massar_number === item.massar);
        
        // If not, find by name
        if (!matched) {
            matched = students.find(s => isMatch(s.name, item.name));
        }

        if (matched) {
            let updated = false;
            if (matched.massar_number !== item.massar) {
                // Update Odoo
                await callOdoo('object', 'execute_kw', [
                    ODOO_DB, uid, ADMIN_PASS, 'school.student', 'write',
                    [[matched.id], { massar_number: item.massar }]
                ]);
                console.log(`🔄 Mis à jour ID ${matched.id} (${matched.name}) : ${matched.massar_number} -> ${item.massar}`);
                updated = true;
            }
            results.push({
                imageName: item.name,
                imageMassar: item.massar,
                odooId: matched.id,
                odooName: matched.name,
                oldMassar: matched.massar_number,
                newMassar: item.massar,
                level: matched.level_id ? matched.level_id[1] : '',
                parent: matched.parent_id ? matched.parent_id[1] : '',
                status: updated ? 'MIS_A_JOUR' : 'DEJA_CONFORME'
            });
        } else {
            console.log(`⚠️ INTROUVABLE DANS ODOO : ${item.name} (${item.massar})`);
            results.push({
                imageName: item.name,
                imageMassar: item.massar,
                status: 'NON_TROUVE'
            });
        }
    }

    console.log('\n--- RAPPORT FINAL ---');
    results.forEach((r, idx) => {
        if (r.status !== 'NON_TROUVE') {
            console.log(`${idx+1}. ${r.imageName} | Massar: ${r.imageMassar} | Odoo: [ID ${r.odooId}] "${r.odooName}" | ${r.level} | ${r.status}`);
        } else {
            console.log(`${idx+1}. ${r.imageName} | Massar: ${r.imageMassar} | INTROUVABLE`);
        }
    });
}

auditAndUpdate().catch(console.error);
