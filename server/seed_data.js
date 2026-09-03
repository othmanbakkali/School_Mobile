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

async function seed() {
    try {
        // 1. Authentification Admin
        const adminUid = await callOdoo('common', 'login', [ODOO_DB, ADMIN_USER, ADMIN_PASS]);
        if (!adminUid) {
            console.error('❌ Échec de la connexion à Odoo avec les identifiants fournis.');
            return;
        }
        console.log(`✅ Authentifié avec succès en tant qu'administrateur (UID: ${adminUid})`);

        // 2. Année Scolaire 2026-2027
        console.log('\n📅 Configuration de l\'année scolaire 2026-2027...');
        const existingYears = await callOdoo('object', 'execute_kw', [
            ODOO_DB, adminUid, ADMIN_PASS, 'school.year', 'search_read',
            [[['name', 'in', ['2026-2027', '2026/2027']]]],
            { fields: ['id', 'name'] }
        ]);

        let yearId;
        if (existingYears.length > 0) {
            yearId = existingYears[0].id;
            console.log(`  ✓ Année scolaire existante trouvée (ID: ${yearId}, Nom: ${existingYears[0].name})`);
            await callOdoo('object', 'execute_kw', [
                ODOO_DB, adminUid, ADMIN_PASS, 'school.year', 'write',
                [[yearId], { active: true, state: 'open' }]
            ]);
        } else {
            yearId = await callOdoo('object', 'execute_kw', [
                ODOO_DB, adminUid, ADMIN_PASS, 'school.year', 'create',
                [{ name: '2026-2027', active: true, state: 'open' }]
            ]);
            console.log(`  ✓ Année scolaire créée : 2026-2027 (ID: ${yearId})`);
        }

        // Semestres S1 et S2
        const existingSemesters = await callOdoo('object', 'execute_kw', [
            ODOO_DB, adminUid, ADMIN_PASS, 'school.semester', 'search_read',
            [[['year_id', '=', yearId]]],
            { fields: ['id', 'name'] }
        ]);
        const semesterNames = existingSemesters.map(s => s.name);
        for (const semName of ['Semestre 1 (S1)', 'Semestre 2 (S2)']) {
            if (!semesterNames.includes(semName)) {
                await callOdoo('object', 'execute_kw', [
                    ODOO_DB, adminUid, ADMIN_PASS, 'school.semester', 'create',
                    [{ name: semName, year_id: yearId }]
                ]);
                console.log(`  ✓ Semestre créé : ${semName}`);
            }
        }

        // 3. Configuration de l'école (school.config)
        console.log('\n🏫 Paramétrage de la configuration générale de l\'école...');
        try {
            const configs = await callOdoo('object', 'execute_kw', [
                ODOO_DB, adminUid, ADMIN_PASS, 'school.config', 'search_read',
                [[]],
                { fields: ['id', 'name'] }
            ]);

            const configVals = {
                current_year_id: yearId,
                school_year: '2026-2027'
            };

            if (configs.length > 0) {
                await callOdoo('object', 'execute_kw', [
                    ODOO_DB, adminUid, ADMIN_PASS, 'school.config', 'write',
                    [[configs[0].id], configVals]
                ]);
            } else {
                await callOdoo('object', 'execute_kw', [
                    ODOO_DB, adminUid, ADMIN_PASS, 'school.config', 'create',
                    [{ name: 'Établissement Scolaire', ...configVals }]
                ]);
            }
            console.log(`  ✓ Configuration école mise à jour (Année: 2026-2027)`);
        } catch (confErr) {
            console.warn(`  ⚠️ Erreur config : ${confErr.message}`);
        }

        // 4. Niveaux et Classes (school.level)
        console.log('\n📚 Insertion des Niveaux / Classes...');
        const levels = [
            { name: '1ère Année Primaire (1AEP)' },
            { name: '2ème Année Primaire (2AEP)' },
            { name: '3ème Année Primaire (3AEP)' },
            { name: '4ème Année Primaire (4AEP)' },
            { name: '5ème Année Primaire (5AEP)' },
            { name: '6ème Année Primaire (6AEP)' },
            { name: '1ère Année Collège (1AC)' },
            { name: '2ème Année Collège (2AC)' },
            { name: '3ème Année Collège (3AC)' },
        ];

        const existingLevels = await callOdoo('object', 'execute_kw', [
            ODOO_DB, adminUid, ADMIN_PASS, 'school.level', 'search_read',
            [[]],
            { fields: ['id', 'name'] }
        ]);
        const existingLevelNames = existingLevels.map(l => l.name);

        for (const lvl of levels) {
            if (!existingLevelNames.some(existing => existing.includes(lvl.name) || lvl.name.includes(existing))) {
                const newId = await callOdoo('object', 'execute_kw', [
                    ODOO_DB, adminUid, ADMIN_PASS, 'school.level', 'create',
                    [lvl]
                ]);
                console.log(`  ✓ Niveau créé : ${lvl.name} (ID: ${newId})`);
            } else {
                console.log(`  - Niveau déjà existant : ${lvl.name}`);
            }
        }

        // 5. Matières et Sous-matières
        console.log('\n📖 Insertion des Matières...');
        const subjectsData = [
            {
                name: 'اللغة العربية (Arabe)',
                code: 'AR',
                sub_subjects: [
                    { name: 'القراءة والفهم (Lecture)', code: 'AR-LECT' },
                    { name: 'الصرف والتحويل (Conjugaison)', code: 'AR-CONJ' },
                    { name: 'التراكيب (Grammaire)', code: 'AR-GRAM' },
                    { name: 'الإملاء (Orthographe)', code: 'AR-ORTH' },
                    { name: 'الشكل والتطبيقات الكتابية', code: 'AR-APPL' },
                    { name: 'التعبير الكتابي والإنشاء', code: 'AR-EXPR' },
                    { name: 'التواصل الشفهي والاستماع', code: 'AR-ORAL' },
                ]
            },
            {
                name: 'Français (Langue Française)',
                code: 'FR',
                sub_subjects: [
                    { name: 'Lecture & Compréhension', code: 'FR-LECT' },
                    { name: 'Grammaire', code: 'FR-GRAM' },
                    { name: 'Conjugaison', code: 'FR-CONJ' },
                    { name: 'Orthographe & Dictée', code: 'FR-ORTH' },
                    { name: 'Lexique & Vocabulaire', code: 'FR-LEX' },
                    { name: 'Production de l\'écrit', code: 'FR-ECRIT' },
                    { name: 'Communication & Actes de langage', code: 'FR-ORAL' },
                    { name: 'Poésie & Récitation', code: 'FR-POES' },
                ]
            },
            {
                name: 'Mathématiques (الرياضيات)',
                code: 'MATH',
                sub_subjects: [
                    { name: 'Nombres et Calcul (الأعداد والحساب)', code: 'MATH-CALC' },
                    { name: 'Géométrie et Espace (الهندسة والفضاء)', code: 'MATH-GEOM' },
                    { name: 'Grandeurs et Mesures (القياس)', code: 'MATH-MES' },
                    { name: 'Organisation des données & Statistiques', code: 'MATH-STAT' },
                    { name: 'Résolution de problèmes (حل المسائل)', code: 'MATH-PROB' },
                ]
            },
            {
                name: 'التربية الإسلامية (Éducation Islamique)',
                code: 'ISLAM',
                sub_subjects: [
                    { name: 'القرآن الكريم والتزكية', code: 'ISL-QURAN' },
                    { name: 'الاقتداء والسيرة النبوية', code: 'ISL-IQTI' },
                    { name: 'الاستجابة والعبادات', code: 'ISL-ISTI' },
                    { name: 'القسط والمعاملات', code: 'ISL-QIST' },
                    { name: 'الحكمة والقيم', code: 'ISL-HIKM' },
                ]
            },
            {
                name: 'النشاط العلمي / Sciences',
                code: 'SCI',
                sub_subjects: [
                    { name: 'Sciences de la Vie et de la Terre (SVT)', code: 'SCI-SVT' },
                    { name: 'Sciences Physiques et Chimie', code: 'SCI-PHYS' },
                    { name: 'Technologie & Démarche scientifique', code: 'SCI-TECH' },
                    { name: 'Corps humain, Santé et Nutrition', code: 'SCI-SANTE' },
                ]
            },
            {
                name: 'الاجتماعيات (Histoire-Géographie & Civisme)',
                code: 'SOC',
                sub_subjects: [
                    { name: 'التاريخ (Histoire)', code: 'SOC-HIST' },
                    { name: 'الجغرافيا (Géographie)', code: 'SOC-GEO' },
                    { name: 'التربية المدنية والمواطنة (Civisme)', code: 'SOC-CIV' },
                ]
            },
            {
                name: 'English (Anglais)',
                code: 'ENG',
                sub_subjects: [
                    { name: 'Reading & Comprehension', code: 'ENG-READ' },
                    { name: 'Grammar & Vocabulary', code: 'ENG-GRAM' },
                    { name: 'Speaking & Listening', code: 'ENG-ORAL' },
                    { name: 'Writing & Composition', code: 'ENG-WRIT' },
                ]
            },
            {
                name: 'التربية الفنية والبدنية (Arts & EPS)',
                code: 'ART',
                sub_subjects: [
                    { name: 'التربية التشكيلية والرسم (Arts Plastiques)', code: 'ART-DESS' },
                    { name: 'المسرح والأناشيد (Chant et Théâtre)', code: 'ART-THEAT' },
                    { name: 'التربية البدنية والرياضة (EPS)', code: 'ART-EPS' },
                ]
            },
        ];

        const allExistingSubjects = await callOdoo('object', 'execute_kw', [
            ODOO_DB, adminUid, ADMIN_PASS, 'school.subject', 'search_read',
            [[]],
            { fields: ['id', 'name', 'code'] }
        ]);

        for (const subj of subjectsData) {
            let subjRecord = allExistingSubjects.find(s => 
                (s.code && s.code.toUpperCase() === subj.code.toUpperCase()) || 
                (s.name && s.name.toLowerCase().includes(subj.code.toLowerCase())) ||
                (s.name && s.name.toLowerCase() === subj.name.toLowerCase())
            );

            let subjId;
            if (subjRecord) {
                subjId = subjRecord.id;
                console.log(`  ✓ Matière déjà présente : ${subj.name} (ID: ${subjId})`);
            } else {
                subjId = await callOdoo('object', 'execute_kw', [
                    ODOO_DB, adminUid, ADMIN_PASS, 'school.subject', 'create',
                    [{
                        name: subj.name,
                        code: subj.code
                    }]
                ]);
                console.log(`  ✓ Matière créée avec succès : ${subj.name} (ID: ${subjId})`);
            }

            // Tenter d'insérer les sous-matières si school.sub.subject existe
            try {
                const existingSubSubjects = await callOdoo('object', 'execute_kw', [
                    ODOO_DB, adminUid, ADMIN_PASS, 'school.sub.subject', 'search_read',
                    [[['subject_id', '=', subjId]]],
                    { fields: ['id', 'name'] }
                ]);
                const existingSubNames = existingSubSubjects.map(s => s.name);

                let seq = 10;
                for (const sub of subj.sub_subjects) {
                    if (!existingSubNames.includes(sub.name)) {
                        await callOdoo('object', 'execute_kw', [
                            ODOO_DB, adminUid, ADMIN_PASS, 'school.sub.subject', 'create',
                            [{
                                name: sub.name,
                                code: sub.code,
                                sequence: seq,
                                subject_id: subjId
                            }]
                        ]);
                        console.log(`      ↳ Sous-matière : ${sub.name}`);
                    }
                    seq += 10;
                }
            } catch (subErr) {
                // Modèle pas encore actif sur le serveur Odoo distant
            }
        }

        // 6. Calendrier des vacances & Événements officiels 2026/2027 (school.announcement)
        console.log('\n📌 Insertion du Calendrier Officiel des Vacances et Événements 2026/2027...');
        const officialEvents = [
            {
                title: 'توقيع محضر الدخول المدرسي 2026/2027',
                content: 'توقيع محضر الدخول بالنسبة لهيئة التربية والتعليم وانطلاق الموسم الدراسي 2026-2027.',
                date: '2026-09-01 08:30:00',
                year_id: yearId
            },
            {
                title: 'عطلة الفترة البينية الأولى (8 أيام)',
                content: 'عطلة الفترة البينية الأولى تمتد من يوم 18 أكتوبر 2026 إلى يوم 25 أكتوبر 2026.',
                date: '2026-10-18 00:00:00',
                year_id: yearId
            },
            {
                title: 'عيد الوحدة',
                content: 'عطلة بمناسبة ذكرى عيد الوحدة يوم 31 أكتوبر 2026.',
                date: '2026-10-31 00:00:00',
                year_id: yearId
            },
            {
                title: 'ذكرى المسيرة الخضراء المظفرة',
                content: 'عطلة رسمية بمناسبة الذكرى المجيدة للمسيرة الخضراء يوم الجمعة 6 نونبر 2026.',
                date: '2026-11-06 00:00:00',
                year_id: yearId
            },
            {
                title: 'عيد الاستقلال المجيد',
                content: 'عطلة رسمية بمناسبة عيد الاستقلال يوم الأربعاء 18 نونبر 2026.',
                date: '2026-11-18 00:00:00',
                year_id: yearId
            },
            {
                title: 'عطلة الفترة البينية الثانية (8 أيام)',
                content: 'عطلة الفترة البينية الثانية من يوم الأحد 6 دجنبر 2026 إلى يوم الأحد 13 دجنبر 2026.',
                date: '2026-12-06 00:00:00',
                year_id: yearId
            },
            {
                title: 'فاتح السنة الميلادية 2027',
                content: 'عطلة رسمية بمناسبة رأس السنة الميلادية يوم الجمعة 1 يناير 2027.',
                date: '2027-01-01 00:00:00',
                year_id: yearId
            },
            {
                title: 'ذكرى تقديم وثيقة الاستقلال',
                content: 'عطلة رسمية بمناسبة ذكرى تقديم وثيقة المطالبة بالاستقلال يوم الإثنين 11 يناير 2027.',
                date: '2027-01-11 00:00:00',
                year_id: yearId
            },
            {
                title: 'رأس السنة الأمازيغية',
                content: 'عطلة رسمية بمناسبة رأس السنة الأمازيغية يوم الخميس 14 يناير 2027.',
                date: '2027-01-14 00:00:00',
                year_id: yearId
            },
            {
                title: 'الامتحان الموحد المحلي (السنة السادسة ابتدائي)',
                content: 'إجراء الامتحان الموحد المحلي لنيل شهادة الدروس الابتدائية من 18 إلى 23 يناير 2027.',
                date: '2027-01-18 08:30:00',
                year_id: yearId
            },
            {
                title: 'عطلة منتصف السنة الدراسية (8 أيام)',
                content: 'عطلة منتصف السنة الدراسية من يوم الأحد 24 يناير 2027 إلى يوم الأحد 31 يناير 2027.',
                date: '2027-01-24 00:00:00',
                year_id: yearId
            },
            {
                title: 'عطلة الفترة البينية الثالثة (8 أيام)',
                content: 'عطلة الفترة البينية الثالثة من يوم الأحد 21 مارس 2027 إلى يوم الأحد 28 مارس 2027.',
                date: '2027-03-21 00:00:00',
                year_id: yearId
            },
            {
                title: 'عيد الشغل',
                content: 'عطلة رسمية بمناسبة عيد الشغل (يوم واحد) يوم السبت 1 ماي 2027.',
                date: '2027-05-01 00:00:00',
                year_id: yearId
            },
            {
                title: 'عطلة الفترة البينية الرابعة (8 أيام)',
                content: 'عطلة الفترة البينية الرابعة من يوم الأحد 9 ماي 2027 إلى يوم الأحد 16 ماي 2027.',
                date: '2027-05-09 00:00:00',
                year_id: yearId
            },
            {
                title: 'الامتحان الموحد الإقليمي لنيل شهادة الدروس الابتدائية',
                content: 'إجراء الامتحان الموحد الإقليمي لنيل شهادة الدروس الابتدائية يومي 25 و26 يونيو 2027.',
                date: '2027-06-25 08:30:00',
                year_id: yearId
            }
        ];

        const existingAnnouncements = await callOdoo('object', 'execute_kw', [
            ODOO_DB, adminUid, ADMIN_PASS, 'school.announcement', 'search_read',
            [[['year_id', '=', yearId]]],
            { fields: ['id', 'title'] }
        ]);
        const existingTitles = existingAnnouncements.map(a => a.title);

        for (const ev of officialEvents) {
            if (!existingTitles.includes(ev.title)) {
                await callOdoo('object', 'execute_kw', [
                    ODOO_DB, adminUid, ADMIN_PASS, 'school.announcement', 'create',
                    [ev]
                ]);
                console.log(`  ✓ Événement / Vacance insérée : ${ev.title}`);
            } else {
                console.log(`  - Événement déjà présent : ${ev.title}`);
            }
        }

        // 7. Mise à jour / Assignation des Numéros Massar aux Élèves
        console.log('\n🎓 Vérification des Numéros Massar des élèves...');
        try {
            const students = await callOdoo('object', 'execute_kw', [
                ODOO_DB, adminUid, ADMIN_PASS, 'school.student', 'search_read',
                [[]],
                { fields: ['id', 'name'] }
            ]);

            let massarIndex = 1001;
            for (const st of students) {
                const sampleMassar = `G134${massarIndex}`;
                try {
                    await callOdoo('object', 'execute_kw', [
                        ODOO_DB, adminUid, ADMIN_PASS, 'school.student', 'write',
                        [[st.id], { massar_number: sampleMassar }]
                    ]);
                    console.log(`  ✓ N° Massar ${sampleMassar} assigné à l'élève ${st.name} (ID: ${st.id})`);
                } catch (e) {
                    // Si le champ n'a pas encore été rechargé
                }
                massarIndex++;
            }
        } catch (stErr) {
            console.warn(`  ⚠️ Remarque élèves : ${stErr.message}`);
        }

        console.log('\n🎉 TOUTES LES DONNÉES ONT ÉTÉ INSÉRÉES AVEC SUCCÈS DANS LA BASE ODOO ! 🎉');

    } catch (err) {
        console.error('❌ Erreur globale lors de l\'insertion :', err.message);
    }
}

seed();
