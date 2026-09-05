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
            console.error('❌ Échec connexion Odoo.');
            return;
        }
        console.log(`✅ Authentifié en tant qu'admin (UID: ${adminUid})`);

        // 1. Récupérer toutes les matières avec sous-matières
        const subjects = await callOdoo('object', 'execute_kw', [
            ODOO_DB, adminUid, ADMIN_PASS, 'school.subject', 'search_read',
            [[]],
            { fields: ['id', 'name', 'sub_subject_ids', 'coefficient'] }
        ]);
        const subjectsWithSubs = new Set(subjects.filter(s => s.sub_subject_ids && s.sub_subject_ids.length > 0).map(s => s.id));
        console.log(`📚 Matières avec sous-matières trouvées: ${subjectsWithSubs.size}`);

        // 2. Trouver et supprimer les lignes de détail sans sous-matière pour ces matières
        const obsoleteGrades = await callOdoo('object', 'execute_kw', [
            ODOO_DB, adminUid, ADMIN_PASS, 'school.grade', 'search_read',
            [[['sub_subject_id', '=', false], ['subject_id', 'in', Array.from(subjectsWithSubs)]]],
            { fields: ['id', 'student_id', 'subject_id'] }
        ]);
        console.log(`🗑️ Lignes de matières génériques à supprimer du tableau de détail: ${obsoleteGrades.length}`);
        if (obsoleteGrades.length > 0) {
            const obsoleteIds = obsoleteGrades.map(g => g.id);
            await callOdoo('object', 'execute_kw', [
                ODOO_DB, adminUid, ADMIN_PASS, 'school.grade', 'unlink',
                [obsoleteIds]
            ]);
            console.log(`✅ ${obsoleteIds.length} lignes génériques supprimées avec succès.`);
        }

        // 3. Récupérer tous les élèves
        const students = await callOdoo('object', 'execute_kw', [
            ODOO_DB, adminUid, ADMIN_PASS, 'school.student', 'search_read',
            [[]],
            { fields: ['id', 'name', 'level_id', 'year_id'] }
        ]);
        console.log(`👥 Total élèves: ${students.length}`);

        // 4. Générer pour chaque élève les sous-matières manquantes
        for (const st of students) {
            await callOdoo('object', 'execute_kw', [
                ODOO_DB, adminUid, ADMIN_PASS, 'school.student', 'action_generate_grade_lines',
                [[st.id]]
            ]);
        }
        console.log(`✅ Lignes de sous-matières générées / synchronisées pour tous les élèves.`);

        // 5. Forcer le recalcul des synthèses (_compute_grade_summaries & _compute_average_grade)
        // En écrivant par exemple un champ ou en lisant
        for (const st of students) {
            await callOdoo('object', 'execute_kw', [
                ODOO_DB, adminUid, ADMIN_PASS, 'school.student', '_compute_grade_summaries',
                [[st.id]]
            ]);
            await callOdoo('object', 'execute_kw', [
                ODOO_DB, adminUid, ADMIN_PASS, 'school.student', '_compute_average_grade',
                [[st.id]]
            ]);
        }
        console.log(`✅ Synthèses calculées pour tous les élèves.`);

        // 6. Vérifier un élève exemple
        const sampleStudent = students[0];
        const studentData = await callOdoo('object', 'execute_kw', [
            ODOO_DB, adminUid, ADMIN_PASS, 'school.student', 'read',
            [[sampleStudent.id]],
            { fields: ['name', 'grade_ids', 'grade_summary_ids', 'average_grade'] }
        ]);
        console.log(`\n🔍 Vérification pour l'élève: ${sampleStudent.name}`);
        console.log(`- Nombre de lignes de détail (sous-matières): ${studentData[0].grade_ids.length}`);
        console.log(`- Nombre de lignes de synthèse (matières parentes): ${studentData[0].grade_summary_ids.length}`);
        console.log(`- Moyenne générale: ${studentData[0].average_grade}`);

        // Lire les lignes de détail
        const detailLines = await callOdoo('object', 'execute_kw', [
            ODOO_DB, adminUid, ADMIN_PASS, 'school.grade', 'read',
            [studentData[0].grade_ids.slice(0, 5)],
            { fields: ['subject_id', 'sub_subject_id', 'final_mark', 'cc1', 'cc2'] }
        ]);
        console.log('\nExemple de lignes de détail (5 premières):');
        console.table(detailLines.map(d => ({
            id: d.id,
            subject: d.subject_id[1],
            sub_subject: d.sub_subject_id ? d.sub_subject_id[1] : 'AUCUNE',
            cc1: d.cc1,
            cc2: d.cc2,
            final: d.final_mark
        })));

        // Lire les lignes de synthèse
        const summaryLines = await callOdoo('object', 'execute_kw', [
            ODOO_DB, adminUid, ADMIN_PASS, 'school.grade.summary', 'read',
            [studentData[0].grade_summary_ids],
            { fields: ['subject_id', 'sub_subject_count', 'final_mark', 'coefficient', 'weighted_mark', 'appreciation'] }
        ]);
        console.log('\nExemple de lignes de synthèse (Toutes les matières parentes):');
        console.table(summaryLines.map(s => ({
            id: s.id,
            subject: s.subject_id[1],
            sub_count: s.sub_subject_count,
            moyenne_matiere: s.final_mark,
            coeff: s.coefficient,
            note_ponderee: s.weighted_mark,
            appreciation: s.appreciation
        })));

        console.log('\n🎉 Tout est synchronisé et conforme avec succès !');

    } catch (err) {
        console.error('❌ Erreur:', err.message);
    }
}

main();
