const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const dir = 'C:\\Users\\othma\\OneDrive\\Bureau\\alibdaealamia\\New';
const csvPath = path.join(dir, 'alibdaealamia_names_emails (1).csv');

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

async function main() {
    const adminUid = await callOdoo('common', 'login', [ODOO_DB, ADMIN_USER, ADMIN_PASS]);

    const parents = await callOdoo('object', 'execute_kw', [
        ODOO_DB, adminUid, ADMIN_PASS, 'school.parent', 'search_read',
        [[]],
        { fields: ['id', 'name', 'phone', 'email'], order: 'id asc' }
    ]);

    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const rows = csvContent.split('\n').filter(l => l.trim()).slice(1).map(l => {
        const parts = l.split(',');
        return { name: parts[0]?.trim(), email: parts[1]?.trim() };
    });

    console.log(`Parents in Odoo: ${parents.length}`);
    console.log(`Rows in CSV: ${rows.length}`);

    let perfectMatches = 0;
    for (let i = 0; i < parents.length; i++) {
        const p = parents[i];
        const r = rows[i];
        if (r && r.email) {
            perfectMatches++;
        } else {
            console.log(`Missing email for index ${i}: Parent ${p.id} ${p.name}`);
        }
    }
    console.log(`Total valid mappings: ${perfectMatches} / ${parents.length}`);
}

main();
