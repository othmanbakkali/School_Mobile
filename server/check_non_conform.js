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

async function checkNonConform() {
    const uid = await callOdoo('common', 'login', [ODOO_DB, ADMIN_USER, ADMIN_PASS]);
    const students = await callOdoo('object', 'execute_kw', [
        ODOO_DB, uid, ADMIN_PASS, 'school.student', 'search_read',
        [[['active', '=', true]]],
        { fields: ['id', 'name', 'massar_number', 'level_id'] }
    ]);
    
    const fake = students.filter(s => !s.massar_number || s.massar_number.startsWith('A260000'));
    const real = students.filter(s => s.massar_number && !s.massar_number.startsWith('A260000'));
    console.log('Total students:', students.length);
    console.log('Real official Massar:', real.length);
    console.log('Synthetic A260000XXX:', fake.length);
    console.log('\n--- LIST OF NON-CONFORMING STUDENTS BY LEVEL ---');
    const byLevel = {};
    fake.forEach(s => {
        const lvl = s.level_id ? s.level_id[1] : 'Sans niveau';
        if (!byLevel[lvl]) byLevel[lvl] = [];
        byLevel[lvl].push(s);
    });
    for (const lvl of Object.keys(byLevel)) {
        console.log(`\n=== Niveau: ${lvl} (${byLevel[lvl].length} élèves) ===`);
        byLevel[lvl].forEach(s => {
            console.log(`  [ID ${s.id}] ${s.name} : ${s.massar_number}`);
        });
    }
}
checkNonConform().catch(console.error);
