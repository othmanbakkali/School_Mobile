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
    if (response.data.error) {
        throw new Error(JSON.stringify(response.data.error));
    }
    return response.data.result;
};

async function fixEmptyYears() {
    const adminUid = await callOdoo('common', 'login', [ODOO_DB, ADMIN_USER, ADMIN_PASS]);
    console.log(`✅ Connecté en admin (UID: ${adminUid})`);

    // Obtenir l'année active
    const years = await callOdoo('object', 'execute_kw', [
        ODOO_DB, adminUid, ADMIN_PASS, 'school.year', 'search_read',
        [[['state', '=', 'open']]],
        { fields: ['id', 'name'], limit: 1 }
    ]);
    const currentYearId = years[0].id;
    console.log(`🎯 Année scolaire courante : ${years[0].name} (ID: ${currentYearId})`);

    const modelsToCheck = [
        'school.student',
        'school.grade',
        'school.grade.summary',
        'school.attendance',
        'school.homework',
        'school.payment',
        'school.cahier.transmission',
        'school.resources',
        'school.pedagogical.comment',
        'school.announcement',
        'school.wallet.transaction'
    ];

    for (const model of modelsToCheck) {
        try {
            const recordsWithoutYear = await callOdoo('object', 'execute_kw', [
                ODOO_DB, adminUid, ADMIN_PASS, model, 'search',
                [[['year_id', '=', false]]]
            ]);
            if (recordsWithoutYear.length > 0) {
                console.log(`Fixing ${recordsWithoutYear.length} records in ${model}...`);
                for (let i = 0; i < recordsWithoutYear.length; i += 500) {
                    const batch = recordsWithoutYear.slice(i, i + 500);
                    await callOdoo('object', 'execute_kw', [
                        ODOO_DB, adminUid, ADMIN_PASS, model, 'write',
                        [batch, { year_id: currentYearId }]
                    ]);
                }
                console.log(`  ✅ ${model} fixé avec succès.`);
            } else {
                console.log(`✅ ${model} : tous les enregistrements ont déjà une année scolaire.`);
            }
        } catch (e) {
            console.log(`⚠️ ${model} : ${e.message}`);
        }
    }
}

fixEmptyYears();
