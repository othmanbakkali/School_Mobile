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

async function printAllStudents() {
    const uid = await callOdoo('common', 'login', [ODOO_DB, ADMIN_USER, ADMIN_PASS]);
    const students = await callOdoo('object', 'execute_kw', [
        ODOO_DB, uid, ADMIN_PASS, 'school.student', 'search_read',
        [[['active', '=', true]]],
        { fields: ['id', 'name', 'massar_number', 'level_id', 'parent_id'] }
    ]);

    // Sort by level then name
    students.sort((a, b) => {
        const lA = a.level_id ? a.level_id[1] : '';
        const lB = b.level_id ? b.level_id[1] : '';
        if (lA !== lB) return lA.localeCompare(lB);
        return a.name.localeCompare(b.name);
    });

    console.log(`=== ALL ${students.length} STUDENTS IN ODOO ===`);
    students.forEach(s => {
        console.log(`[ID ${s.id}] Level: ${s.level_id ? s.level_id[1] : 'N/A'} | Name: "${s.name}" | Massar: ${s.massar_number} | Parent: ${s.parent_id ? s.parent_id[1] : 'NONE'}`);
    });
}

printAllStudents().catch(console.error);
