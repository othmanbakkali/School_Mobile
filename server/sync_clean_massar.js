const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const axios = require('axios');
require('dotenv').config({ path: './.env' });

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
    if (str.length === 9) return '0' + str;
    return str;
}

function normalize(s) {
    if (!s) return '';
    return s.toString().trim()
        .replace(/[إأآا]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .replace(/[\u064B-\u065F]/g, '')
        .replace(/\bال/g, '')
        .replace(/\bل/g, '')
        .replace(/\s+/g, ' ');
}

function getTokens(s) {
    return normalize(s).split(' ').filter(w => w.length > 0).sort().join(' ');
}

function isSamePerson(name1, name2) {
    if (!name1 || !name2) return false;
    const n1 = normalize(name1);
    const n2 = normalize(name2);
    if (n1 === n2) return true;
    if (getTokens(n1) === getTokens(n2)) return true;
    const t1 = n1.split(' ').filter(w => w.length > 1);
    const t2 = n2.split(' ').filter(w => w.length > 1);
    const common = t1.filter(w => t2.includes(w)).length;
    return common >= 2 && common === Math.min(t1.length, t2.length);
}

// Map files to levels
const massarFilesConfig = [
    { levelKey: '1APG-1', levelName: '1APG-1 - الأول ابتدائي عام', file: 'export_notesCC_1APG-1_0012.xlsx' },
    { levelKey: '2APG-1', levelName: '2APG-1 - الثاني ابتدائي عام', file: 'export_notesCC_2APG-1_0012.xlsx' },
    { levelKey: '3APG-1', levelName: '3APG-1 - الثالث ابتدائي عام', file: 'Export_58394W_3APG-1_LANGUE ARABE_08062026091857.xlsx' },
    { levelKey: '4APG-1', levelName: '4APG-1 - الرابع ابتدائي عام', file: 'Export_58394W_4APG-1_LANGUE ARABE_08062026091858.xlsx' },
    { levelKey: '6APG-1', levelName: '6APG-1 - السادس ابتدائي عام', file: 'Export_58394W_6APG-1_LANGUE ARABE_03042026092334.xlsx' },
];

async function main() {
    console.log('🚀 DÉMARRAGE DE LA SYNCHRONISATION TOTALE DES ÉLÈVES & MASSAR...\n');
    const uid = await callOdoo('common', 'login', [ODOO_DB, ADMIN_USER, ADMIN_PASS]);

    // 1. Charger le fichier maître pour les parents
    const masterFile = path.join(dataDir, "les Ã©lÃ©ves - les formateurs - l'administrations.xlsx");
    let masterStudents = [];
    if (fs.existsSync(masterFile)) {
        const wb = xlsx.readFile(masterFile);
        masterStudents = xlsx.utils.sheet_to_json(wb.Sheets['التلاميذ']);
        console.log(`✓ Fichier maître chargé : ${masterStudents.length} élèves référencés pour les parents.`);
    }

    // 2. Récupérer les niveaux existants dans Odoo
    const levelsInDb = await callOdoo('object', 'execute_kw', [
        ODOO_DB, uid, ADMIN_PASS, 'school.level', 'search_read',
        [[]],
        { fields: ['id', 'name'] }
    ]);
    const levelMap = {};
    levelsInDb.forEach(l => {
        if (l.name.includes('1APG')) levelMap['1APG-1'] = l.id;
        if (l.name.includes('2APG')) levelMap['2APG-1'] = l.id;
        if (l.name.includes('3APG')) levelMap['3APG-1'] = l.id;
        if (l.name.includes('4APG')) levelMap['4APG-1'] = l.id;
        if (l.name.includes('5APG')) levelMap['5APG-1'] = l.id;
        if (l.name.includes('6APG')) levelMap['6APG-1'] = l.id;
    });
    console.log('✓ Niveaux Odoo mappés :', levelMap);

    // 3. Extraire tous les élèves officiels depuis les fichiers Massar
    const officialStudents = []; // { name, code, birthDate, emsId, levelKey }
    const officialMassarCodes = new Set();

    massarFilesConfig.forEach(cfg => {
        const filePath = path.join(dataDir, cfg.file);
        if (!fs.existsSync(filePath)) {
            console.warn(`Fichier manquant : ${cfg.file}`);
            return;
        }
        const wb = xlsx.readFile(filePath);
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
        
        let count = 0;
        data.forEach(row => {
            let code = null;
            let name = null;
            let emsId = null;
            let birthDate = null;
            row.forEach((cell, idx) => {
                if (typeof cell === 'string') {
                    const t = cell.trim();
                    if (/^[A-Za-z]\d{8,10}$/.test(t)) {
                        code = t.toUpperCase();
                        // emsId often right before code
                        if (idx > 0 && typeof row[idx-1] === 'number') emsId = row[idx-1];
                    } else if (cell && /[\u0600-\u06FF]/.test(cell) && cell.length > 3 && 
                               !cell.includes('المستوى') && !cell.includes('الدورة') && 
                               !cell.includes('مؤسسة') && !cell.includes('مادة') && !cell.includes('الامتحان')) {
                        name = cell.trim();
                    } else if (/\d{2}-\d{2}-\d{4}/.test(cell.trim())) {
                        birthDate = cell.trim();
                    }
                }
            });
            if (code && name) {
                officialStudents.push({
                    name,
                    code,
                    emsId,
                    birthDate,
                    levelKey: cfg.levelKey
                });
                officialMassarCodes.add(code);
                count++;
            }
        });
        console.log(`✓ Classe [${cfg.levelKey}] : ${count} élèves extraits depuis ${cfg.file}`);
    });

    console.log(`\nTotal élèves officiels à synchroniser : ${officialStudents.length}`);

    // 4. Parents Odoo
    const existingParents = await callOdoo('object', 'execute_kw', [
        ODOO_DB, uid, ADMIN_PASS, 'school.parent', 'search_read',
        [[]],
        { fields: ['id', 'name', 'phone'] }
    ]);
    const parentMapByName = new Map();
    existingParents.forEach(p => {
        if (p.name) parentMapByName.set(normalize(p.name), p.id);
    });

    // 5. Récupérer tous les élèves actuels dans Odoo (y compris inactifs)
    const allOdooStudents = await callOdoo('object', 'execute_kw', [
        ODOO_DB, uid, ADMIN_PASS, 'school.student', 'search_read',
        [[]],
        { fields: ['id', 'name', 'massar_number', 'level_id', 'parent_id', 'active'] }
    ]);

    const synchronizedStudentIds = new Set();

    // 6. Synchroniser chaque élève officiel
    for (const item of officialStudents) {
        // Trouver son parent dans masterStudents
        const pMatch = masterStudents.find(ms => isSamePerson(ms['اسم التلميذ/ة'], item.name));
        let parentId = null;

        if (pMatch && pMatch['اسم ولي الأمر']) {
            const rawPName = String(pMatch['اسم ولي الأمر']).trim();
            const rawPhone = formatPhone(pMatch['الهاتف']);
            const pNorm = normalize(rawPName);
            
            if (parentMapByName.has(pNorm)) {
                parentId = parentMapByName.get(pNorm);
                if (rawPhone) {
                    await callOdoo('object', 'execute_kw', [
                        ODOO_DB, uid, ADMIN_PASS, 'school.parent', 'write',
                        [[parentId], { phone: rawPhone }]
                    ]);
                }
            } else {
                parentId = await callOdoo('object', 'execute_kw', [
                    ODOO_DB, uid, ADMIN_PASS, 'school.parent', 'create',
                    [{ name: rawPName, phone: rawPhone }]
                ]);
                parentMapByName.set(pNorm, parentId);
            }
        }

        // Trouver l'élève existant dans Odoo (par code Massar d'abord, ou par nom)
        let odooStudent = allOdooStudents.find(s => s.massar_number === item.code);
        if (!odooStudent) {
            odooStudent = allOdooStudents.find(s => isSamePerson(s.name, item.name));
        }

        const targetLevelId = levelMap[item.levelKey];

        const vals = {
            name: item.name,
            full_name: item.name,
            massar_number: item.code,
            level_id: targetLevelId,
            active: true
        };
        if (item.emsId) vals.ems_id = item.emsId;
        if (parentId) vals.parent_id = parentId;

        if (odooStudent) {
            await callOdoo('object', 'execute_kw', [
                ODOO_DB, uid, ADMIN_PASS, 'school.student', 'write',
                [[odooStudent.id], vals]
            ]);
            synchronizedStudentIds.add(odooStudent.id);
            console.log(`  ✓ Mis à jour : [ID ${odooStudent.id}] "${item.name}" -> ${item.levelKey} | Massar: ${item.code} | Parent ID: ${parentId || 'N/A'}`);
        } else {
            const newId = await callOdoo('object', 'execute_kw', [
                ODOO_DB, uid, ADMIN_PASS, 'school.student', 'create',
                [vals]
            ]);
            synchronizedStudentIds.add(newId);
            console.log(`  ✨ Créé : [ID ${newId}] "${item.name}" -> ${item.levelKey} | Massar: ${item.code} | Parent ID: ${parentId || 'N/A'}`);
        }
    }

    // 7. Nettoyer / Archiver les élèves non conformes ou hors liste (sauf compte de test Othman Bakkali si présent)
    console.log('\n🧹 Nettoyage des élèves hors liste / faux numéros A260000XXX...');
    let archivedCount = 0;

    for (const st of allOdooStudents) {
        if (!synchronizedStudentIds.has(st.id)) {
            // Keep Othman Bakkali's own children active if desired, but archive artificial ones
            if (st.name.includes('BAKKALI')) {
                console.log(`  ℹ️ Élève conservé : [ID ${st.id}] "${st.name}"`);
                continue;
            }
            console.log(`  ❌ Désactivation : [ID ${st.id}] "${st.name}" (Massar: ${st.massar_number})`);
            await callOdoo('object', 'execute_kw', [
                ODOO_DB, uid, ADMIN_PASS, 'school.student', 'write',
                [[st.id], { active: false }]
            ]);
            archivedCount++;
        }
    }

    console.log(`\n🎉 SYNCHRONISATION TERMINÉE AVEC SUCCÈS ! 🎉`);
    console.log(`- Élèves officiels synchronisés : ${synchronizedStudentIds.size}`);
    console.log(`- Élèves hors liste désactivés : ${archivedCount}`);
}

main().catch(console.error);
