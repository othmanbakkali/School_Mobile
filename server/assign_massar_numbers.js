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
        id: Math.floor(Math.random() * 100000)
    });
    if (response.data.error) {
        throw new Error(JSON.stringify(response.data.error));
    }
    return response.data.result;
};

async function assignMassarNumbers() {
    console.log('🚀 ATTRIBUTION DES NUMÉROS MASSAR AUX ÉLÈVES...');
    const uid = await callOdoo('common', 'login', [ODOO_DB, ADMIN_USER, ADMIN_PASS]);
    console.log(`✅ Connecté à Odoo (UID: ${uid})`);

    const students = await callOdoo('object', 'execute_kw', [
        ODOO_DB, uid, ADMIN_PASS, 'school.student', 'search_read',
        [[['active', '=', true]]],
        { fields: ['id', 'name', 'massar_number', 'level_id'] }
    ]);

    // Collect all existing Massar numbers to prevent any collision
    const existingMassarSet = new Set();
    students.forEach(s => {
        if (s.massar_number && s.massar_number.length > 2) {
            existingMassarSet.add(s.massar_number.trim());
        }
    });
    console.log(`Nombre de codes Massar déjà existants : ${existingMassarSet.size}`);

    const withoutMassar = students.filter(s => !s.massar_number || s.massar_number.length <= 2);
    console.log(`Nombre d'élèves sans code Massar à traiter : ${withoutMassar.length}\n`);

    // Level prefix mapping
    const levelPrefixMap = {
        '1': 'A260',
        '2': 'A250',
        '3': 'A240',
        '4': 'A230',
        '5': 'A220',
        '6': 'A210',
    };

    let assignedCount = 0;

    for (const student of withoutMassar) {
        const lvlName = student.level_id ? student.level_id[1] : '';
        let prefix = 'A260';
        for (const [k, p] of Object.entries(levelPrefixMap)) {
            if (lvlName.includes(k) || (k === '1' && lvlName.includes('الاول')) ||
                (k === '2' && lvlName.includes('الثاني')) || (k === '3' && lvlName.includes('الثالث')) ||
                (k === '4' && lvlName.includes('الرابع')) || (k === '5' && lvlName.includes('الخامس')) ||
                (k === '6' && lvlName.includes('السادس'))) {
                prefix = p;
                break;
            }
        }

        // Generate unique 10-char massar code: prefix (4 chars) + 6 digits
        let seq = student.id;
        let massarCode = `${prefix}${String(seq).padStart(6, '0')}`;
        
        let counter = 1;
        while (existingMassarSet.has(massarCode)) {
            massarCode = `${prefix}${String(seq * 10 + counter).padStart(6, '0')}`;
            counter++;
        }

        existingMassarSet.add(massarCode);

        await callOdoo('object', 'execute_kw', [
            ODOO_DB, uid, ADMIN_PASS, 'school.student', 'write',
            [[student.id], { massar_number: massarCode }]
        ]);

        assignedCount++;
        console.log(`✓ [ID ${student.id}] "${student.name}" (${lvlName || 'Sans niveau'}) -> Code Massar attribué : ${massarCode}`);
    }

    console.log('\n======================================================');
    console.log('🎉 ATTRIBUTION DES CODES MASSAR TERMINÉE 🎉');
    console.log(`- Total élèves traités : ${assignedCount}`);
    console.log(`- Total élèves avec code Massar désormais : ${existingMassarSet.size} / ${students.length}`);
    console.log('======================================================\n');
}

assignMassarNumbers().catch(console.error);
