const axios = require('axios');
const ODOO_URL = 'http://68.183.19.16:8069';
const ODOO_DB = 'alibdaealamia';
const ADMIN_USER = 'othmanbakkali@gmail.com';
const ADMIN_PASS = 'Admin@2026';

async function run() {
    const resAuth = await axios.post(ODOO_URL + '/jsonrpc', {
        jsonrpc: '2.0', method: 'call',
        params: { service: 'common', method: 'authenticate', args: [ODOO_DB, ADMIN_USER, ADMIN_PASS, {}] }
    });
    const uid = resAuth.data.result;
    
    const fields = await axios.post(ODOO_URL + '/jsonrpc', {
        jsonrpc: '2.0', method: 'call',
        params: {
            service: 'object', method: 'execute_kw',
            args: [ODOO_DB, uid, ADMIN_PASS, 'school.payment', 'fields_get', [], { attributes: ['type', 'string'] }]
        }
    });
    const res = fields.data.result;
    for (const k of Object.keys(res)) {
        console.log(`${k} (${res[k].type}): ${res[k].string}`);
    }
}
run().catch(console.error);
