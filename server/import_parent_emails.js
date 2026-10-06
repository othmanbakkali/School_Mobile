const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const dir = 'C:\\Users\\othma\\OneDrive\\Bureau\\alibdaealamia\\New';
const csvPath = path.join(dir, 'alibdaealamia_names_emails (1).csv');

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
        throw new Error(response.data.error.data?.message || response.data.error.message || JSON.stringify(response.data.error));
    }
    return response.data.result;
};

async function main() {
    try {
        const adminUid = await callOdoo('common', 'login', [ODOO_DB, ADMIN_USER, ADMIN_PASS]);
        console.log(`✅ Connecté en tant qu'admin (UID: ${adminUid})`);

        if (!fs.existsSync(csvPath)) {
            throw new Error(`Fichier CSV introuvable: ${csvPath}`);
        }

        const csvContent = fs.readFileSync(csvPath, 'utf8');
        const rows = csvContent.split('\n')
            .map(l => l.trim())
            .filter(l => l.length > 0)
            .slice(1) // Ignorer l'entête
            .map(l => {
                const parts = l.split(',');
                return {
                    name: parts[0]?.trim(),
                    email: parts[1]?.trim()
                };
            });

        console.log(`📄 Lignes d'emails lues depuis le fichier CSV : ${rows.length}`);

        // Récupérer les parents dans Odoo par ordre d'ID
        const parents = await callOdoo('object', 'execute_kw', [
            ODOO_DB, adminUid, ADMIN_PASS, 'school.parent', 'search_read',
            [[]],
            { fields: ['id', 'name', 'phone', 'email'], order: 'id asc' }
        ]);

        console.log(`👨‍👩‍👧 Nombre de parents existants dans Odoo : ${parents.length}`);

        let updatedCount = 0;
        let alreadyUpToDate = 0;

        for (let i = 0; i < parents.length; i++) {
            const p = parents[i];
            const r = rows[i];

            if (!r || !r.email) {
                console.warn(`⚠️ Aucune donnée email trouvée pour le parent [ID ${p.id}] "${p.name}"`);
                continue;
            }

            const targetEmail = r.email.trim();

            if (p.email && p.email.trim().toLowerCase() === targetEmail.toLowerCase()) {
                alreadyUpToDate++;
                continue;
            }

            await callOdoo('object', 'execute_kw', [
                ODOO_DB, adminUid, ADMIN_PASS, 'school.parent', 'write',
                [[p.id], { email: targetEmail }]
            ]);

            updatedCount++;
            console.log(`   ✓ [ID ${p.id}] "${p.name}" mis à jour avec email: ${targetEmail}`);
        }

        console.log('\n======================================================');
        console.log(`🎉 IMPORTATION TERMINÉE AVEC SUCCÈS !`);
        console.log(`   - Parents mis à jour : ${updatedCount}`);
        console.log(`   - Parents déjà à jour : ${alreadyUpToDate}`);
        console.log(`   - Total parents traités : ${parents.length}`);
        console.log('======================================================');

    } catch (e) {
        console.error('❌ Erreur lors de l\'importation:', e.message);
    }
}

main();
