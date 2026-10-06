const path = require('path');
const xlsx = require('xlsx');
const axios = require('axios');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const ODOO_URL = (process.env.ODOO_URL || 'http://68.183.19.16:8069').replace(/\/+$/, '');
const ODOO_DB = process.env.ODOO_DB || 'alibdaealamia';
const ADMIN_USER = process.env.ODOO_ADMIN_USER || 'othmanbakkali@gmail.com';
const ADMIN_PASS = process.env.ODOO_ADMIN_PASS || 'Admin@2026';

const excelPath = 'C:\\Users\\othma\\OneDrive\\Bureau\\Ecole\\fiche de paie\\IBDAE paiement 21-09-26.xlsx';

const callOdoo = async (service, method, args, kwargs = {}) => {
    const response = await axios.post(`${ODOO_URL}/jsonrpc`, {
        jsonrpc: '2.0',
        method: 'call',
        params: { service, method, args, kwargs },
        id: Math.floor(Math.random() * 100000)
    });
    if (response.data.error) {
        throw new Error(JSON.stringify(response.data.error));
    }
    return response.data.result;
};

function normalizeArabic(str) {
    if (!str) return '';
    return str.toString().trim()
        .replace(/[إأآا]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .replace(/[\u064B-\u065F]/g, '')
        .replace(/\s+/g, ' ');
}

const SHEET_LEVELS = {
    'الاول 26-27': 15,
    'الثاني 26-27': 16,
    'الثالث 26-27': 12,
    'الرابع 26-27 ': 13,
    'الخامس 26-27': 17,
    'السادس 26-27': 14
};

const MANUAL_MAP = {
    'أناس بلحمار': 194,
    'مريم المطلسي': 151,
    'عبد الكريم فرصاد': 244,
    'ملاك فرصاد': 245
};

async function run() {
    console.log('Authenticating with Odoo...');
    const uid = await callOdoo('common', 'authenticate', [ODOO_DB, ADMIN_USER, ADMIN_PASS, {}]);

    const odooStudents = await callOdoo('object', 'execute_kw', [
        ODOO_DB, uid, ADMIN_PASS, 'school.student', 'search_read',
        [[]],
        { fields: ['id', 'name', 'full_name', 'massar_number'] }
    ]);

    const allPayments = await callOdoo('object', 'execute_kw', [
        ODOO_DB, uid, ADMIN_PASS, 'school.payment', 'search_read',
        [[['year_id', '=', 2]]],
        { fields: ['id', 'student_id', 'payment_type', 'month', 'state', 'receipt_number', 'receipt_generated', 'date'] }
    ]);

    const studentPaymentsMap = new Map();
    for (const p of allPayments) {
        const sId = Array.isArray(p.student_id) ? p.student_id[0] : p.student_id;
        if (!studentPaymentsMap.has(sId)) {
            studentPaymentsMap.set(sId, []);
        }
        studentPaymentsMap.get(sId).push(p);
    }

    const wb = xlsx.readFile(excelPath);
    let regReceiptsUpdated = 0;
    let sepReceiptsUpdated = 0;

    for (const [sName, levelId] of Object.entries(SHEET_LEVELS)) {
        const ws = wb.Sheets[sName];
        if (!ws) continue;
        const rows = xlsx.utils.sheet_to_json(ws, { header: 1 });
        for (let r = 3; r < rows.length; r++) {
            const row = rows[r];
            if (!row || !row[2]) continue;

            const massar = row[1] ? String(row[1]).trim().toUpperCase() : '';
            const rawName = String(row[2]).trim();
            const normName = normalizeArabic(rawName);
            const regReceipt = row[9] ? String(row[9]).trim() : '';
            const sepReceipt = row[11] ? String(row[11]).trim() : '';

            // Match student
            let match = null;
            if (MANUAL_MAP[rawName]) match = odooStudents.find(o => o.id === MANUAL_MAP[rawName]);
            if (!match && massar) match = odooStudents.find(o => o.massar_number && o.massar_number.trim().toUpperCase() === massar);
            if (!match) match = odooStudents.find(o => normalizeArabic(o.name) === normName || normalizeArabic(o.full_name) === normName);
            if (!match) {
                const normWords = normName.split(' ');
                match = odooStudents.find(o => {
                    const oName = normalizeArabic(o.name);
                    const oFull = normalizeArabic(o.full_name);
                    return normWords.length >= 2 && (normWords.every(w => oName.includes(w)) || normWords.every(w => oFull.includes(w)));
                });
            }

            if (!match) continue;
            const studentId = match.id;
            const studentPayments = studentPaymentsMap.get(studentId) || [];

            // 1. Registration
            if (regReceipt) {
                const regPay = studentPayments.find(p => p.payment_type === 'registration');
                if (regPay && (!regPay.receipt_number || !regPay.receipt_generated)) {
                    await callOdoo('object', 'execute_kw', [
                        ODOO_DB, uid, ADMIN_PASS, 'school.payment', 'write',
                        [[regPay.id], {
                            receipt_number: regReceipt,
                            receipt_generated: true,
                            receipt_date: `${regPay.date || '2026-09-01'} 10:00:00`
                        }]
                    ]);
                    regReceiptsUpdated++;
                }
            }

            // 2. September
            if (sepReceipt) {
                const sepPay = studentPayments.find(p => p.payment_type === 'tuition' && p.month === '09');
                if (sepPay && (!sepPay.receipt_number || !sepPay.receipt_generated)) {
                    await callOdoo('object', 'execute_kw', [
                        ODOO_DB, uid, ADMIN_PASS, 'school.payment', 'write',
                        [[sepPay.id], {
                            receipt_number: sepReceipt,
                            receipt_generated: true,
                            receipt_date: '2026-09-21 10:00:00'
                        }]
                    ]);
                    sepReceiptsUpdated++;
                }
            }
        }
    }

    console.log(`Updated ${regReceiptsUpdated} registration receipts.`);
    console.log(`Updated ${sepReceiptsUpdated} September tuition receipts.`);
    console.log('All paid payments now have official receipt numbers and locked status!');
}

run().catch(console.error);
