const axios = require('axios');
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
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

// 1. Read ALL Massar records from ALL Excel files
const dir = 'C:\\Users\\othma\\OneDrive\\Bureau\\alibdaealamia';
const excelFiles = fs.readdirSync(dir).filter(f => f.endsWith('.xlsx') && !f.startsWith('~') && !f.includes('élèves') && !f.includes('Ã©lÃ©ves'));

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

function matchNames(n1, n2) {
    if (!n1 || !n2) return false;
    if (normalize(n1) === normalize(n2)) return true;
    if (getTokens(n1) === getTokens(n2)) return true;
    const t1 = normalize(n1).split(' ').filter(w => w.length > 1);
    const t2 = normalize(n2).split(' ').filter(w => w.length > 1);
    const common = t1.filter(w => t2.includes(w)).length;
    return common >= 2 && common === Math.min(t1.length, t2.length);
}

const officialRecords = [];

excelFiles.forEach(file => {
    const wb = xlsx.readFile(path.join(dir, file));
    wb.SheetNames.forEach(sName => {
        const sheet = wb.Sheets[sName];
        const data = xlsx.utils.sheet_to_json(sheet, {header: 1});
        data.forEach(row => {
            let code = null;
            let name = null;
            row.forEach(cell => {
                if (typeof cell === 'string') {
                    const t = cell.trim();
                    if (/^[A-Za-z]\d{8,10}$/.test(t)) {
                        code = t.toUpperCase();
                    } else if (cell && /[\u0600-\u06FF]/.test(cell) && cell.length > 3 && 
                               !cell.includes('المستوى') && !cell.includes('الدورة') && 
                               !cell.includes('مؤسسة') && !cell.includes('مادة') && !cell.includes('الامتحان')) {
                        name = cell.trim();
                    }
                }
            });
            if (code && name) {
                officialRecords.push({ file, name, code });
            }
        });
    });
});

async function fullAudit() {
    const uid = await callOdoo('common', 'login', [ODOO_DB, ADMIN_USER, ADMIN_PASS]);
    const students = await callOdoo('object', 'execute_kw', [
        ODOO_DB, uid, ADMIN_PASS, 'school.student', 'search_read',
        [[['active', '=', true]]],
        { fields: ['id', 'name', 'massar_number', 'level_id', 'parent_id'] }
    ]);

    console.log(`=== AUDIT GLOBAL DES 161 ÉLÈVES ===`);
    let totalUpdated = 0;
    const errors = [];
    const synthetic = [];
    const valid = [];

    for (const st of students) {
        // Find if this student has an official record in any Excel
        const match = officialRecords.find(rec => matchNames(st.name, rec.name));
        if (match) {
            if (st.massar_number !== match.code) {
                console.log(`[MISMATCH] ID ${st.id} "${st.name}": Odoo a "${st.massar_number}" mais Excel a "${match.code}" (depuis ${match.file})`);
                await callOdoo('object', 'execute_kw', [
                    ODOO_DB, uid, ADMIN_PASS, 'school.student', 'write',
                    [[st.id], { massar_number: match.code }]
                ]);
                totalUpdated++;
            } else {
                valid.push(st);
            }
        } else {
            if (st.massar_number && st.massar_number.startsWith('A260000')) {
                synthetic.push(st);
            } else if (!st.massar_number) {
                errors.push(st);
            } else {
                valid.push(st);
            }
        }
    }

    console.log(`\nBilan de l'audit:`);
    console.log(`- Mis à jour : ${totalUpdated}`);
    console.log(`- Valides conformes : ${valid.length}`);
    console.log(`- Sans code Massar : ${errors.length}`);
    console.log(`- Codes synthétiques A260000XXX (non présents dans les exports Massar) : ${synthetic.length}`);
}

fullAudit().catch(console.error);
