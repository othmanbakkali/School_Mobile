const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const axios = require('axios');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const ODOO_URL = (process.env.ODOO_URL || 'http://68.183.19.16:8069').replace(/\/+$/, '');
const ODOO_DB = process.env.ODOO_DB || 'alibdaealamia';
const ADMIN_USER = process.env.ODOO_ADMIN_USER || 'othmanbakkali@gmail.com';
const ADMIN_PASS = process.env.ODOO_ADMIN_PASS || 'Admin@2026';

const dataDir = 'C:\\Users\\othma\\OneDrive\\Bureau\\alibdaealamia';

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

async function runFix() {
    console.log('🚀 DÉMARRAGE DE LA MISE À JOUR COMPLÈTE DES PARENTS ET ÉLÈVES...\n');

    // 1. Connexion Odoo
    const uid = await callOdoo('common', 'login', [ODOO_DB, ADMIN_USER, ADMIN_PASS]);
    console.log(`✅ Connecté à Odoo (UID: ${uid})`);

    // 2. Année scolaire active 2026-2027
    const years = await callOdoo('object', 'execute_kw', [
        ODOO_DB, uid, ADMIN_PASS, 'school.year', 'search_read',
        [[['name', 'in', ['2026-2027', '2026/2027']]]],
        { fields: ['id', 'name', 'state'] }
    ]);
    const yearId = years.length > 0 ? years[0].id : null;
    console.log(`📅 Année scolaire ID: ${yearId}`);

    // 3. Niveaux scolaires
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
        }
    }

    // 4. Indexer les fichiers Massar
    console.log('📂 Lecture des fichiers Massar...');
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

    // 5. Charger le fichier maître
    const mainFile = allFiles.find(f => f.includes('formateurs') || f.includes('administrations'));
    const wbMain = xlsx.readFile(path.join(dataDir, mainFile));
    const masterStudents = xlsx.utils.sheet_to_json(wbMain.Sheets['التلاميذ']);
    console.log(`  ✓ ${masterStudents.length} élèves trouvés dans le fichier principal (les élèves - ...)`);

    // 6. Charger tous les parents existants dans Odoo
    const existingParents = await callOdoo('object', 'execute_kw', [
        ODOO_DB, uid, ADMIN_PASS, 'school.parent', 'search_read',
        [[]],
        { fields: ['id', 'name', 'phone', 'email'] }
    ]);
    const parentMap = new Map(); // normalized name -> parentId
    existingParents.forEach(p => {
        if (p.name) {
            parentMap.set(normalizeArabic(p.name), p.id);
            if (p.phone) parentMap.set(`${normalizeArabic(p.name)}_${p.phone}`, p.id);
        }
    });

    // Créer / Mettre à jour les parents depuis le fichier principal
    console.log('\n👨‍👩‍👧 SYNCHRONISATION DES PARENTS...');
    const parentIdByMasterName = new Map();

    for (const row of masterStudents) {
        const parentName = String(row['اسم ولي الأمر'] || '').trim();
        const parentPhone = formatPhone(row['الهاتف']);
        if (!parentName) continue;

        const pNorm = normalizeArabic(parentName);
        let parentId = parentMap.get(pNorm) || parentMap.get(`${pNorm}_${parentPhone}`);

        if (parentId) {
            // Mettre à jour le téléphone si manquant ou formaté
            const existingP = existingParents.find(ep => ep.id === parentId);
            if (existingP && parentPhone && existingP.phone !== parentPhone) {
                await callOdoo('object', 'execute_kw', [
                    ODOO_DB, uid, ADMIN_PASS, 'school.parent', 'write',
                    [[parentId], { phone: parentPhone }]
                ]);
            }
        } else {
            // Créer nouveau parent
            parentId = await callOdoo('object', 'execute_kw', [
                ODOO_DB, uid, ADMIN_PASS, 'school.parent', 'create',
                [{ name: parentName, phone: parentPhone }]
            ]);
            parentMap.set(pNorm, parentId);
            parentMap.set(`${pNorm}_${parentPhone}`, parentId);
            console.log(`  ✨ Nouveau parent créé : [ID ${parentId}] ${parentName} (${parentPhone})`);
        }
        parentIdByMasterName.set(pNorm, parentId);
    }
    console.log(`  ✓ Total parents synchronisés : ${parentIdByMasterName.size}`);

    // 7. Charger tous les élèves existants dans Odoo avec leurs détails
    const existingOdooStudents = await callOdoo('object', 'execute_kw', [
        ODOO_DB, uid, ADMIN_PASS, 'school.student', 'search_read',
        [[]],
        { fields: ['id', 'name', 'full_name', 'level_id', 'parent_id', 'massar_number', 'grade_ids', 'grade_summary_ids'] }
    ]);
    console.log(`\n📚 Total élèves actuels dans Odoo : ${existingOdooStudents.length}`);

    // 8. Fusion des doublons et assignation correcte des parents
    console.log('\n🔄 TRAITEMENT ET FUSION DES ÉLÈVES...');
    let updatedCount = 0;
    let mergedCount = 0;
    const processedOdooStudentIds = new Set();
    const studentsToDelete = [];

    for (const mst of masterStudents) {
        const rawStudentName = String(mst['اسم التلميذ/ة'] || '').trim();
        const rawParentName = String(mst['اسم ولي الأمر'] || '').trim();
        const rawParentPhone = formatPhone(mst['الهاتف']);
        const rawLevel = String(mst['المستوى'] || '').trim();

        const parentId = parentIdByMasterName.get(normalizeArabic(rawParentName)) || null;
        const levelId = levelIdMap.get(rawLevel) || false;

        // Trouver Massar info
        let massarInfo = null;
        for (const [mName, mInf] of massarLookup) {
            if (isSamePerson(mName, rawStudentName)) {
                massarInfo = mInf;
                break;
            }
        }
        const massarNumber = massarInfo ? massarInfo.massar : false;
        const emsId = massarInfo && massarInfo.emsId ? massarInfo.emsId : 0;

        // Trouver tous les enregistrements correspondants dans Odoo
        const matches = existingOdooStudents.filter(s => isSamePerson(s.name, rawStudentName));

        if (matches.length === 0) {
            // Créer si inexistant
            const newStudentId = await callOdoo('object', 'execute_kw', [
                ODOO_DB, uid, ADMIN_PASS, 'school.student', 'create',
                [{
                    name: rawStudentName,
                    full_name: rawStudentName,
                    level_id: levelId,
                    year_id: yearId,
                    parent_id: parentId,
                    massar_number: massarNumber,
                    ems_id: emsId,
                    active: true
                }]
            ]);
            processedOdooStudentIds.add(newStudentId);
            console.log(`  ✨ Nouvel élève créé : [ID ${newStudentId}] ${rawStudentName} | Parent: ${rawParentName}`);
            try {
                await callOdoo('object', 'execute_kw', [
                    ODOO_DB, uid, ADMIN_PASS, 'school.student', 'action_generate_grade_lines',
                    [[newStudentId]]
                ]);
            } catch (e) {}
        } else if (matches.length === 1) {
            // Un seul enregistrement -> Mettre à jour avec le bon parent, niveau et Massar
            const studentRec = matches[0];
            const writeVals = {
                parent_id: parentId,
                level_id: levelId,
                year_id: yearId,
                active: true
            };
            if (massarNumber && !studentRec.massar_number) writeVals.massar_number = massarNumber;
            if (emsId) writeVals.ems_id = emsId;

            await callOdoo('object', 'execute_kw', [
                ODOO_DB, uid, ADMIN_PASS, 'school.student', 'write',
                [[studentRec.id], writeVals]
            ]);
            processedOdooStudentIds.add(studentRec.id);
            updatedCount++;
            console.log(`  ✓ Mis à jour : [ID ${studentRec.id}] "${rawStudentName}" -> Parent: "${rawParentName}" (ID ${parentId}) | Massar: ${studentRec.massar_number || massarNumber || 'N/A'}`);
            
            // Regénérer les notes si besoin
            if (studentRec.grade_ids.length === 0) {
                try {
                    await callOdoo('object', 'execute_kw', [
                        ODOO_DB, uid, ADMIN_PASS, 'school.student', 'action_generate_grade_lines',
                        [[studentRec.id]]
                    ]);
                } catch (e) {}
            }
        } else {
            // DOUBLONS DÉTECTÉS !
            // Choisir le meilleur enregistrement principal (celui qui a le plus de notes, ou massar)
            matches.sort((a, b) => (b.grade_ids.length || 0) - (a.grade_ids.length || 0));
            const primary = matches[0];
            const duplicates = matches.slice(1);

            // Récupérer le massar s'il était sur un autre
            const existingMassar = matches.find(m => m.massar_number && m.massar_number.length > 3)?.massar_number || massarNumber;

            const writeVals = {
                name: rawStudentName,
                full_name: rawStudentName,
                parent_id: parentId,
                level_id: levelId,
                year_id: yearId,
                active: true
            };
            if (existingMassar) writeVals.massar_number = existingMassar;
            if (emsId) writeVals.ems_id = emsId;

            await callOdoo('object', 'execute_kw', [
                ODOO_DB, uid, ADMIN_PASS, 'school.student', 'write',
                [[primary.id], writeVals]
            ]);
            processedOdooStudentIds.add(primary.id);

            // Déplacer les éventuelles notes / notes summaries des doublons vers le principal s'il en manquait
            for (const dup of duplicates) {
                if (dup.grade_ids && dup.grade_ids.length > 0 && primary.grade_ids.length === 0) {
                    await callOdoo('object', 'execute_kw', [
                        ODOO_DB, uid, ADMIN_PASS, 'school.grade', 'write',
                        [dup.grade_ids, { student_id: primary.id }]
                    ]);
                }
                studentsToDelete.push(dup.id);
            }
            mergedCount++;
            console.log(`  🔀 FUSION : Principal [ID ${primary.id}] "${rawStudentName}" conservé avec Parent "${rawParentName}" (ID ${parentId}) | Supprimé doublon(s): [${duplicates.map(d=>d.id).join(', ')}]`);
        }
    }

    // Supprimer les doublons nettoyés
    if (studentsToDelete.length > 0) {
        console.log(`\n🗑️ Suppression de ${studentsToDelete.length} doublons superflus...`);
        for (const sId of studentsToDelete) {
            try {
                await callOdoo('object', 'execute_kw', [
                    ODOO_DB, uid, ADMIN_PASS, 'school.student', 'unlink',
                    [[sId]]
                ]);
            } catch (delErr) {
                console.warn(`  ⚠️ Impossible de supprimer ID ${sId}, désactivation:`, delErr.message);
                await callOdoo('object', 'execute_kw', [
                    ODOO_DB, uid, ADMIN_PASS, 'school.student', 'write',
                    [[sId], { active: false }]
                ]);
            }
        }
    }

    // 9. Traitement des élèves restants non présents dans le fichier maître
    console.log('\n🔎 VÉRIFICATION DES ÉLÈVES HORS FICHIER MAÎTRE...');
    // Recharger la liste des élèves
    const remainingStudents = await callOdoo('object', 'execute_kw', [
        ODOO_DB, uid, ADMIN_PASS, 'school.student', 'search_read',
        [[['id', 'not in', Array.from(processedOdooStudentIds)], ['active', '=', true]]],
        { fields: ['id', 'name', 'parent_id', 'level_id', 'massar_number'] }
    ]);

    console.log(`Nombre d'élèves restants hors liste principale : ${remainingStudents.length}`);

    // Dictionnaire des correspondances de fratrie pour les élèves restants
    const siblingParentRules = [
        { pattern: 'الدوق', parentName: 'عبد العزيز الدوق' },
        { pattern: 'خربوش', parentName: 'محمد خربوش' },
        { pattern: 'بوكطيرة', parentName: 'ياسين بوكطيرة' },
        { pattern: 'كوزي', parentName: 'كوزي عبد الكامل' },
        { pattern: 'الحوزي', parentName: 'الحوزي أجناي عمر' },
        { pattern: 'مهيم', parentName: 'محمد مهيم' },
        { pattern: 'القبيب', parentName: 'القبيب عبد الرحيم' },
        { pattern: 'العسري', parentName: 'العسري عمر' },
        { pattern: 'الخياري', parentName: 'الخيار محسن' },
        { pattern: 'بالحمر', parentName: 'بالحمر عبد الله' },
        { pattern: 'الريفي', parentName: 'بلال الريفي شكري' },
        { pattern: 'المودن', parentName: 'محمد المودن' },
        { pattern: 'المحسيني', parentName: 'عماد المحسيني' },
        { pattern: 'سلاسي', parentName: 'محمد سلاسي' },
        { pattern: 'السياعلي', parentName: 'الشواي' },
        { pattern: 'المساوي', parentName: 'المصطفى المساوي' },
        { pattern: 'الوردي', parentName: 'خالد الوردي' },
        { pattern: 'مزيان', parentName: 'مزيان حفيظ' },
        { pattern: 'حوداس', parentName: 'يوسف حوداس' },
        { pattern: 'الفيلالي', parentName: 'جواد الفلالي' },
        { pattern: 'الحميدي', parentName: 'محمد الحميدي' },
        { pattern: 'الفتوح', parentName: 'أحمد الفتوح' },
        { pattern: 'لبحيرة', parentName: 'جلال لبحيرة' },
        { pattern: 'الشيوة', parentName: 'دعاء امزيان' },
        { pattern: 'الاشهاب', parentName: 'محمد ابن الأشهب' },
        { pattern: 'امنخفاد', parentName: 'بدر الدين امنخفاد' },
        { pattern: 'الغميكي', parentName: 'عزيز الغميكي' },
        { pattern: 'الحجاوي', parentName: 'الطيب الحجاوي' },
        { pattern: 'الدحيمن', parentName: 'صابر الدحيمن' },
        { pattern: 'اشتيوي', parentName: 'سعيد اشتيوي' },
        { pattern: 'بحباح', parentName: 'سمير بحباح' },
        { pattern: 'طهاري', parentName: 'سعيد طهاري' },
    ];

    for (const rem of remainingStudents) {
        // Ignorer les enfants réels de test d'Othman Bakkali
        if (rem.name.includes('BAKKALI')) {
            console.log(`  ℹ️ Élève test conservé avec Othman Bakkali : [ID ${rem.id}] ${rem.name}`);
            continue;
        }

        // Vérifier si une règle de fratrie s'applique
        let matchedParentId = null;
        let matchedParentName = null;

        for (const rule of siblingParentRules) {
            if (rem.name.includes(rule.pattern)) {
                matchedParentId = parentIdByMasterName.get(normalizeArabic(rule.parentName));
                matchedParentName = rule.parentName;
                if (matchedParentId) break;
            }
        }

        if (matchedParentId) {
            await callOdoo('object', 'execute_kw', [
                ODOO_DB, uid, ADMIN_PASS, 'school.student', 'write',
                [[rem.id], { parent_id: matchedParentId }]
            ]);
            console.log(`  👨‍👧 Fratrie liée : [ID ${rem.id}] "${rem.name}" -> Parent: "${matchedParentName}" (ID ${matchedParentId})`);
        } else {
            // Si pas de parent trouvé dans le fichier, créer un parent dédié ou détacher de Parent 1
            const pName = `ولي أمر ${rem.name}`;
            let newPId = parentMap.get(normalizeArabic(pName));
            if (!newPId) {
                newPId = await callOdoo('object', 'execute_kw', [
                    ODOO_DB, uid, ADMIN_PASS, 'school.parent', 'create',
                    [{ name: pName }]
                ]);
                parentMap.set(normalizeArabic(pName), newPId);
            }
            await callOdoo('object', 'execute_kw', [
                ODOO_DB, uid, ADMIN_PASS, 'school.student', 'write',
                [[rem.id], { parent_id: newPId }]
            ]);
            console.log(`  🆕 Parent créé pour élève Massar : [ID ${rem.id}] "${rem.name}" -> Parent: "${pName}" (ID ${newPId})`);
        }
    }

    // 10. Rapport final
    const finalStudents = await callOdoo('object', 'execute_kw', [
        ODOO_DB, uid, ADMIN_PASS, 'school.student', 'search_read',
        [[['active', '=', true]]],
        { fields: ['id', 'name', 'parent_id', 'level_id', 'massar_number'] }
    ]);
    const finalParents = await callOdoo('object', 'execute_kw', [
        ODOO_DB, uid, ADMIN_PASS, 'school.parent', 'search_read',
        [[]],
        { fields: ['id', 'name', 'phone', 'student_ids'] }
    ]);

    const p1Final = finalStudents.filter(s => s.parent_id && s.parent_id[0] === 1);

    console.log('\n======================================================');
    console.log('🎉 RAPPORT FINAL DE SYNCHRONISATION DES PARENTS 🎉');
    console.log('======================================================');
    console.log(`- Total élèves actifs dans Odoo : ${finalStudents.length}`);
    console.log(`- Total parents dans Odoo        : ${finalParents.length}`);
    console.log(`- Élèves assignés à Othman Bakkali (Parent 1) : ${p1Final.length} (${p1Final.map(s=>s.name).join(', ')})`);
    console.log(`- Doublons fusionnés & nettoyés : ${mergedCount}`);
    console.log('======================================================\n');
}

runFix().catch(console.error);
