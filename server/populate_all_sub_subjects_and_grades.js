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

const completeSubSubjectsData = [
    {
        subject_name: 'اللغة العربية (Arabe)',
        match_keywords: ['عربية', 'arabe', 'ar'],
        sub_subjects: [
            { name: 'التعبير الكتابي (الإنشاء)', code: 'AR-EXP' },
            { name: 'القراءة (فهم المقروء)', code: 'AR-LEC' },
            { name: 'الإملاء', code: 'AR-ORT' },
            { name: 'الإستماع والتحدث (التواصل الشفهي)', code: 'AR-ORA' },
            { name: 'التطبيقات الكتابية (الشكل)', code: 'AR-APP' },
            { name: 'التراكيب', code: 'AR-TRA' },
            { name: 'الصرف والتحويل', code: 'AR-SAR' },
            { name: 'مشروع الوحدة', code: 'AR-PRO' },
        ]
    },
    {
        subject_name: 'Français (Langue Française)',
        match_keywords: ['français', 'francais', 'fr', 'française'],
        sub_subjects: [
            { name: 'Lecture & Compréhension', code: 'FR-LEC' },
            { name: 'Activités orales & Communication', code: 'FR-ORA' },
            { name: 'Grammaire', code: 'FR-GRA' },
            { name: 'Conjugaison', code: 'FR-CON' },
            { name: 'Orthographe & Dictée', code: 'FR-ORT' },
            { name: 'Lexique & Vocabulaire', code: 'FR-LEX' },
            { name: 'Production de l\'écrit', code: 'FR-ECR' },
            { name: 'Poésie / Comptine / Chant', code: 'FR-POE' },
            { name: 'Graphisme / Écriture / Copie', code: 'FR-COP' },
            { name: 'Projet de classe', code: 'FR-PRO' },
        ]
    },
    {
        subject_name: 'Mathématiques (الرياضيات)',
        match_keywords: ['math', 'رياضيات'],
        sub_subjects: [
            { name: 'الأعداد والحساب (Nombres et Calcul)', code: 'MATH-CAL' },
            { name: 'الهندسة والفضاء (Géométrie et Espace)', code: 'MATH-GEO' },
            { name: 'القياس (Grandeurs et Mesures)', code: 'MATH-MES' },
            { name: 'تنظيم ومعالجة البيانات (Statistiques)', code: 'MATH-STA' },
            { name: 'حل المسائل (Résolution de problèmes)', code: 'MATH-PRO' },
        ]
    },
    {
        subject_name: 'التربية الإسلامية (Éducation Islamique)',
        match_keywords: ['إسلامية', 'islam', 'islamique'],
        sub_subjects: [
            { name: 'القرآن الكريم والحديث الشريف', code: 'ISL-QUR' },
            { name: 'التزكية (العقيدة)', code: 'ISL-TAZ' },
            { name: 'الاقتداء (السيرة النبوية)', code: 'ISL-IQT' },
            { name: 'الاستجابة (العبادات)', code: 'ISL-IST' },
            { name: 'القسط (حقوق ومعاملات)', code: 'ISL-QIS' },
            { name: 'الحكمة (القيم والأخلاق)', code: 'ISL-HIK' },
        ]
    },
    {
        subject_name: 'الاجتماعيات (Histoire-Géographie & Civisme)',
        match_keywords: ['اجتماعيات', 'histoire', 'geo', 'soc'],
        sub_subjects: [
            { name: 'التاريخ (Histoire)', code: 'SOC-HIS' },
            { name: 'الجغرافيا (Géographie)', code: 'SOC-GEO' },
            { name: 'التربية المدنية والمواطنة (Civisme)', code: 'SOC-CIV' },
        ]
    },
    {
        subject_name: 'النشاط العلمي / Sciences',
        match_keywords: ['علمي', 'science', 'sci', 'svt'],
        sub_subjects: [
            { name: 'علوم الحياة والأرض (SVT)', code: 'SCI-SVT' },
            { name: 'العلوم الفيزيائية والتكنولوجيا', code: 'SCI-PHY' },
            { name: 'صحة الإنسان والتغذية', code: 'SCI-SAN' },
            { name: 'الفلك والأرض والفضاء', code: 'SCI-ESP' },
        ]
    },
    {
        subject_name: 'التربية الفنية والبدنية (Arts & EPS)',
        match_keywords: ['فنية', 'art', 'eps', 'بدنية'],
        sub_subjects: [
            { name: 'التربية التشكيلية والرسم (Arts Plastiques)', code: 'ART-DES' },
            { name: 'المسرح والأناشيد (Chant et Théâtre)', code: 'ART-THE' },
            { name: 'التربية البدنية والرياضة (EPS)', code: 'ART-EPS' },
        ]
    },
    {
        subject_name: 'English (Anglais)',
        match_keywords: ['anglais', 'english', 'eng'],
        sub_subjects: [
            { name: 'Reading & Comprehension', code: 'ENG-REA' },
            { name: 'Listening & Speaking', code: 'ENG-ORA' },
            { name: 'Grammar & Vocabulary', code: 'ENG-GRA' },
            { name: 'Writing & Composition', code: 'ENG-WRI' },
        ]
    },
];

async function main() {
    try {
        const adminUid = await callOdoo('common', 'login', [ODOO_DB, ADMIN_USER, ADMIN_PASS]);
        console.log(`✅ Connecté en tant qu'admin (UID: ${adminUid})`);

        // 1. Récupérer toutes les matières existantes dans Odoo
        const existingSubjects = await callOdoo('object', 'execute_kw', [
            ODOO_DB, adminUid, ADMIN_PASS, 'school.subject', 'search_read',
            [[]],
            { fields: ['id', 'name', 'code'] }
        ]);

        const subjectIdMap = new Map();

        for (const sData of completeSubSubjectsData) {
            let matched = existingSubjects.find(s => 
                sData.match_keywords.some(kw => s.name.toLowerCase().includes(kw.toLowerCase()))
            );

            let subjId;
            if (matched) {
                subjId = matched.id;
                console.log(`\n📚 Matière trouvée : ${matched.name} (ID: ${subjId})`);
            } else {
                subjId = await callOdoo('object', 'execute_kw', [
                    ODOO_DB, adminUid, ADMIN_PASS, 'school.subject', 'create',
                    [{ name: sData.subject_name }]
                ]);
                console.log(`\n📚 Nouvelle Matière créée : ${sData.subject_name} (ID: ${subjId})`);
            }
            subjectIdMap.set(sData.subject_name, subjId);

            // 2. Créer / Mettre à jour les sous-matières dans school.sub.subject
            const existingSubSubjects = await callOdoo('object', 'execute_kw', [
                ODOO_DB, adminUid, ADMIN_PASS, 'school.sub.subject', 'search_read',
                [[['subject_id', '=', subjId]]],
                { fields: ['id', 'name'] }
            ]);
            const existingSubNames = existingSubSubjects.map(sub => sub.name);

            let seq = 10;
            for (const sub of sData.sub_subjects) {
                if (!existingSubNames.some(existing => existing.includes(sub.name) || sub.name.includes(existing))) {
                    const newSubId = await callOdoo('object', 'execute_kw', [
                        ODOO_DB, adminUid, ADMIN_PASS, 'school.sub.subject', 'create',
                        [{
                            name: sub.name,
                            code: sub.code,
                            sequence: seq,
                            subject_id: subjId,
                            coefficient: 1.0
                        }]
                    ]);
                    console.log(`   ✨ Sous-matière créée : ${sub.name} (ID: ${newSubId})`);
                } else {
                    console.log(`   - Sous-matière existante : ${sub.name}`);
                }
                seq += 10;
            }
        }

        console.log('\n🎉 TOUTES LES SOUS-MATIÈRES ONT ÉTÉ ENREGISTRÉES DANS ODOO AVEC SUCCÈS !');

    } catch (e) {
        console.error('❌ Erreur:', e.message);
    }
}

main();
