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
        console.log(`✅ Connecté en tant qu'admin (UID: ${adminUid})`);

        // 1. Récupérer les groupes
        const groups = await callOdoo('object', 'execute_kw', [
            ODOO_DB, adminUid, ADMIN_PASS, 'res.groups', 'search_read',
            [[['name', 'like', 'Scolarité Mobile']]],
            { fields: ['id', 'name'] }
        ]);
        console.log('\n👥 Groupes trouvés dans Odoo :');
        groups.forEach(g => console.log(`   - [ID ${g.id}] ${g.name}`));

        const teacherGroup = groups.find(g => g.name.includes('Enseignant'));
        const staffGroup = groups.find(g => g.name.includes('Administration'));
        const managerGroup = groups.find(g => g.name.includes('Direction') || g.name.includes('Super Admin'));

        // 2. Assurer que l'admin est dans le groupe Super Admin / Direction
        if (managerGroup) {
            await callOdoo('object', 'execute_kw', [
                ODOO_DB, adminUid, ADMIN_PASS, 'res.users', 'write',
                [[adminUid], {
                    group_ids: [[4, managerGroup.id]]
                }]
            ]);
            console.log(`\n👑 Admin (${ADMIN_USER}) assigné au groupe Direction / Super Admin.`);
        }

        // 3. Récupérer tous les professeurs
        const teachers = await callOdoo('object', 'execute_kw', [
            ODOO_DB, adminUid, ADMIN_PASS, 'school.teacher', 'search_read',
            [[]],
            { fields: ['id', 'name', 'email', 'user_id', 'level_ids', 'subject_ids'] }
        ]);
        console.log(`\n👨‍🏫 ${teachers.length} enseignants trouvés :`);

        // 4. Récupérer tous les utilisateurs Odoo
        const users = await callOdoo('object', 'execute_kw', [
            ODOO_DB, adminUid, ADMIN_PASS, 'res.users', 'search_read',
            [[]],
            { fields: ['id', 'name', 'login', 'email'] }
        ]);

        for (const t of teachers) {
            let matchedUser = null;
            if (t.email) {
                const cleanEmail = t.email.trim().toLowerCase();
                matchedUser = users.find(u => 
                    (u.login && u.login.trim().toLowerCase() === cleanEmail) ||
                    (u.email && u.email.trim().toLowerCase() === cleanEmail)
                );
            }

            if (matchedUser) {
                console.log(`   ✓ Correspondance trouvée : Professeur "${t.name}" -> Utilisateur Odoo "${matchedUser.name}" (${matchedUser.login}, ID: ${matchedUser.id})`);
                
                // Mettre à jour user_id sur le professeur
                await callOdoo('object', 'execute_kw', [
                    ODOO_DB, adminUid, ADMIN_PASS, 'school.teacher', 'write',
                    [[t.id], { user_id: matchedUser.id }]
                ]);

                // Ajouter l'utilisateur au groupe Enseignant
                if (teacherGroup) {
                    await callOdoo('object', 'execute_kw', [
                        ODOO_DB, adminUid, ADMIN_PASS, 'res.users', 'write',
                        [[matchedUser.id], {
                            group_ids: [[4, teacherGroup.id]]
                        }]
                    ]);
                    console.log(`     -> Rôle "Professeur / Enseignant" attribué à l'utilisateur ${matchedUser.login}`);
                }
            } else {
                console.log(`   ℹ️ Professeur "${t.name}" (${t.email || 'Sans email'}) : Aucun utilisateur Odoo correspondant.`);
            }
        }

        console.log('\n🎉 Synchronisation des rôles et comptes terminée avec succès !');

    } catch (e) {
        console.error('❌ Erreur:', e.message);
    }
}

main();
