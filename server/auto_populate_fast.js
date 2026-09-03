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

async function main() {
    try {
        const adminUid = await callOdoo('common', 'login', [ODOO_DB, ADMIN_USER, ADMIN_PASS]);
        console.log(`✅ Connecté en tant qu'admin (UID: ${adminUid})`);

        const subjects = await callOdoo('object', 'execute_kw', [
            ODOO_DB, adminUid, ADMIN_PASS, 'school.subject', 'search_read',
            [[]],
            { fields: ['id', 'name'] }
        ]);

        const students = await callOdoo('object', 'execute_kw', [
            ODOO_DB, adminUid, ADMIN_PASS, 'school.student', 'search_read',
            [[]],
            { fields: ['id', 'name', 'level_id'] }
        ]);

        const existingGrades = await callOdoo('object', 'execute_kw', [
            ODOO_DB, adminUid, ADMIN_PASS, 'school.grade', 'search_read',
            [[]],
            { fields: ['id', 'student_id', 'subject_id'] }
        ]);

        const existingSet = new Set();
        existingGrades.forEach(g => {
            const stId = g.student_id?.[0];
            const sbId = g.subject_id?.[0];
            if (stId && sbId) {
                existingSet.add(`${stId}_${sbId}`);
            }
        });

        const toCreate = [];
        for (const st of students) {
            for (const subj of subjects) {
                const key = `${st.id}_${subj.id}`;
                if (!existingSet.has(key)) {
                    toCreate.push({
                        student_id: st.id,
                        subject_id: subj.id,
                        subject: subj.name,
                        semester: 'S1',
                        cc1: 0.0,
                        cc2: 0.0,
                        oral_mark: 0.0,
                        mid_term_mark: 0.0,
                        final_mark: 0.0
                    });
                }
            }
        }

        console.log(`🚀 Insertion par lots de ${toCreate.length} lignes de matières...`);

        // Batch insert par paquets de 100
        const batchSize = 100;
        for (let i = 0; i < toCreate.length; i += batchSize) {
            const batch = toCreate.slice(i, i + batchSize);
            await callOdoo('object', 'execute_kw', [
                ODOO_DB, adminUid, ADMIN_PASS, 'school.grade', 'create',
                [batch]
            ]);
            console.log(`  ✓ Lot ${i + 1} à ${Math.min(i + batchSize, toCreate.length)} inséré`);
        }

        console.log(`\n🎉 TERMINÉ : Tous les élèves ont leurs matières complètes affichées dans l'onglet Notes !`);

    } catch (e) {
        console.error('Erreur:', e.message);
    }
}

main();
