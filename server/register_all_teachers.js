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

        // Récupérer les matières
        const subjects = await callOdoo('object', 'execute_kw', [
            ODOO_DB, adminUid, ADMIN_PASS, 'school.subject', 'search_read',
            [[]],
            { fields: ['id', 'name'] }
        ]);
        const getSubjId = (namePart) => subjects.find(s => s.name.toLowerCase().includes(namePart.toLowerCase()))?.id;

        // Récupérer les classes
        const levels = await callOdoo('object', 'execute_kw', [
            ODOO_DB, adminUid, ADMIN_PASS, 'school.level', 'search_read',
            [[]],
            { fields: ['id', 'name'] }
        ]);
        const getLevelId = (namePart) => levels.find(l => l.name.toLowerCase().includes(namePart.toLowerCase()))?.id;

        const teachersToRegister = [
            {
                name: 'البقالي يونس', // Younes Bakkali
                email: 'younes.bakkali@alibdaealamia.ma',
                phone: '+212 661-234567',
                subjects: ['عربية', 'اجتماع'],
                classes: ['3APG-1', '4APG-1']
            },
            {
                name: 'الجبلي ليلى', // Layla El Jebli
                email: 'layla.jebli@alibdaealamia.ma',
                phone: '+212 662-345678',
                subjects: ['عربية', 'إسلام', 'اجتماع', 'فن'],
                classes: ['6APG-1']
            },
            {
                name: 'أستاذ(ة) اللغة الفرنسية', // Prof Français
                email: 'francais@alibdaealamia.ma',
                phone: '+212 663-456789',
                subjects: ['français'],
                classes: ['1APG-1', '2APG-1']
            },
            {
                name: 'أستاذ(ة) الرياضيات والعلوم', // Prof Maths & Sciences
                email: 'maths.sciences@alibdaealamia.ma',
                phone: '+212 664-567890',
                subjects: ['math', 'علم'],
                classes: ['6APG-1']
            },
            {
                name: 'أستاذ(ة) اللغة الإنجليزية', // Prof Anglais
                email: 'english@alibdaealamia.ma',
                phone: '+212 665-678901',
                subjects: ['anglais'],
                classes: ['3APG-1', '4APG-1', '6APG-1']
            }
        ];

        console.log('\n--- Enregistrement des Professeurs ---');
        for (const t of teachersToRegister) {
            const subjIds = t.subjects.map(getSubjId).filter(Boolean);
            const levelIds = t.classes.map(getLevelId).filter(Boolean);

            const existing = await callOdoo('object', 'execute_kw', [
                ODOO_DB, adminUid, ADMIN_PASS, 'school.teacher', 'search_read',
                [[['name', '=', t.name]]],
                { fields: ['id', 'name'] }
            ]);

            const vals = {
                name: t.name,
                email: t.email,
                phone: t.phone,
                subject_ids: [[6, 0, subjIds]],
                level_ids: [[6, 0, levelIds]]
            };

            if (existing.length > 0) {
                await callOdoo('object', 'execute_kw', [
                    ODOO_DB, adminUid, ADMIN_PASS, 'school.teacher', 'write',
                    [[existing[0].id], vals]
                ]);
                console.log(`  ✓ Professeur mis à jour : ${t.name} (ID: ${existing[0].id})`);
            } else {
                const newId = await callOdoo('object', 'execute_kw', [
                    ODOO_DB, adminUid, ADMIN_PASS, 'school.teacher', 'create',
                    [vals]
                ]);
                console.log(`  ✨ Nouveau Professeur créé : ${t.name} (ID: ${newId})`);
            }
        }

        console.log('\n🎉 TOUS LES PROFESSEURS SONT ENREGISTRÉS DANS ODOO !');

    } catch (e) {
        console.error('❌ Erreur:', e.message);
    }
}

main();
