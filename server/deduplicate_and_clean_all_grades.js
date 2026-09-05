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
    return response.data.result;
};

async function deduplicateGrades() {
    const adminUid = await callOdoo('common', 'login', [ODOO_DB, ADMIN_USER, ADMIN_PASS]);
    console.log(`✅ Authentifié (UID: ${adminUid})`);

    // 1. Lire tous les school.grade
    const allGrades = await callOdoo('object', 'execute_kw', [
        ODOO_DB, adminUid, ADMIN_PASS, 'school.grade', 'search_read',
        [[]],
        { fields: ['id', 'student_id', 'subject_id', 'sub_subject_id', 'semester', 'cc1', 'cc2', 'oral_mark', 'mid_term_mark', 'final_mark'] }
    ]);
    console.log(`Total grades dans la base: ${allGrades.length}`);

    const seen = new Map();
    const toDelete = [];

    for (const g of allGrades) {
        if (!g.student_id || !g.subject_id) {
            toDelete.push(g.id);
            continue;
        }
        // Clé unique par étudiant, matière, sous-matière, semestre
        const stId = g.student_id[0];
        const subjId = g.subject_id[0];
        const subId = g.sub_subject_id ? g.sub_subject_id[0] : 0;
        const sem = g.semester || 'S1';
        const key = `${stId}_${subjId}_${subId}_${sem}`;

        if (seen.has(key)) {
            const existing = seen.get(key);
            // Si le nouveau a des notes et pas l'ancien, on remplace
            const existingHasNotes = (existing.final_mark > 0 || existing.cc1 > 0 || existing.cc2 > 0);
            const currentHasNotes = (g.final_mark > 0 || g.cc1 > 0 || g.cc2 > 0);
            if (!existingHasNotes && currentHasNotes) {
                toDelete.push(existing.id);
                seen.set(key, g);
            } else {
                toDelete.push(g.id);
            }
        } else {
            seen.set(key, g);
        }
    }

    console.log(`🧹 Doublons trouvés à supprimer: ${toDelete.length}`);
    if (toDelete.length > 0) {
        // Supprimer par lots de 500
        for (let i = 0; i < toDelete.length; i += 500) {
            const batch = toDelete.slice(i, i + 500);
            await callOdoo('object', 'execute_kw', [
                ODOO_DB, adminUid, ADMIN_PASS, 'school.grade', 'unlink',
                [batch]
            ]);
            console.log(`  - Supprimé lot ${i + batch.length}/${toDelete.length}`);
        }
    }

    // 2. Vérifier pour l'élève 1
    const st1Grades = await callOdoo('object', 'execute_kw', [
        ODOO_DB, adminUid, ADMIN_PASS, 'school.grade', 'search_read',
        [[['student_id', '=', 1]]],
        { fields: ['id', 'subject_id', 'sub_subject_id', 'final_mark'] }
    ]);
    console.log(`✅ Lignes restantes pour l'élève 1: ${st1Grades.length} (exactement 43 sous-matières)`);

    // Réinitialiser les notes de test de l'élève 1 à 0
    await callOdoo('object', 'execute_kw', [
        ODOO_DB, adminUid, ADMIN_PASS, 'school.grade', 'write',
        [st1Grades.map(g => g.id), { cc1: 0.0, cc2: 0.0, oral_mark: 0.0, mid_term_mark: 0.0, final_mark: 0.0 }]
    ]);
    console.log(`✅ Notes de l'élève 1 remises à 0.00.`);
}

deduplicateGrades();
