const path = require('path');
const http = require('http');
const xlsx = require('xlsx');
const axios = require('axios');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const ODOO_URL = (process.env.ODOO_URL || 'http://68.183.19.16:8069').replace(/\/+$/, '');
const ODOO_DB = process.env.ODOO_DB || 'alibdaealamia';
const ADMIN_USER = process.env.ODOO_ADMIN_USER || 'othmanbakkali@gmail.com';
const ADMIN_PASS = process.env.ODOO_ADMIN_PASS || 'Admin@2026';

const excelPath = 'C:\\Users\\othma\\OneDrive\\Bureau\\Ecole\\fiche de paie\\IBDAE paiement 21-09-26.xlsx';

const httpAgent = new http.Agent({ keepAlive: false });

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const callOdoo = async (service, method, args, kwargs = {}, retries = 3) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await axios.post(`${ODOO_URL}/jsonrpc`, {
                jsonrpc: '2.0',
                method: 'call',
                params: { service, method, args, kwargs },
                id: Math.floor(Math.random() * 100000)
            }, {
                httpAgent,
                timeout: 30000
            });
            if (response.data.error) {
                throw new Error(JSON.stringify(response.data.error));
            }
            return response.data.result;
        } catch (err) {
            console.warn(`[Odoo Call Attempt ${attempt}/${retries} failed]: ${err.message}`);
            if (attempt === retries) throw err;
            await sleep(1500 * attempt);
        }
    }
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

function parseExcelDate(serial) {
    if (!serial) return '2026-09-01';
    if (typeof serial === 'number') {
        const d = new Date(Math.round((serial - 25569) * 86400 * 1000));
        if (!isNaN(d.getTime())) {
            return d.toISOString().split('T')[0];
        }
    }
    if (typeof serial === 'string' && serial.trim()) {
        const parts = serial.trim().split(/[-/.]/);
        if (parts.length === 3) {
            if (parts[0].length === 4) {
                return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
            } else if (parts[2].length === 4) {
                return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
        }
    }
    return '2026-09-01';
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

const TUITION_MONTHS = ['09', '10', '11', '12', '01', '02', '03', '04', '05', '06'];

async function run() {
    console.log('Authenticating with Odoo...');
    const uid = await callOdoo('common', 'authenticate', [ODOO_DB, ADMIN_USER, ADMIN_PASS, {}]);
    console.log('Authenticated UID:', uid);

    // 1. Fetch all Odoo students
    let odooStudents = await callOdoo('object', 'execute_kw', [
        ODOO_DB, uid, ADMIN_PASS, 'school.student', 'search_read',
        [[]],
        { fields: ['id', 'name', 'full_name', 'massar_number', 'level_id'] }
    ]);
    console.log(`Loaded ${odooStudents.length} students from Odoo.`);

    // 2. Read Excel
    const wb = xlsx.readFile(excelPath);
    const parsedStudents = [];

    for (const [sName, levelId] of Object.entries(SHEET_LEVELS)) {
        const ws = wb.Sheets[sName];
        if (!ws) {
            console.warn(`Sheet not found: ${sName}`);
            continue;
        }
        const rows = xlsx.utils.sheet_to_json(ws, { header: 1 });
        for (let r = 3; r < rows.length; r++) {
            const row = rows[r];
            if (!row || !row[2]) continue;

            const massar = row[1] ? String(row[1]).trim().toUpperCase() : '';
            const rawName = String(row[2]).trim();
            const normName = normalizeArabic(rawName);
            const parentName = row[4] ? String(row[4]).trim() : '';
            const phone = row[5] ? String(row[5]).trim() : '';
            const regDateRaw = row[6];
            const monthlyFee = parseFloat(row[7]) || 0;
            const regFee = parseFloat(row[8]) || 0;
            const regReceipt = row[9] ? String(row[9]).trim() : '';
            const sepFee = parseFloat(row[10]) || 0;
            const sepReceipt = row[11] ? String(row[11]).trim() : '';

            parsedStudents.push({
                sheet: sName,
                levelId,
                rawName,
                normName,
                massar,
                parentName,
                phone,
                regDate: parseExcelDate(regDateRaw),
                monthlyFee,
                regFee,
                regReceipt,
                sepFee,
                sepReceipt
            });
        }
    }

    console.log(`Parsed ${parsedStudents.length} students from Excel file.`);

    // 3. Ensure any missing students are created in Odoo first
    for (const s of parsedStudents) {
        let match = null;
        if (MANUAL_MAP[s.rawName]) {
            match = odooStudents.find(o => o.id === MANUAL_MAP[s.rawName]);
        }
        if (!match && s.massar) {
            match = odooStudents.find(o => o.massar_number && o.massar_number.trim().toUpperCase() === s.massar);
        }
        if (!match) {
            match = odooStudents.find(o => normalizeArabic(o.name) === s.normName || normalizeArabic(o.full_name) === s.normName);
        }
        if (!match) {
            const normWords = s.normName.split(' ');
            match = odooStudents.find(o => {
                const oName = normalizeArabic(o.name);
                const oFull = normalizeArabic(o.full_name);
                return normWords.length >= 2 && (normWords.every(w => oName.includes(w)) || normWords.every(w => oFull.includes(w)));
            });
        }

        if (!match) {
            console.log(`Creating missing student: ${s.rawName} (${s.sheet}, Level ${s.levelId})`);
            const studentId = await callOdoo('object', 'execute_kw', [
                ODOO_DB, uid, ADMIN_PASS, 'school.student', 'create',
                [{
                    name: s.rawName,
                    full_name: s.rawName,
                    massar_number: s.massar || false,
                    level_id: s.levelId,
                    year_id: 2,
                    active: true
                }]
            ]);
            const newStu = {
                id: studentId,
                name: s.rawName,
                full_name: s.rawName,
                massar_number: s.massar,
                level_id: [s.levelId]
            };
            odooStudents.push(newStu);
            s.odooId = studentId;

            // Create initial 11 payments
            await callOdoo('object', 'execute_kw', [
                ODOO_DB, uid, ADMIN_PASS, 'school.payment', 'create',
                [{
                    student_id: studentId,
                    level_id: s.levelId,
                    year_id: 2,
                    payment_type: 'registration',
                    month: '09',
                    amount: s.regFee > 0 ? s.regFee : (s.monthlyFee || 800),
                    state: (s.regReceipt || s.regFee > 0) ? 'paid' : 'unpaid',
                    date: s.regDate
                }]
            ]);

            for (const m of TUITION_MONTHS) {
                const isSep = m === '09';
                const isSepPaid = isSep && Boolean(s.sepReceipt || s.sepFee > 0);
                await callOdoo('object', 'execute_kw', [
                    ODOO_DB, uid, ADMIN_PASS, 'school.payment', 'create',
                    [{
                        student_id: studentId,
                        level_id: s.levelId,
                        year_id: 2,
                        payment_type: 'tuition',
                        month: m,
                        amount: isSep ? (s.sepFee > 0 ? s.sepFee : (s.monthlyFee || 800)) : (s.monthlyFee || 800),
                        state: isSepPaid ? 'paid' : 'unpaid',
                        date: isSepPaid ? '2026-09-21' : '2026-09-29'
                    }]
                ]);
            }
            console.log(`Created 11 payment records for student ID ${studentId} (${s.rawName})`);
        } else {
            s.odooId = match.id;
        }
    }

    // 4. Fetch all payments in Odoo fresh
    const allPayments = await callOdoo('object', 'execute_kw', [
        ODOO_DB, uid, ADMIN_PASS, 'school.payment', 'search_read',
        [[['year_id', '=', 2]]],
        { fields: ['id', 'student_id', 'payment_type', 'month', 'amount', 'state', 'date', 'level_id'] }
    ]);
    console.log(`Loaded ${allPayments.length} payment records from Odoo.`);

    const studentPaymentsMap = new Map();
    for (const p of allPayments) {
        const sId = Array.isArray(p.student_id) ? p.student_id[0] : p.student_id;
        if (!studentPaymentsMap.has(sId)) {
            studentPaymentsMap.set(sId, []);
        }
        studentPaymentsMap.get(sId).push(p);
    }

    // 5. Build Batch Updates map: JSON.stringify(payload) -> [id1, id2, ...]
    const batchUpdates = new Map();

    const addToBatch = (id, payload) => {
        const key = JSON.stringify(payload);
        if (!batchUpdates.has(key)) {
            batchUpdates.set(key, { payload, ids: [] });
        }
        batchUpdates.get(key).ids.push(id);
    };

    let totalRegPaid = 0;
    let totalSepPaid = 0;

    for (const s of parsedStudents) {
        const studentPayments = studentPaymentsMap.get(s.odooId) || [];

        // Registration payment
        const regPay = studentPayments.find(p => p.payment_type === 'registration');
        const regIsPaid = Boolean(s.regReceipt || s.regFee > 0);
        const regAmount = s.regFee > 0 ? s.regFee : (s.monthlyFee > 0 ? s.monthlyFee : 800);
        const regState = regIsPaid ? 'paid' : 'unpaid';
        const regDate = s.regDate;

        if (regIsPaid) totalRegPaid++;

        if (regPay) {
            const needsUpdate = regPay.amount !== regAmount || regPay.state !== regState || regPay.date !== regDate;
            if (needsUpdate) {
                addToBatch(regPay.id, {
                    amount: regAmount,
                    state: regState,
                    date: regDate
                });
            }
        }

        // September tuition payment
        const sepPay = studentPayments.find(p => p.payment_type === 'tuition' && p.month === '09');
        const sepIsPaid = Boolean(s.sepReceipt || s.sepFee > 0);
        const sepAmount = s.sepFee > 0 ? s.sepFee : (s.monthlyFee > 0 ? s.monthlyFee : 800);
        const sepState = sepIsPaid ? 'paid' : 'unpaid';
        const sepDate = '2026-09-21';

        if (sepIsPaid) totalSepPaid++;

        if (sepPay) {
            const targetDate = sepIsPaid ? sepDate : (sepPay.date || '2026-09-29');
            const needsUpdate = sepPay.amount !== sepAmount || sepPay.state !== sepState || (sepIsPaid && sepPay.date !== sepDate);
            if (needsUpdate) {
                addToBatch(sepPay.id, {
                    amount: sepAmount,
                    state: sepState,
                    date: targetDate
                });
            }
        }

        // Other months (10..06)
        if (s.monthlyFee > 0) {
            for (const m of ['10', '11', '12', '01', '02', '03', '04', '05', '06']) {
                const mPay = studentPayments.find(p => p.payment_type === 'tuition' && p.month === m);
                if (mPay && mPay.amount !== s.monthlyFee) {
                    addToBatch(mPay.id, { amount: s.monthlyFee });
                }
            }
        }
    }

    console.log(`Prepared ${batchUpdates.size} distinct batch write operations.`);
    let totalUpdatedRecords = 0;

    let batchIdx = 0;
    for (const [key, { payload, ids }] of batchUpdates.entries()) {
        batchIdx++;
        console.log(`[Batch ${batchIdx}/${batchUpdates.size}] Writing to ${ids.length} records:`, payload);
        // Split into chunks of 100 IDs to be safe
        const CHUNK_SIZE = 100;
        for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
            const chunk = ids.slice(i, i + CHUNK_SIZE);
            await callOdoo('object', 'execute_kw', [
                ODOO_DB, uid, ADMIN_PASS, 'school.payment', 'write',
                [chunk, payload]
            ]);
            totalUpdatedRecords += chunk.length;
            await sleep(200);
        }
    }

    console.log('\n================ SYNC FINISHED SUCCESSFULLY ================');
    console.log(`Total students in Excel: ${parsedStudents.length}`);
    console.log(`Registration fees marked as paid: ${totalRegPaid} / ${parsedStudents.length}`);
    console.log(`September tuition marked as paid: ${totalSepPaid} / ${parsedStudents.length}`);
    console.log(`Total payment records updated across all months: ${totalUpdatedRecords}`);
    console.log('============================================================\n');
}

run().catch(err => {
    console.error('Fatal error during sync:', err);
    process.exit(1);
});
