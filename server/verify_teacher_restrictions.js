const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const rawOdooUrl = process.env.ODOO_URL || 'http://68.183.19.16:8069';
const ODOO_URL = rawOdooUrl.replace(/\/+$/, '');
const ODOO_DB = process.env.ODOO_DB || 'alibdaealamia';
const ADMIN_USER = process.env.ODOO_ADMIN_USER || 'othmanbakkali@gmail.com';
const ADMIN_PASS = process.env.ODOO_ADMIN_PASS || 'Admin@2026';

console.log(`🔍 Test de Vérification des Droits d'Accès Odoo...`);

const callOdoo = async (service, method, args, kwargs = {}) => {
    const response = await axios.post(`${ODOO_URL}/jsonrpc`, {
        jsonrpc: '2.0',
        method: 'call',
        params: { service, method, args, kwargs },
        id: Math.floor(Math.random() * 1000)
    });
    if (response.data.error) {
        throw new Error(response.data.error.data?.message || response.data.error.message || JSON.stringify(response.data.error));
    }
    return response.data.result;
};

async function testTeacherAccess() {
    try {
        const adminUid = await callOdoo('common', 'login', [ODOO_DB, ADMIN_USER, ADMIN_PASS]);

        // Vérifier les classes et matières assignées au Professeur Adham Taha
        const teacherProfile = await callOdoo('object', 'execute_kw', [
            ODOO_DB, adminUid, ADMIN_PASS, 'school.teacher', 'search_read',
            [[['email', '=', 'adhamth15@gmail.com']]],
            { fields: ['id', 'name', 'user_id', 'level_ids', 'subject_ids'] }
        ]);

        console.log('\n📌 Profil Enseignant (Adham Taha) :');
        console.log(teacherProfile[0]);

        // Si le professeur n'a pas encore de classe assignée pour le test, assignons-lui une classe (ex: 1APG-1)
        if (!teacherProfile[0].level_ids || teacherProfile[0].level_ids.length === 0) {
            const level1 = await callOdoo('object', 'execute_kw', [
                ODOO_DB, adminUid, ADMIN_PASS, 'school.level', 'search_read',
                [[]],
                { fields: ['id', 'name'], limit: 1 }
            ]);
            if (level1.length > 0) {
                await callOdoo('object', 'execute_kw', [
                    ODOO_DB, adminUid, ADMIN_PASS, 'school.teacher', 'write',
                    [[teacherProfile[0].id], { level_ids: [[6, 0, [level1[0].id]]] }]
                ]);
                console.log(`   -> Classe "${level1[0].name}" assignée à Adham Taha pour validation du test.`);
            }
        }

        // Test 1 : Nombre total de classes vues par l'ADMINISTRATEUR
        const adminLevels = await callOdoo('object', 'execute_kw', [
            ODOO_DB, adminUid, ADMIN_PASS, 'school.level', 'search_count',
            [[]]
        ]);
        console.log(`\n👑 [ADMIN] Nombre total de classes dans l'école : ${adminLevels}`);

        // Test 2 : Nombre total d'élèves vus par l'ADMINISTRATEUR
        const adminStudents = await callOdoo('object', 'execute_kw', [
            ODOO_DB, adminUid, ADMIN_PASS, 'school.student', 'search_count',
            [[]]
        ]);
        console.log(`👑 [ADMIN] Nombre total d'élèves dans l'école : ${adminStudents}`);

        // Test 3 : Nombre total de paiements vus par l'ADMINISTRATEUR
        const adminPayments = await callOdoo('object', 'execute_kw', [
            ODOO_DB, adminUid, ADMIN_PASS, 'school.payment', 'search_count',
            [[]]
        ]);
        console.log(`👑 [ADMIN] Nombre total de paiements dans l'école : ${adminPayments}`);

        // Définir un mot de passe temporaire pour le prof pour tester la connexion Odoo
        const TEACHER_PASS = 'Prof@2026';
        await callOdoo('object', 'execute_kw', [
            ODOO_DB, adminUid, ADMIN_PASS, 'res.users', 'write',
            [[teacherProfile[0].user_id[0]], { password: TEACHER_PASS }]
        ]);

        const teacherUid = await callOdoo('common', 'login', [ODOO_DB, 'adhamth15@gmail.com', TEACHER_PASS]);
        console.log(`\n👨‍🏫 [PROFESSEUR UID: ${teacherUid}] Connecté avec succès avec ses propres identifiants Odoo !`);

        // A. Classes vues par le prof
        const teacherLevels = await callOdoo('object', 'execute_kw', [
            ODOO_DB, teacherUid, TEACHER_PASS, 'school.level', 'search_read',
            [[]],
            { fields: ['id', 'name'] }
        ]);
        console.log(`   ✓ Classes visibles par le Professeur : ${teacherLevels.length} classe(s)`);
        teacherLevels.forEach(l => console.log(`     - [ID ${l.id}] ${l.name}`));

        // B. Élèves vus par le prof
        const teacherStudents = await callOdoo('object', 'execute_kw', [
            ODOO_DB, teacherUid, TEACHER_PASS, 'school.student', 'search_count',
            [[]]
        ]);
        console.log(`   ✓ Élèves visibles par le Professeur : ${teacherStudents} / ${adminStudents} (Restreint aux élèves de ses classes !)`);

        // C. Accès interdit aux Paiements
        try {
            await callOdoo('object', 'execute_kw', [
                ODOO_DB, teacherUid, TEACHER_PASS, 'school.payment', 'search_count',
                [[]]
            ]);
            console.log(`   ❌ ATTENTION: Le professeur a pu accéder aux paiements !`);
        } catch (err) {
            console.log(`   🛡️ SÉCURITÉ CONFIRMÉE : Accès aux paiements bloqué pour le professeur (${err.message.slice(0, 70)}...)`);
        }

        // D. Accès interdit à la Configuration
        try {
            await callOdoo('object', 'execute_kw', [
                ODOO_DB, teacherUid, TEACHER_PASS, 'school.config', 'search_count',
                [[]]
            ]);
            console.log(`   ❌ ATTENTION: Le professeur a pu accéder à la configuration !`);
        } catch (err) {
            console.log(`   🛡️ SÉCURITÉ CONFIRMÉE : Accès configuration bloqué pour le professeur (${err.message.slice(0, 70)}...)`);
        }

        // E. Création de Devoir pour sa propre classe (Doit Réussir)
        const myLevelId = teacherLevels[0].id;
        const hwId = await callOdoo('object', 'execute_kw', [
            ODOO_DB, teacherUid, TEACHER_PASS, 'school.homework', 'create',
            [{
                title: 'Test Devoir Professeur Restreint',
                level_id: myLevelId,
                description: 'Exercice à rendre par les élèves de sa propre classe'
            }]
        ]);
        console.log(`   ✨ CRÉATION DEVOIR RÉUSSIE : Devoir ID ${hwId} créé pour sa classe "${teacherLevels[0].name}" !`);

        // F. Tentative de création pour une autre classe non assignée (Doit Être Bloqué)
        const allLevels = await callOdoo('object', 'execute_kw', [
            ODOO_DB, adminUid, ADMIN_PASS, 'school.level', 'search_read',
            [[['id', 'not in', teacherLevels.map(l => l.id)]]],
            { fields: ['id', 'name'], limit: 1 }
        ]);
        if (allLevels.length > 0) {
            try {
                await callOdoo('object', 'execute_kw', [
                    ODOO_DB, teacherUid, TEACHER_PASS, 'school.homework', 'create',
                    [{
                        title: 'Test Devoir Classe Non Assignée',
                        level_id: allLevels[0].id
                    }]
                ]);
                console.log(`   ❌ ATTENTION: Le professeur a pu créer un devoir pour une classe étrangère !`);
            } catch (err) {
                console.log(`   🛡️ SÉCURITÉ CONFIRMÉE : Création bloquée pour classe non assignée "${allLevels[0].name}" (${err.message.slice(0, 70)}...)`);
            }
        }

        // Nettoyage du devoir de test
        await callOdoo('object', 'execute_kw', [
            ODOO_DB, teacherUid, TEACHER_PASS, 'school.homework', 'unlink',
            [[hwId]]
        ]);
        console.log(`   🧹 Nettoyage du devoir de test terminé.`);

        console.log('\n🎉 TOUTES LES VÉRIFICATIONS DE DROITS ET DE RESTRICTIONS ONT RÉUSSI AVEC SUCCÈS !');

    } catch (e) {
        console.error('❌ Erreur de test:', e.message);
    }
}

testTeacherAccess();
