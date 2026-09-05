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

async function testScenario() {
    try {
        const adminUid = await callOdoo('common', 'login', [ODOO_DB, ADMIN_USER, ADMIN_PASS]);
        console.log(`✅ Connecté en admin (UID: ${adminUid})`);

        // 1. Prendre un élève
        const students = await callOdoo('object', 'execute_kw', [
            ODOO_DB, adminUid, ADMIN_PASS, 'school.student', 'search_read',
            [[]],
            { fields: ['id', 'name', 'level_id', 'average_grade'], limit: 1 }
        ]);
        const student = students[0];
        console.log(`\n👨‍🎓 Test sur l'élève : ${student.name} (ID: ${student.id})`);

        // 2. Lire les lignes de détail (school.grade)
        const grades = await callOdoo('object', 'execute_kw', [
            ODOO_DB, adminUid, ADMIN_PASS, 'school.grade', 'search_read',
            [[['student_id', '=', student.id]]],
            { fields: ['id', 'subject_id', 'sub_subject_id', 'cc1', 'cc2', 'oral_mark', 'mid_term_mark', 'final_mark'] }
        ]);
        console.log(`📊 Nombre de lignes dans le tableau de DÉTAIL : ${grades.length}`);

        // Vérifier s'il reste des lignes sans sous-matière pour les matières avec sous-matières
        const invalidDetailRows = grades.filter(g => !g.sub_subject_id);
        console.log(`⚠️ Lignes sans sous-matières : ${invalidDetailRows.length}`);

        // 3. Simuler la saisie de notes sur 2 sous-matières de Français ou Math
        // Trouvons les sous-matières de la 1ère matière
        const firstSubjectId = grades[0].subject_id[0];
        const subGradesForFirstSubject = grades.filter(g => g.subject_id[0] === firstSubjectId);
        console.log(`\n📝 Matière testée : "${grades[0].subject_id[1]}" avec ${subGradesForFirstSubject.length} sous-matières`);

        // On saisit des notes pour ces sous-matières
        let markVal = 14.0;
        for (const sg of subGradesForFirstSubject) {
            await callOdoo('object', 'execute_kw', [
                ODOO_DB, adminUid, ADMIN_PASS, 'school.grade', 'write',
                [[sg.id], {
                    cc1: markVal,
                    cc2: markVal + 2,
                    final_mark: (markVal + (markVal + 2)) / 2
                }]
            ]);
            console.log(`  -> Sous-matière "${sg.sub_subject_id[1]}" : CC1=${markVal}, CC2=${markVal + 2} => Note finale=${(markVal + (markVal + 2)) / 2}`);
            markVal += 1.0;
        }

        // 4. Vérifier le tableau de SYNTHÈSE (school.grade.summary) pour cet élève
        const summaries = await callOdoo('object', 'execute_kw', [
            ODOO_DB, adminUid, ADMIN_PASS, 'school.grade.summary', 'search_read',
            [[['student_id', '=', student.id]]],
            { fields: ['id', 'subject_id', 'sub_subject_count', 'avg_cc1', 'avg_cc2', 'final_mark', 'coefficient', 'weighted_mark', 'appreciation'] }
        ]);

        console.log(`\n📋 Tableau de SYNTHÈSE (${summaries.length} matières calculées) :`);
        console.table(summaries.map(s => ({
            id: s.id,
            matiere: s.subject_id[1],
            nb_sous_matieres: s.sub_subject_count,
            moy_cc1: s.avg_cc1,
            moy_cc2: s.avg_cc2,
            moyenne_matiere: s.final_mark,
            coeff: s.coefficient,
            note_ponderee: s.weighted_mark,
            appreciation: s.appreciation
        })));

        // 5. Vérifier la moyenne générale de l'élève
        const updatedStudent = await callOdoo('object', 'execute_kw', [
            ODOO_DB, adminUid, ADMIN_PASS, 'school.student', 'read',
            [[student.id]],
            { fields: ['name', 'average_grade'] }
        ]);
        console.log(`🎯 Moyenne générale calculée pour l'élève : ${updatedStudent[0].average_grade} / 20`);

    } catch (e) {
        console.error('❌ Erreur :', e.message);
    }
}

testScenario();
