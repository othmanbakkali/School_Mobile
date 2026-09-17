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

async function verify() {
    const uid = await callOdoo('common', 'login', [ODOO_DB, ADMIN_USER, ADMIN_PASS]);
    console.log('Logged in as UID:', uid);

    const students = await callOdoo('object', 'execute_kw', [
        ODOO_DB, uid, ADMIN_PASS, 'school.student', 'search_read',
        [[['active', '=', true]]],
        { fields: ['id', 'name', 'parent_id', 'level_id', 'massar_number', 'average_grade'] }
    ]);

    const parents = await callOdoo('object', 'execute_kw', [
        ODOO_DB, uid, ADMIN_PASS, 'school.parent', 'search_read',
        [[]],
        { fields: ['id', 'name', 'phone', 'student_ids'] }
    ]);

    console.log(`\n=== VERIFICATION RESULTS ===`);
    console.log(`Total active students in Odoo: ${students.length}`);
    console.log(`Total parents in Odoo: ${parents.length}`);

    const withoutParent = students.filter(s => !s.parent_id);
    console.log(`Students without parent: ${withoutParent.length}`);

    const p1Students = students.filter(s => s.parent_id && s.parent_id[0] === 1);
    console.log(`Students assigned to Parent 1 (OTHMAN BAKKALI YEDRI): ${p1Students.length}`);
    p1Students.forEach(s => console.log(`  - [ID ${s.id}] ${s.name}`));

    // Check multi-child parents
    const multiParents = parents.filter(p => p.student_ids.length > 1);
    console.log(`\nParents with multiple children: ${multiParents.length}`);
    multiParents.forEach(p => {
        const childrenNames = students.filter(s => p.student_ids.includes(s.id)).map(s => s.name);
        console.log(`  - [ID ${p.id}] "${p.name}" (${p.phone || 'N/A'}) -> ${childrenNames.length} children: [${childrenNames.join(', ')}]`);
    });

    // Sample of 10 students
    console.log(`\n--- Sample of 15 Students & Parents ---`);
    students.slice(0, 15).forEach(s => {
        console.log(`[ID ${s.id}] "${s.name}" | Class: ${s.level_id ? s.level_id[1] : 'N/A'} | Massar: ${s.massar_number || 'N/A'} | Parent: ${s.parent_id ? s.parent_id[1] : 'NONE'}`);
    });
}

verify().catch(console.error);
