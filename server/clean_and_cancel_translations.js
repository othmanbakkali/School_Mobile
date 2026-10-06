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

const isArabic = (text) => /[\u0600-\u06FF]/.test(String(text || ''));

async function main() {
    try {
        console.log(`🔌 Connexion à Odoo (${ODOO_URL}, DB: ${ODOO_DB})...`);
        const uid = await callOdoo('common', 'login', [ODOO_DB, ADMIN_USER, ADMIN_PASS]);
        console.log(`✅ Connecté UID: ${uid}`);

        const homeworks = await callOdoo('object', 'execute_kw', [
            ODOO_DB, uid, ADMIN_PASS, 'school.homework', 'search_read',
            [[]],
            { fields: ['id', 'title', 'title_fr', 'title_ar', 'description', 'description_fr', 'description_ar', 'subject_id', 'subject'] }
        ]);

        console.log(`📋 Total devoirs trouvés: ${homeworks.length}`);

        for (const h of homeworks) {
            const subjectName = (h.subject_id && h.subject_id[1]) || h.subject || '';
            
            // On détermine si le devoir d'origine est en arabe ou en français
            // Les devoirs arabes : Arabe (1), التربية الإسلامية, ou dont la description_ar contient du texte arabe authentique
            const isArHomework = subjectName.includes('Arabe') || 
                                subjectName.includes('العربية') || 
                                subjectName.includes('التربية') ||
                                (h.title_ar === 'التطبيقات الكتابية') ||
                                (h.title_ar === 'الكتابة') ||
                                (h.title_ar === 'إنجاز وإبداع');

            let updateVals = {};

            if (isArHomework) {
                // Devoir Arabe original
                const cleanTitle = h.title_ar || (isArabic(h.title) ? h.title : 'واجب منزلي');
                const cleanDesc = h.description_ar || (isArabic(h.description) ? h.description : '');

                updateVals = {
                    title: cleanTitle,
                    title_ar: cleanTitle,
                    title_fr: false,
                    description: cleanDesc,
                    description_ar: cleanDesc,
                    description_fr: false
                };
                console.log(`🇲🇦 Devoir [ID ${h.id}] -> ARABE pur: "${cleanTitle}"`);
            } else {
                // Devoir Français original (Français, Maths, etc.)
                const cleanTitle = h.title_fr || (!isArabic(h.title) ? h.title : 'Devoir');
                const cleanDesc = h.description_fr || (!isArabic(h.description) ? h.description : '');

                updateVals = {
                    title: cleanTitle,
                    title_fr: cleanTitle,
                    title_ar: false,
                    description: cleanDesc,
                    description_fr: cleanDesc,
                    description_ar: false
                };
                console.log(`🇫🇷 Devoir [ID ${h.id}] -> FRANÇAIS pur: "${cleanTitle}"`);
            }

            await callOdoo('object', 'execute_kw', [
                ODOO_DB, uid, ADMIN_PASS, 'school.homework', 'write',
                [[h.id], updateVals]
            ]);
        }

        console.log(`\n🎉 Tous les devoirs ont été nettoyés avec succès sans traduction automatique !`);

    } catch (err) {
        console.error('❌ Erreur:', err.message);
    }
}

main();
