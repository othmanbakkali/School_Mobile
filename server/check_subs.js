const axios = require('axios');
const path = require('path');
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
    return response.data.result;
};

async function checkSubSubjects() {
    const adminUid = await callOdoo('common', 'login', [ODOO_DB, ADMIN_USER, ADMIN_PASS]);
    const subs = await callOdoo('object', 'execute_kw', [
        ODOO_DB, adminUid, ADMIN_PASS, 'school.sub.subject', 'search_read',
        [[]],
        { fields: ['id', 'name', 'subject_id'] }
    ]);
    console.log(`Total sub-subjects in DB: ${subs.length}`);
    const bySubject = {};
    for (const s of subs) {
        const sName = s.subject_id[1];
        if (!bySubject[sName]) bySubject[sName] = [];
        bySubject[sName].push({ id: s.id, name: s.name });
    }
    for (const [subj, list] of Object.entries(bySubject)) {
        console.log(`\n=== ${subj} (${list.length} sous-matières) ===`);
        list.forEach(item => console.log(`  - [ID: ${item.id}] ${item.name}`));
    }
}

checkSubSubjects();
