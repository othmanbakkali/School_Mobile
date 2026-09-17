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

async function run() {
    const uid = await callOdoo('common', 'login', [ODOO_DB, ADMIN_USER, ADMIN_PASS]);
    const levels = await callOdoo('object', 'execute_kw', [
        ODOO_DB, uid, ADMIN_PASS, 'school.level', 'search_read',
        [[]],
        { fields: ['id', 'name'] }
    ]);
    for (const lvl of levels) {
        const students = await callOdoo('object', 'execute_kw', [
            ODOO_DB, uid, ADMIN_PASS, 'school.student', 'search_read',
            [[['active', '=', true], ['level_id', '=', lvl.id]]],
            { fields: ['id', 'name', 'massar_number'] }
        ]);
        if (students.length > 0) {
            const real = students.filter(s => s.massar_number && !s.massar_number.startsWith('A260000'));
            const fake = students.filter(s => !s.massar_number || s.massar_number.startsWith('A260000'));
            console.log(`\n=== ${lvl.name} (${students.length} élèves) ===`);
            console.log(`    Conformes Massar: ${real.length} | Non-conformes (A260000XXX): ${fake.length}`);
            fake.slice(0, 5).forEach(s => console.log(`      Exemple non-conforme: ${s.name} -> ${s.massar_number}`));
        }
    }
}
run().catch(console.error);
