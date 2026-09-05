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

async function checkStudent1Grades() {
    const adminUid = await callOdoo('common', 'login', [ODOO_DB, ADMIN_USER, ADMIN_PASS]);
    const grades = await callOdoo('object', 'execute_kw', [
        ODOO_DB, adminUid, ADMIN_PASS, 'school.grade', 'search_read',
        [[['student_id', '=', 1]]],
        { fields: ['id', 'subject_id', 'sub_subject_id', 'semester'] }
    ]);
    console.log(`Total grades for Student 1: ${grades.length}`);
    const semCounts = {};
    for (const g of grades) {
        const k = `${g.subject_id[1]} | ${g.sub_subject_id ? g.sub_subject_id[1] : 'NONE'} | ${g.semester}`;
        semCounts[k] = (semCounts[k] || 0) + 1;
    }
    console.log('Duplicates / counts:');
    for (const [k, count] of Object.entries(semCounts)) {
        if (count > 1) {
            console.log(`DUPLICATE (${count}x): ${k}`);
        }
    }
}

checkStudent1Grades();
