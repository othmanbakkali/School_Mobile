const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const ODOO_URL = (process.env.ODOO_URL || 'http://68.183.19.16:8069').replace(/\/+$/, '');
const ODOO_DB = process.env.ODOO_DB || 'alibdaealamia';
const ADMIN_USER = process.env.ODOO_ADMIN_USER || 'othmanbakkali@gmail.com';
const ADMIN_PASS = process.env.ODOO_ADMIN_PASS || 'Admin@2026';

const dataDir = 'C:\\Users\\othma\\OneDrive\\Bureau\\alibdaealamia';

console.log(`🔌 Connexion à Odoo sur ${ODOO_URL} (Base: ${ODOO_DB})...`);

const callOdoo = async (service, method, args, kwargs = {}) => {
    const response = await axios.post(`${ODOO_URL}/jsonrpc`, {
        jsonrpc: '2.0',
        method: 'call',
        params: { service, method, args, kwargs },
        id: Math.floor(Math.random() * 100000)
    });
    if (response.data.error) {
        throw new Error(JSON.stringify(response.data.error));
    }
    return response.data.result;
};

function formatPhone(val) {
    if (!val) return '';
    let str = String(val).trim().replace(/[^\d+]/g, '');
    if (!str) return '';
    if (str.startsWith('+212')) return str;
    if (str.startsWith('212')) return '+' + str;
    if (str.length === 9) {
        return '0' + str;
    }
    return str;
}

function normalizeArabic(str) {
    if (!str) return '';
    return str.toString().trim()
        .replace(/[إأآا]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .replace(/[\u064B-\u065F]/g, '')
        .replace(/\s+/g, ' ');
}

function stripAl(str) {
    return normalizeArabic(str)
        .replace(/\bال/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function getTokens(str) {
    return normalizeArabic(str).split(' ').filter(w => w.length > 0);
}

function getLooseTokens(str) {
    return stripAl(str).split(' ').filter(w => w.length > 0).sort().join(' ');
}

function isSamePerson(name1, name2) {
    if (!name1 || !name2) return false;
    const n1 = normalizeArabic(name1);
    const n2 = normalizeArabic(name2);
    if (n1 === n2) return true;
    
    // Check sorted tokens
    const tok1 = getTokens(n1).sort().join(' ');
    const tok2 = getTokens(n2).sort().join(' ');
    if (tok1 === tok2) return true;
    
    // Check loose tokens (strip 'ال')
    const loose1 = getLooseTokens(n1);
    const loose2 = getLooseTokens(n2);
    if (loose1 === loose2) return true;
    
    // Special known variations
    const specialPairs = [
        ['امينه الريفي شكري', 'الريفي الشكري امينه'],
        ['بيان لقطيبي', 'القطيبي بيان'],
        ['مريم المطلسي', 'مطالسي مريم'],
        ['المودن ريتاج', 'المودن رتاج'],
        ['هاله السياعلي', 'السياعلي هاله'],
        ['المساوي جنى', 'جنى المساوي'],
        ['حسين الوردي', 'الوردي حسين'],
        ['انوار مزيان', 'مزيان انوار'],
        ['ريتاج سلاسي', 'سلاسي ريتاج'],
        ['نور الرياحي', 'الرياحي نور'],
        ['ادم حوداس', 'حوداس ادم'],
        ['لجين الفيلالي', 'الفيلالي لجين'],
        ['دانيه بن حساين بولعيش', 'بن حساين بولعيش دانيه'],
        ['ريماس الخياري', 'الخياري ريماس'],
        ['رزان الحميدي', 'الحميدي رزان'],
        ['محمد الفتوح', 'الفتوح محمد'],
        ['ياسين لبحيره', 'لبحيره ياسين'],
        ['ميساء الشيوه', 'الشيوه ميساء'],
        ['قمر ابن الاشهاب', 'ابن الاشهاب قمر'],
        ['زياد المحسيني', 'المحسيني زياد'],
        ['نعمه امنخفاد', 'امنخفاد نعمه'],
        ['محمد امين الغميكي', 'الغميكي محمد امين'],
        ['اشرف خلو', 'خلو اشرف'],
        ['لقمان الحجاوي', 'الحجاوي لقمان'],
        ['امير الدحيمن', 'الدحيمن امير'],
        ['محمد اشتيوي', 'اشتيوي محمد'],
        ['فردوس بحباح', 'بحباح فردوس'],
        ['الياس طهاري', 'طهاري الياس'],
    ];

    for (const [p1, p2] of specialPairs) {
        if ((n1 === p1 && n2 === p2) || (n1 === p2 && n2 === p1)) return true;
        if ((stripAl(n1) === stripAl(p1) && stripAl(n2) === stripAl(p2)) ||
            (stripAl(n1) === stripAl(p2) && stripAl(n2) === stripAl(p1))) return true;
    }

    return false;
}

async function run() {
    try {
        // 1. Connexion Odoo
        const uid = await callOdoo('common', 'login', [ODOO_DB, ADMIN_USER, ADMIN_PASS]);
        if (!uid) {
            throw new Error('Échec de la connexion à Odoo.');
        }
        console.log(`✅ Authentifié avec succès en tant qu'administrateur (UID: ${uid})`);

        // 2. Année scolaire active 2026-2027
        const years = await callOdoo('object', 'execute_kw', [
            ODOO_DB, uid, ADMIN_PASS, 'school.year', 'search_read',
            [[['name', 'in', ['2026-2027', '2026/2027']]]],
            { fields: ['id', 'name', 'state'] }
        ]);
        let yearId = years.length > 0 ? years[0].id : null;
        if (!yearId) {
            yearId = await callOdoo('object', 'execute_kw', [
                ODOO_DB, uid, ADMIN_PASS, 'school.year', 'create',
                [{ name: '2026-2027', active: true, state: 'open' }]
            ]);
        }
        console.log(`📅 Année scolaire ID: ${yearId} (2026-2027)`);

        // 3. Classes / Niveaux de 1 à 6
        const levelsInDb = await callOdoo('object', 'execute_kw', [
            ODOO_DB, uid, ADMIN_PASS, 'school.level', 'search_read',
            [[]],
            { fields: ['id', 'name'] }
        ]);

        const levelDefinitions = [
            { key: 'الاول', code: '1APG-1', name: '1APG-1 - الأول ابتدائي عام' },
            { key: 'الثاني', code: '2APG-1', name: '2APG-1 - الثاني ابتدائي عام' },
            { key: 'الثالث', code: '3APG-1', name: '3APG-1 - الثالث ابتدائي عام' },
            { key: 'الرابع', code: '4APG-1', name: '4APG-1 - الرابع ابتدائي عام' },
            { key: 'الخامس', code: '5APG-1', name: '5APG-1 - الخامس ابتدائي عام' },
            { key: 'السادس', code: '6APG-1', name: '6APG-1 - السادس ابتدائي عام' },
        ];

        const levelIdMap = new Map();
        for (const ldef of levelDefinitions) {
            let matched = levelsInDb.find(l => l.name.includes(ldef.code) || l.name.includes(ldef.name) || l.name.includes(ldef.key));
            if (matched) {
                levelIdMap.set(ldef.key, matched.id);
                levelIdMap.set(ldef.code, matched.id);
                console.log(`  ✓ Niveau détecté : [${ldef.key}] -> ID ${matched.id} (${matched.name})`);
            } else {
                const newLvlId = await callOdoo('object', 'execute_kw', [
                    ODOO_DB, uid, ADMIN_PASS, 'school.level', 'create',
                    [{ name: ldef.name }]
                ]);
                levelIdMap.set(ldef.key, newLvlId);
                levelIdMap.set(ldef.code, newLvlId);
                console.log(`  ✨ Nouveau niveau créé : [${ldef.key}] ${ldef.name} -> ID ${newLvlId}`);
            }
        }

        // 4. Indexer les fichiers Massar pour enrichir les élèves
        console.log('\n📂 Indexation des fichiers Massar...');
        const allFiles = fs.readdirSync(dataDir).filter(f => f.endsWith('.xlsx') && !f.startsWith('~$'));
        const massarLookup = new Map();

        allFiles.forEach(f => {
            if (f.includes('formateurs') || f.includes('administrations')) return;
            try {
                const wb = xlsx.readFile(path.join(dataDir, f));
                const sheet = wb.Sheets['NotesCC'] || wb.Sheets[wb.SheetNames[0]];
                const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
                for (let r = 17; r < rows.length; r++) {
                    const row = rows[r] || [];
                    const emsId = row[1];
                    const massar = String(row[2] || '').trim();
                    const name = String(row[3] || '').trim();
                    const birthDate = String(row[5] || '').trim();
                    if (massar && name && massar.length >= 4) {
                        massarLookup.set(normalizeArabic(name), {
                            massar,
                            birthDate,
                            emsId: typeof emsId === 'number' ? emsId : parseInt(emsId) || null,
                            rawName: name,
                            file: f
                        });
                    }
                }
            } catch (e) {
                console.warn(`Avertissement lecture ${f}:`, e.message);
            }
        });
        console.log(`  ✓ ${massarLookup.size} élèves indexés depuis Massar`);

        // 5. Charger le fichier principal
        const mainFile = allFiles.find(f => f.includes('formateurs') || f.includes('administrations'));
        if (!mainFile) {
            throw new Error('Fichier principal Excel introuvable !');
        }
        console.log(`\n📗 Lecture du fichier maître : ${mainFile}`);
        const wbMain = xlsx.readFile(path.join(dataDir, mainFile));

        // 6. Formateurs
        console.log('\n--- 1. Importation des Formateurs / Enseignants ---');
        const teachersSheet = wbMain.Sheets['المعلمين'];
        const teachersData = xlsx.utils.sheet_to_json(teachersSheet);
        const existingTeachers = await callOdoo('object', 'execute_kw', [
            ODOO_DB, uid, ADMIN_PASS, 'school.teacher', 'search_read',
            [[]],
            { fields: ['id', 'name', 'phone', 'email'] }
        ]);
        const teacherIdsList = [];

        for (const t of teachersData) {
            const name = String(t['اسم المعلم/ة'] || '').trim();
            const phone = formatPhone(t['رقم الهاتف']);
            const email = String(t['ايميل'] || '').trim();
            if (!name) continue;

            const existing = existingTeachers.find(et => normalizeArabic(et.name) === normalizeArabic(name));
            if (existing) {
                await callOdoo('object', 'execute_kw', [
                    ODOO_DB, uid, ADMIN_PASS, 'school.teacher', 'write',
                    [[existing.id], { name, phone, email }]
                ]);
                teacherIdsList.push(existing.id);
            } else {
                const newTId = await callOdoo('object', 'execute_kw', [
                    ODOO_DB, uid, ADMIN_PASS, 'school.teacher', 'create',
                    [{ name, phone, email }]
                ]);
                teacherIdsList.push(newTId);
            }
        }
        console.log(`  ✓ ${teacherIdsList.length} formateurs synchronisés`);

        // 7. Administration
        console.log('\n--- 2. Importation du Personnel Administratif ---');
        const adminSheet = wbMain.Sheets['الادارة'];
        const adminData = xlsx.utils.sheet_to_json(adminSheet);
        const existingStaff = await callOdoo('object', 'execute_kw', [
            ODOO_DB, uid, ADMIN_PASS, 'school.staff', 'search_read',
            [[]],
            { fields: ['id', 'name', 'role', 'phone', 'email'] }
        ]);
        const staffIdsList = [];

        for (const a of adminData) {
            const name = String(a['الاسم'] || '').trim();
            const phone = formatPhone(a['رقم الهاتف']);
            const email = String(a['ايميل'] || '').trim();
            if (!name) continue;

            let role = 'Administration';
            if (email.toLowerCase().includes('directeur')) role = 'Direction Générale';

            const existing = existingStaff.find(es => normalizeArabic(es.name) === normalizeArabic(name));
            if (existing) {
                await callOdoo('object', 'execute_kw', [
                    ODOO_DB, uid, ADMIN_PASS, 'school.staff', 'write',
                    [[existing.id], { name, role, phone, email }]
                ]);
                staffIdsList.push(existing.id);
            } else {
                const newSId = await callOdoo('object', 'execute_kw', [
                    ODOO_DB, uid, ADMIN_PASS, 'school.staff', 'create',
                    [{ name, role, phone, email }]
                ]);
                staffIdsList.push(newSId);
            }
        }
        console.log(`  ✓ ${staffIdsList.length} membres administratifs synchronisés`);

        // 8. Parents & Élèves
        console.log('\n--- 3. Synchronisation Robuste des Parents & Élèves ---');
        const studentsSheet = wbMain.Sheets['التلاميذ'];
        const studentsData = xlsx.utils.sheet_to_json(studentsSheet);

        const existingParents = await callOdoo('object', 'execute_kw', [
            ODOO_DB, uid, ADMIN_PASS, 'school.parent', 'search_read',
            [[]],
            { fields: ['id', 'name', 'phone'] }
        ]);
        const parentMap = new Map();
        existingParents.forEach(p => {
            if (p.name) parentMap.set(normalizeArabic(p.name), p.id);
        });

        const parentIdByMasterName = new Map();
        for (const row of studentsData) {
            const parentName = String(row['اسم ولي الأمر'] || '').trim();
            const parentPhone = formatPhone(row['الهاتف']);
            if (!parentName) continue;

            const pNorm = normalizeArabic(parentName);
            let parentId = parentMap.get(pNorm);
            if (parentId) {
                if (parentPhone) {
                    await callOdoo('object', 'execute_kw', [
                        ODOO_DB, uid, ADMIN_PASS, 'school.parent', 'write',
                        [[parentId], { phone: parentPhone }]
                    ]);
                }
            } else {
                parentId = await callOdoo('object', 'execute_kw', [
                    ODOO_DB, uid, ADMIN_PASS, 'school.parent', 'create',
                    [{ name: parentName, phone: parentPhone }]
                ]);
                parentMap.set(pNorm, parentId);
            }
            parentIdByMasterName.set(pNorm, parentId);
        }

        const existingStudents = await callOdoo('object', 'execute_kw', [
            ODOO_DB, uid, ADMIN_PASS, 'school.student', 'search_read',
            [[['active', '=', true]]],
            { fields: ['id', 'name', 'full_name', 'level_id', 'parent_id', 'massar_number', 'grade_ids'] }
        ]);

        let updatedStudents = 0;
        let createdStudents = 0;

        for (const row of studentsData) {
            const studentName = String(row['اسم التلميذ/ة'] || '').trim();
            const rawLevel = String(row['المستوى'] || '').trim();
            const parentName = String(row['اسم ولي الأمر'] || '').trim();
            if (!studentName) continue;

            const parentId = parentIdByMasterName.get(normalizeArabic(parentName)) || null;
            const levelId = levelIdMap.get(rawLevel) || false;

            let massarInfo = null;
            for (const [mName, mInf] of massarLookup) {
                if (isSamePerson(mName, studentName)) {
                    massarInfo = mInf;
                    break;
                }
            }
            const massarNumber = massarInfo ? massarInfo.massar : false;
            const emsId = massarInfo && massarInfo.emsId ? massarInfo.emsId : 0;

            const matches = existingStudents.filter(s => isSamePerson(s.name, studentName));

            if (matches.length > 0) {
                const sRec = matches[0];
                const writeVals = {
                    name: studentName,
                    full_name: studentName,
                    level_id: levelId,
                    year_id: yearId,
                    parent_id: parentId,
                    active: true
                };
                if (massarNumber && !sRec.massar_number) writeVals.massar_number = massarNumber;
                if (emsId) writeVals.ems_id = emsId;

                await callOdoo('object', 'execute_kw', [
                    ODOO_DB, uid, ADMIN_PASS, 'school.student', 'write',
                    [[sRec.id], writeVals]
                ]);
                updatedStudents++;
            } else {
                const newSId = await callOdoo('object', 'execute_kw', [
                    ODOO_DB, uid, ADMIN_PASS, 'school.student', 'create',
                    [{
                        name: studentName,
                        full_name: studentName,
                        level_id: levelId,
                        year_id: yearId,
                        parent_id: parentId,
                        massar_number: massarNumber,
                        ems_id: emsId,
                        active: true
                    }]
                ]);
                createdStudents++;
                try {
                    await callOdoo('object', 'execute_kw', [
                        ODOO_DB, uid, ADMIN_PASS, 'school.student', 'action_generate_grade_lines',
                        [[newSId]]
                    ]);
                } catch (eG) {}
            }
        }

        console.log('\n======================================================');
        console.log('🎉 SYNCHRONISATION TERMINÉE AVEC SUCCÈS 🎉');
        console.log(`- Élèves mis à jour : ${updatedStudents}`);
        console.log(`- Nouveaux élèves créés : ${createdStudents}`);
        console.log('======================================================\n');
    } catch (err) {
        console.error('❌ Erreur :', err.message);
    }
}

run();
