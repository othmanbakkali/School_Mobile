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

async function fixGradeLevelsAndYears() {
    const adminUid = await callOdoo('common', 'login', [ODOO_DB, ADMIN_USER, ADMIN_PASS]);
    console.log(`✅ Connecté en admin (UID: ${adminUid})`);

    // 1. Lire tous les élèves avec leur level_id et year_id
    const students = await callOdoo('object', 'execute_kw', [
        ODOO_DB, adminUid, ADMIN_PASS, 'school.student', 'search_read',
        [[]],
        { fields: ['id', 'name', 'level_id', 'year_id'] }
    ]);
    console.log(`Total élèves: ${students.length}`);

    const studentMap = {};
    for (const s of students) {
        studentMap[s.id] = {
            level_id: s.level_id ? s.level_id[0] : false,
            year_id: s.year_id ? s.year_id[0] : false
        };
    }

    // 2. Lire les notes avec level_id = false
    const gradesWithoutLevel = await callOdoo('object', 'execute_kw', [
        ODOO_DB, adminUid, ADMIN_PASS, 'school.grade', 'search_read',
        [[['level_id', '=', false]]],
        { fields: ['id', 'student_id'] }
    ]);
    console.log(`Notes avec level_id manquant: ${gradesWithoutLevel.length}`);

    // Grouper par level_id pour faire des writes par lot
    const byLevel = {};
    for (const g of gradesWithoutLevel) {
        const stId = g.student_id ? g.student_id[0] : false;
        if (stId && studentMap[stId] && studentMap[stId].level_id) {
            const lvl = studentMap[stId].level_id;
            if (!byLevel[lvl]) byLevel[lvl] = [];
            byLevel[lvl].push(g.id);
        }
    }

    for (const [lvlId, ids] of Object.entries(byLevel)) {
        console.log(`Mise à jour de ${ids.length} notes avec level_id = ${lvlId}...`);
        for (let i = 0; i < ids.length; i += 500) {
            const batch = ids.slice(i, i + 500);
            await callOdoo('object', 'execute_kw', [
                ODOO_DB, adminUid, ADMIN_PASS, 'school.grade', 'write',
                [batch, { level_id: parseInt(lvlId) }]
            ]);
        }
    }

    // 3. Vérifier le résultat
    const remainingEmpty = await callOdoo('object', 'execute_kw', [
        ODOO_DB, adminUid, ADMIN_PASS, 'school.grade', 'search_count',
        [[['level_id', '=', false]]]
    ]);
    console.log(`✅ Notes avec level_id manquant après correction: ${remainingEmpty}`);

    // Afficher un exemple de 5 notes
    const sample = await callOdoo('object', 'execute_kw', [
        ODOO_DB, adminUid, ADMIN_PASS, 'school.grade', 'search_read',
        [[]],
        { fields: ['id', 'student_id', 'level_id', 'year_id', 'subject_id', 'sub_subject_id'], limit: 5 }
    ]);
    console.table(sample.map(g => ({
        id: g.id,
        eleve: g.student_id[1],
        niveau: g.level_id ? g.level_id[1] : 'VIDE',
        annee: g.year_id ? g.year_id[1] : 'VIDE',
        matiere: g.subject_id[1],
        sous_matiere: g.sub_subject_id ? g.sub_subject_id[1] : 'VIDE'
    })));
}

fixGradeLevelsAndYears();
