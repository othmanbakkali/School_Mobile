const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const ODOO_URL = (process.env.ODOO_URL || 'http://68.183.19.16:8069').replace(/\/+$/, '');
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
    if (response.data.error) throw new Error(response.data.error.data.message);
    return response.data.result;
};

async function main() {
    console.log('Connexion admin Odoo...');
    const loginRes = await axios.post(`${ODOO_URL}/jsonrpc`, {
        jsonrpc: '2.0',
        method: 'call',
        params: { service: 'common', method: 'login', args: [ODOO_DB, ADMIN_USER, ADMIN_PASS] },
        id: 1
    });
    const adminUid = loginRes.data.result;
    console.log('Admin UID:', adminUid);

    // Get subjects
    const subjects = await callOdoo('object', 'execute_kw', [
        ODOO_DB, adminUid, ADMIN_PASS, 'school.subject', 'search_read',
        [[]],
        { fields: ['id', 'name'], limit: 10 }
    ]);
    console.log('Matières trouvées:', subjects);

    const mathSubj = subjects.find(s => s.name.toLowerCase().includes('math')) || subjects[0];
    const frenchSubj = subjects.find(s => s.name.toLowerCase().includes('fran') || s.name.toLowerCase().includes('lang')) || subjects[1] || subjects[0];

    // Check existing revisions
    const existing = await callOdoo('object', 'execute_kw', [
        ODOO_DB, adminUid, ADMIN_PASS, 'school.revision', 'search_read',
        [[]],
        { fields: ['id', 'name', 'activity_type'] }
    ]);
    console.log('Révisions existantes:', existing.length);

    if (existing.length === 0) {
        console.log('Création de révisions et défis exemples...');

        // 1. Révision Mathématiques
        const rev1Id = await callOdoo('object', 'execute_kw', [
            ODOO_DB, adminUid, ADMIN_PASS, 'school.revision', 'create',
            [{
                name: '📐 Révision : Les Fractions & Priorités de Calcul',
                activity_type: 'revision',
                subject_id: mathSubj ? mathSubj.id : false,
                difficulty: 'medium',
                xp_reward: 50,
                description: 'Quiz interactif de révision sur le calcul de fractions et les règles de calcul.',
                state: 'published'
            }]
        ]);

        await callOdoo('object', 'execute_kw', [
            ODOO_DB, adminUid, ADMIN_PASS, 'school.revision.question', 'create',
            [[
                {
                    revision_id: rev1Id,
                    sequence: 1,
                    question: 'Que vaut 1/4 + 2/4 ?',
                    option_a: '3/4',
                    option_b: '3/8',
                    option_c: '2/4',
                    option_d: '1/2',
                    correct_option: 'A',
                    explanation: 'Pour additionner deux fractions ayant le même dénominateur, on additionne les numérateurs (1 + 2 = 3) et on garde le dénominateur commun (4).',
                    xp_points: 15
                },
                {
                    revision_id: rev1Id,
                    sequence: 2,
                    question: 'Dans un triangle rectangle, quel côté est le plus long ?',
                    option_a: 'Le côté adjacent',
                    option_b: "L'hypoténuse",
                    option_c: 'Le côté opposé',
                    option_d: 'Tous les côtés sont égaux',
                    correct_option: 'B',
                    explanation: "L'hypoténuse est le côté opposé à l'angle droit et c'est toujours le plus long côté du triangle rectangle.",
                    xp_points: 15
                },
                {
                    revision_id: rev1Id,
                    sequence: 3,
                    question: 'Que vaut 20% de 150 ?',
                    option_a: '20',
                    option_b: '25',
                    option_c: '30',
                    option_d: '35',
                    correct_option: 'C',
                    explanation: '20% de 150 = (20 / 100) * 150 = 0.2 * 150 = 30.',
                    xp_points: 20
                }
            ]]
        ]);
        console.log('✅ Révision 1 créée (#', rev1Id, ')');

        // 2. Révision Français
        const rev2Id = await callOdoo('object', 'execute_kw', [
            ODOO_DB, adminUid, ADMIN_PASS, 'school.revision', 'create',
            [{
                name: '📖 Grammaire : Accord du Participe Passé',
                activity_type: 'revision',
                subject_id: frenchSubj ? frenchSubj.id : false,
                difficulty: 'easy',
                xp_reward: 40,
                description: 'Testez vos connaissances sur les accords avec les auxiliaires être et avoir.',
                state: 'published'
            }]
        ]);

        await callOdoo('object', 'execute_kw', [
            ODOO_DB, adminUid, ADMIN_PASS, 'school.revision.question', 'create',
            [[
                {
                    revision_id: rev2Id,
                    sequence: 1,
                    question: "Complétez : « Elles sont ... à l'heure. »",
                    option_a: 'arrivé',
                    option_b: 'arrivée',
                    option_c: 'arrivés',
                    option_d: 'arrivées',
                    correct_option: 'D',
                    explanation: "Avec l'auxiliaire 'être', le participe passé s'accorde en genre et en nombre avec le sujet ('Elles' -> féminin pluriel -> arrivées).",
                    xp_points: 20
                },
                {
                    revision_id: rev2Id,
                    sequence: 2,
                    question: "Quel est le synonyme de 'Perspicace' ?",
                    option_a: 'Clairvoyant',
                    option_b: 'Négligent',
                    option_c: 'Lent',
                    option_d: 'Bruyant',
                    correct_option: 'A',
                    explanation: "Une personne perspicace est douée d'un esprit pénétrant et clairvoyant.",
                    xp_points: 20
                }
            ]]
        ]);
        console.log('✅ Révision 2 créée (#', rev2Id, ')');

        // 3. Défi Journalier 1
        const todayStr = new Date().toISOString().split('T')[0];
        const def1Id = await callOdoo('object', 'execute_kw', [
            ODOO_DB, adminUid, ADMIN_PASS, 'school.revision', 'create',
            [{
                name: '⚡ Défi Éclair : Culture & Sciences',
                activity_type: 'daily_challenge',
                subject_id: mathSubj ? mathSubj.id : false,
                difficulty: 'medium',
                challenge_date: todayStr,
                xp_reward: 35,
                description: '3 questions rapides pour tester tes réflexes scientifiques du jour !',
                state: 'published'
            }]
        ]);

        await callOdoo('object', 'execute_kw', [
            ODOO_DB, adminUid, ADMIN_PASS, 'school.revision.question', 'create',
            [[
                {
                    revision_id: def1Id,
                    sequence: 1,
                    question: 'Quelle planète est la plus proche du Soleil ?',
                    option_a: 'Vénus',
                    option_b: 'Mercure',
                    option_c: 'Mars',
                    option_d: 'La Terre',
                    correct_option: 'B',
                    explanation: 'Mercure est la première planète du Système solaire par sa proximité avec le Soleil.',
                    xp_points: 15
                },
                {
                    revision_id: def1Id,
                    sequence: 2,
                    question: 'Quel gaz les plantes absorbent-elles lors de la photosynthèse ?',
                    option_a: 'Le dioxyde de carbone (CO2)',
                    option_b: "L'oxygène (O2)",
                    option_c: "L'azote (N2)",
                    option_d: "L'hélium (He)",
                    correct_option: 'A',
                    explanation: 'Les plantes absorbent le dioxyde de carbone (CO2) et rejettent du dioxygène (O2) grâce à la lumière solaire.',
                    xp_points: 20
                }
            ]]
        ]);
        console.log('✅ Défi Journalier 1 créé (#', def1Id, ')');
    }

    console.log('SEED COMPLETE !');
}

main().catch(err => {
    console.error('Erreur:', err.message);
});
