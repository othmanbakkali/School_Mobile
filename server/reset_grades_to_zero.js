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

async function resetGradesToZero() {
    try {
        const adminUid = await callOdoo('common', 'login', [ODOO_DB, ADMIN_USER, ADMIN_PASS]);
        if (!adminUid) {
            console.error('❌ Échec connexion Odoo.');
            return;
        }
        console.log(`✅ Authentifié en tant qu'admin (UID: ${adminUid})`);

        // 1. Récupérer toutes les notes (school.grade)
        const allGrades = await callOdoo('object', 'execute_kw', [
            ODOO_DB, adminUid, ADMIN_PASS, 'school.grade', 'search_read',
            [[]],
            { fields: ['id', 'student_id', 'subject_id', 'sub_subject_id', 'final_mark'] }
        ]);

        console.log(`📊 ${allGrades.length} enregistrements de notes trouvés dans school.grade.`);

        // Mise à jour par lots de school.grade
        const batchSize = 100;
        const gradeIds = allGrades.map(g => g.id);

        for (let i = 0; i < gradeIds.length; i += batchSize) {
            const chunk = gradeIds.slice(i, i + batchSize);
            await callOdoo('object', 'execute_kw', [
                ODOO_DB, adminUid, ADMIN_PASS, 'school.grade', 'write',
                [chunk, {
                    cc1: 0.0,
                    cc2: 0.0,
                    oral_mark: 0.0,
                    mid_term_mark: 0.0,
                    final_mark: 0.0
                }]
            ]);
            console.log(`   - Mis à jour notes ${i + 1} à ${Math.min(i + batchSize, gradeIds.length)} / ${gradeIds.length}`);
        }

        // 2. Récupérer tous les élèves et mettre average_grade à 0.0
        const allStudents = await callOdoo('object', 'execute_kw', [
            ODOO_DB, adminUid, ADMIN_PASS, 'school.student', 'search_read',
            [[]],
            { fields: ['id', 'name'] }
        ]);

        console.log(`🎓 ${allStudents.length} élèves trouvés dans school.student.`);
        const studentIds = allStudents.map(s => s.id);

        for (let i = 0; i < studentIds.length; i += batchSize) {
            const chunk = studentIds.slice(i, i + batchSize);
            await callOdoo('object', 'execute_kw', [
                ODOO_DB, adminUid, ADMIN_PASS, 'school.student', 'write',
                [chunk, {
                    average_grade: 0.0
                }]
            ]);
            console.log(`   - Mis à jour élèves ${i + 1} à ${Math.min(i + batchSize, studentIds.length)} / ${studentIds.length}`);
        }

        console.log(`\n🎉 TOUTES LES NOTES ET MOYENNES ONT ÉTÉ REMISES À 0.0 AVEC SUCCÈS !`);

    } catch (e) {
        console.error('❌ Erreur:', e);
    }
}

resetGradesToZero();
