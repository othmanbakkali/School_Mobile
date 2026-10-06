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

async function run() {
    const uid = await callOdoo('common', 'authenticate', [ODOO_DB, ADMIN_USER, ADMIN_PASS, {}]);
    console.log('Authenticated UID:', uid);

    // Get all students from Odoo
    const odooStudents = await callOdoo('object', 'execute_kw', [
        ODOO_DB, uid, ADMIN_PASS, 'school.student', 'search_read',
        [[]],
        { fields: ['id', 'name', 'massar_number', 'level_id'] }
    ]);
    console.log('Odoo students count:', odooStudents.length);

    // Read Excel
    const wb = xlsx.readFile(excelPath);
    const sheets = ['الاول 26-27', 'الثاني 26-27', 'الثالث 26-27', 'الرابع 26-27 ', 'الخامس 26-27', 'السادس 26-27'];
    
    let matchedCount = 0;
    let unmatched = [];
    const parsedStudents = [];

    for (const sName of sheets) {
        const ws = wb.Sheets[sName];
        if (!ws) continue;
        const rows = xlsx.utils.sheet_to_json(ws, { header: 1 });
        for (let r = 3; r < rows.length; r++) {
            const row = rows[r];
            if (!row || !row[2]) continue;

            const massar = row[1] ? String(row[1]).trim().toUpperCase() : '';
            const rawName = String(row[2]).trim();
            const normName = normalizeArabic(rawName);
            const monthlyFee = parseFloat(row[7]) || 0;
            const regFee = parseFloat(row[8]) || 0;
            const regReceipt = row[9] ? String(row[9]).trim() : '';
            const sepFee = parseFloat(row[10]) || 0;
            const sepReceipt = row[11] ? String(row[11]).trim() : '';
            const regDate = row[6];

            // Match with Odoo
            let match = null;
            if (massar) {
                match = odooStudents.find(s => s.massar_number && s.massar_number.trim().toUpperCase() === massar);
            }
            if (!match) {
                match = odooStudents.find(s => normalizeArabic(s.name) === normName);
            }
            if (!match) {
                // Try token inclusion
                const normWords = normName.split(' ');
                match = odooStudents.find(s => {
                    const sNorm = normalizeArabic(s.name);
                    return normWords.length >= 2 && normWords.every(w => sNorm.includes(w));
                });
            }

            if (match) {
                matchedCount++;
                parsedStudents.push({
                    sheet: sName,
                    odooId: match.id,
                    odooName: match.name,
                    excelName: rawName,
                    massar: massar || match.massar_number,
                    monthlyFee,
                    regFee,
                    regReceipt,
                    sepFee,
                    sepReceipt,
                    regDate
                });
            } else {
                unmatched.push({ sheet: sName, name: rawName, massar });
            }
        }
    }

    console.log(`Matched: ${matchedCount} / ${parsedStudents.length + unmatched.length}`);
    if (unmatched.length > 0) {
        console.log('Unmatched students:', unmatched);
    }
}

run().catch(console.error);
