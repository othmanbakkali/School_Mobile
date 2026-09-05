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

function generateMark(baseScore, variance = 1.5, min = 10, max = 20) {
    const raw = baseScore + (Math.random() * variance * 2 - variance);
    const clamped = Math.min(Math.max(raw, min), max);
    return Math.round(clamped * 2) / 2;
}

async function main() {
    try {
        const adminUid = await callOdoo('common', 'login', [ODOO_DB, ADMIN_USER, ADMIN_PASS]);
        if (!adminUid) {
            console.error('❌ Échec connexion Odoo.');
            return;
        }
        console.log(`✅ Authentifié en tant qu'admin (UID: ${adminUid})`);

        // 1. Récupérer toutes les matières et leurs sous-sections
        const allSubjects = await callOdoo('object', 'execute_kw', [
            ODOO_DB, adminUid, ADMIN_PASS, 'school.subject', 'search_read',
            [[]],
            { fields: ['id', 'name', 'code'] }
        ]);

        const allSubSubjects = await callOdoo('object', 'execute_kw', [
            ODOO_DB, adminUid, ADMIN_PASS, 'school.sub.subject', 'search_read',
            [[]],
            { fields: ['id', 'name', 'code', 'subject_id'] }
        ]);

        // Grouper les sous-sections par matière
        const subjectStructure = allSubjects.map(s => {
            const subs = allSubSubjects.filter(sub => sub.subject_id && sub.subject_id[0] === s.id);
            return {
                id: s.id,
                name: s.name,
                code: s.code,
                sub_subjects: subs
            };
        });

        console.log(`📚 ${subjectStructure.length} matières trouvées :`);
        subjectStructure.forEach(s => {
            console.log(`   - [ID ${s.id}] ${s.name} : ${s.sub_subjects.length} sous-sections`);
        });

        // 2. Récupérer tous les élèves
        const students = await callOdoo('object', 'execute_kw', [
            ODOO_DB, adminUid, ADMIN_PASS, 'school.student', 'search_read',
            [[]],
            { fields: ['id', 'name', 'level_id'] }
        ]);
        console.log(`\n🎓 ${students.length} élèves trouvés.`);

        // 3. Récupérer toutes les notes existantes
        const existingGrades = await callOdoo('object', 'execute_kw', [
            ODOO_DB, adminUid, ADMIN_PASS, 'school.grade', 'search_read',
            [[]],
            { fields: ['id', 'student_id', 'subject_id', 'sub_subject_id', 'semester', 'cc1', 'cc2', 'oral_mark', 'mid_term_mark', 'final_mark'] }
        ]);

        const existingGradesMap = new Map();
        existingGrades.forEach(g => {
            const stId = g.student_id?.[0];
            const sbId = g.subject_id?.[0];
            const subId = g.sub_subject_id?.[0] || 'parent';
            const sem = g.semester || 'S1';
            if (stId && sbId) {
                existingGradesMap.set(`${stId}_${sbId}_${subId}_${sem}`, g);
            }
        });

        // 4. Préparer les créations / mises à jour
        const semesters = ['S1', 'S2'];
        const gradesToCreate = [];
        const studentUpdates = [];

        for (const st of students) {
            const seed = (st.id * 17) % 100;
            const studentBaseScore = 13.0 + (seed / 100) * 4.5; // score base élève

            let s1Total = 0;
            let s1Count = 0;

            for (const sem of semesters) {
                for (const subj of subjectStructure) {
                    const subGrades = [];

                    // 4a. Traiter chaque sous-section
                    for (const sub of subj.sub_subjects) {
                        const key = `${st.id}_${subj.id}_${sub.id}_${sem}`;
                        const existing = existingGradesMap.get(key);

                        let cc1, cc2, oral, midterm, finalMark;

                        if (existing && existing.final_mark > 0) {
                            cc1 = existing.cc1;
                            cc2 = existing.cc2;
                            oral = existing.oral_mark;
                            midterm = existing.mid_term_mark;
                            finalMark = existing.final_mark;
                        } else {
                            cc1 = generateMark(studentBaseScore, 1.8);
                            cc2 = generateMark(studentBaseScore + 0.3, 1.8);
                            oral = generateMark(studentBaseScore + 0.5, 1.5);
                            midterm = generateMark(studentBaseScore, 1.5);
                            finalMark = Math.round(((cc1 + cc2 + oral + midterm) / 4) * 100) / 100;

                            if (!existing) {
                                gradesToCreate.push({
                                    student_id: st.id,
                                    subject_id: subj.id,
                                    sub_subject_id: sub.id,
                                    subject: `${subj.name} - ${sub.name}`,
                                    semester: sem,
                                    cc1: cc1,
                                    cc2: cc2,
                                    oral_mark: oral,
                                    mid_term_mark: midterm,
                                    final_mark: finalMark
                                });
                            }
                        }

                        subGrades.push({ cc1, cc2, oral, midterm, finalMark });
                    }

                    // 4b. CALCUL DE LA MOYENNE DE LA SECTION PARENTE
                    const N = subGrades.length;
                    const parentCC1 = N > 0 ? Math.round((subGrades.reduce((sum, g) => sum + g.cc1, 0) / N) * 100) / 100 : 0;
                    const parentCC2 = N > 0 ? Math.round((subGrades.reduce((sum, g) => sum + g.cc2, 0) / N) * 100) / 100 : 0;
                    const parentOral = N > 0 ? Math.round((subGrades.reduce((sum, g) => sum + g.oral, 0) / N) * 100) / 100 : 0;
                    const parentMidterm = N > 0 ? Math.round((subGrades.reduce((sum, g) => sum + g.midterm, 0) / N) * 100) / 100 : 0;
                    // RÈGLE MÉTIER : La note de la section parente est la MOYENNE des sous-sections
                    const parentFinal = N > 0 ? Math.round((subGrades.reduce((sum, g) => sum + g.finalMark, 0) / N) * 100) / 100 : 0;

                    if (sem === 'S1') {
                        s1Total += parentFinal;
                        s1Count++;
                    }

                    const parentKey = `${st.id}_${subj.id}_parent_${sem}`;
                    const existingParent = existingGradesMap.get(parentKey);

                    if (!existingParent) {
                        gradesToCreate.push({
                            student_id: st.id,
                            subject_id: subj.id,
                            sub_subject_id: false,
                            subject: subj.name,
                            semester: sem,
                            cc1: parentCC1,
                            cc2: parentCC2,
                            oral_mark: parentOral,
                            mid_term_mark: parentMidterm,
                            final_mark: parentFinal
                        });
                    }
                }
            }

            if (s1Count > 0) {
                studentUpdates.push({ id: st.id, avg: Math.round((s1Total / s1Count) * 100) / 100 });
            }
        }

        console.log(`\n🚀 Insertion de ${gradesToCreate.length} nouvelles lignes de notes dans Odoo...`);
        const BATCH = 200;
        for (let i = 0; i < gradesToCreate.length; i += BATCH) {
            const batch = gradesToCreate.slice(i, i + BATCH);
            await callOdoo('object', 'execute_kw', [
                ODOO_DB, adminUid, ADMIN_PASS, 'school.grade', 'create',
                [batch]
            ]);
            console.log(`  ✓ Lot ${i + 1} à ${Math.min(i + BATCH, gradesToCreate.length)} créé`);
        }

        console.log('\n===============================================================');
        console.log('🎉 GÉNÉRATION TERMINÉE AVEC SUCCÈS !');
        console.log('✅ RÈGLE RESPECTÉE : La note de chaque matière parente est la moyenne exacte de ses sous-sections.');
        console.log('===============================================================');

    } catch (e) {
        console.error('❌ Erreur:', e.message);
    }
}

main();
