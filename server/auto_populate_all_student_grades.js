const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const rawOdooUrl = process.env.ODOO_URL || 'http://68.183.19.16:8069';
const ODOO_URL = rawOdooUrl.replace(/\/+$/, '');
const ODOO_DB = process.env.ODOO_DB || 'alibdaealamia';
const ADMIN_USER = process.env.ODOO_ADMIN_USER || 'othmanbakkali@gmail.com';
const ADMIN_PASS = process.env.ODOO_ADMIN_PASS || 'Admin@2026';

console.log(`🔌 Connexion à Odoo sur ${ODOO_URL} (Base: ${ODOO_DB})...`);

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
        if (!adminUid) {
            console.error('❌ Échec login Odoo.');
            return;
        }
        console.log(`✅ Connecté en tant qu'admin (UID: ${adminUid})`);

        // 1. Récupérer toutes les matières
        const subjects = await callOdoo('object', 'execute_kw', [
            ODOO_DB, adminUid, ADMIN_PASS, 'school.subject', 'search_read',
            [[]],
            { fields: ['id', 'name'] }
        ]);
        console.log(`📚 ${subjects.length} matières trouvées dans Odoo`);

        // 2. Récupérer toutes les classes
        const levels = await callOdoo('object', 'execute_kw', [
            ODOO_DB, adminUid, ADMIN_PASS, 'school.level', 'search_read',
            [[]],
            { fields: ['id', 'name'] }
        ]);
        console.log(`🏫 ${levels.length} classes / niveaux trouvés`);

        // 3. Récupérer tous les élèves
        const students = await callOdoo('object', 'execute_kw', [
            ODOO_DB, adminUid, ADMIN_PASS, 'school.student', 'search_read',
            [[]],
            { fields: ['id', 'name', 'level_id'] }
        ]);
        console.log(`🎓 ${students.length} élèves trouvés dans la base`);

        // 4. Pour chaque élève, vérifier et pré-remplir les matières dans school.grade
        console.log('\n--- Pré-remplissage des matières pour chaque élève ---');
        let totalCreatedLines = 0;

        for (const st of students) {
            // Récupérer les notes existantes de l'élève
            const existingGrades = await callOdoo('object', 'execute_kw', [
                ODOO_DB, adminUid, ADMIN_PASS, 'school.grade', 'search_read',
                [[['student_id', '=', st.id]]],
                { fields: ['id', 'subject_id', 'subject'] }
            ]);

            const existingSubjectIds = existingGrades.map(g => g.subject_id?.[0]).filter(Boolean);

            for (const subj of subjects) {
                if (!existingSubjectIds.includes(subj.id)) {
                    await callOdoo('object', 'execute_kw', [
                        ODOO_DB, adminUid, ADMIN_PASS, 'school.grade', 'create',
                        [{
                            student_id: st.id,
                            subject_id: subj.id,
                            subject: subj.name,
                            semester: 'S1',
                            cc1: 0.0,
                            cc2: 0.0,
                            oral_mark: 0.0,
                            mid_term_mark: 0.0,
                            final_mark: 0.0
                        }]
                    ]);
                    totalCreatedLines++;
                }
            }
        }

        console.log(`\n🎉 SUCCÈS : ${totalCreatedLines} lignes de matières créées pour les élèves !`);
        console.log(`Désormais, chaque élève a toutes ses matières automatiquement listées dans l'onglet Notes.`);

    } catch (err) {
        console.error('❌ Erreur :', err.message);
    }
}

main();
