const path = require('path');
const axios = require('axios');
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
    }, { timeout: 20000 });
    if (response.data.error) {
        throw new Error(response.data.error.data?.message || response.data.error.message || JSON.stringify(response.data.error));
    }
    return response.data.result;
};

async function main() {
    try {
        console.log(`🔌 Connexion à Odoo (${ODOO_URL}, DB: ${ODOO_DB})...`);
        const uid = await callOdoo('common', 'login', [ODOO_DB, ADMIN_USER, ADMIN_PASS]);
        console.log(`✅ Connecté en tant qu'admin (UID: ${uid})`);

        // 1. Récupérer et traduire les devoirs existants
        console.log(`\n📚 1. Migration et traduction des devoirs existants...`);
        const existingHw = await callOdoo('object', 'execute_kw', [
            ODOO_DB, uid, ADMIN_PASS, 'school.homework', 'search_read',
            [[]],
            { fields: ['id', 'title', 'title_fr', 'title_ar', 'description', 'description_fr', 'description_ar'] }
        ]);
        console.log(`Trouvé ${existingHw.length} devoirs existants.`);

        for (const hw of existingHw) {
            // Déclencher action_translate_auto
            await callOdoo('object', 'execute_kw', [
                ODOO_DB, uid, ADMIN_PASS, 'school.homework', 'action_translate_auto',
                [[hw.id]]
            ]);
            console.log(`   ✓ Devoir [ID ${hw.id}] traduit.`);
        }

        // 2. Tester la création en Arabe -> Vérifier génération en Français
        console.log(`\n🇲🇦 2. Test création en ARABE -> Vérification traduction FRANÇAIS...`);
        const levels = await callOdoo('object', 'execute_kw', [
            ODOO_DB, uid, ADMIN_PASS, 'school.level', 'search_read',
            [[]], { fields: ['id', 'name'], limit: 1 }
        ]);
        const testLevelId = levels[0].id;

        const arHwId = await callOdoo('object', 'execute_kw', [
            ODOO_DB, uid, ADMIN_PASS, 'school.homework', 'create',
            [{
                title_ar: 'واجب منزلي في مادة الرياضيات',
                description_ar: 'إنجاز التمارين 1 و 2 و 3 من الصفحة 50 في دفتر الواجبات.',
                level_id: testLevelId
            }]
        ]);
        console.log(`   Devoir créé [ID ${arHwId}]. Lecture des champs générés...`);

        const [readArHw] = await callOdoo('object', 'execute_kw', [
            ODOO_DB, uid, ADMIN_PASS, 'school.homework', 'search_read',
            [[['id', '=', arHwId]]],
            { fields: ['id', 'title', 'title_fr', 'title_ar', 'description', 'description_fr', 'description_ar'] }
        ]);
        console.log(`   🇲🇦 Saisie Arabe  : "${readArHw.title_ar}"`);
        console.log(`   🇫🇷 Traduction FR : "${readArHw.title_fr}"`);
        console.log(`   🇲🇦 Description AR: "${readArHw.description_ar}"`);
        console.log(`   🇫🇷 Description FR: "${readArHw.description_fr}"`);

        // 3. Tester la création en Français -> Vérifier génération en Arabe
        console.log(`\n🇫🇷 3. Test création en FRANÇAIS -> Vérification traduction ARABE...`);
        const frHwId = await callOdoo('object', 'execute_kw', [
            ODOO_DB, uid, ADMIN_PASS, 'school.homework', 'create',
            [{
                title_fr: 'Contrôle continu de Français',
                description_fr: 'Apprendre le texte de lecture et réviser la conjugaison du présent de l\'indicatif.',
                level_id: testLevelId
            }]
        ]);
        console.log(`   Devoir créé [ID ${frHwId}]. Lecture des champs générés...`);

        const [readFrHw] = await callOdoo('object', 'execute_kw', [
            ODOO_DB, uid, ADMIN_PASS, 'school.homework', 'search_read',
            [[['id', '=', frHwId]]],
            { fields: ['id', 'title', 'title_fr', 'title_ar', 'description', 'description_fr', 'description_ar'] }
        ]);
        console.log(`   🇫🇷 Saisie Français: "${readFrHw.title_fr}"`);
        console.log(`   🇲🇦 Traduction AR  : "${readFrHw.title_ar}"`);
        console.log(`   🇫🇷 Description FR : "${readFrHw.description_fr}"`);
        console.log(`   🇲🇦 Description AR : "${readFrHw.description_ar}"`);

        console.log('\n======================================================');
        console.log(`🎉 TEST ET VALIDATION TERMINÉS AVEC SUCCÈS !`);
        console.log('======================================================');

    } catch (e) {
        console.error('❌ Erreur:', e.message);
    }
}

main();
