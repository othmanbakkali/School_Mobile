const axios = require('axios');
const path = require('path');
const xlsx = require('xlsx');
const fs = require('fs');
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

// Look at export_notesCC_1APG-1_0012.xlsx and export_notesCC_2APG-1_0012.xlsx
const dir = 'C:\\Users\\othma\\OneDrive\\Bureau\\alibdaealamia';

function inspectExcel(filename) {
    console.log(`\n=================== FILE: ${filename} ===================`);
    const wb = xlsx.readFile(path.join(dir, filename));
    wb.SheetNames.forEach(s => {
        console.log(`Sheet: ${s}`);
        const data = xlsx.utils.sheet_to_json(wb.Sheets[s], { header: 1 });
        data.slice(0, 35).forEach((row, i) => {
            const hasCode = row.some(c => typeof c === 'string' && /^[A-Z]\d{8,10}$/i.test(c.trim()));
            if (hasCode || i < 5) {
                console.log(`Row ${i}:`, row.filter(c => c !== null && c !== undefined && c !== ''));
            }
        });
    });
}

inspectExcel('export_notesCC_1APG-1_0012.xlsx');
inspectExcel('export_notesCC_2APG-1_0012.xlsx');
