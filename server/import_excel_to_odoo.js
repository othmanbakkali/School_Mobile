const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const rawOdooUrl = process.env.ODOO_URL || 'http://68.183.19.16:8069';
const ODOO_URL = rawOdooUrl.replace(/\/+$/, '');
const ODOO_DB = process.env.ODOO_DB || 'alibdaealamia';
const ADMIN_USER = process.env.ODOO_ADMIN_USER || 'othmanbakkali@gmail.com';
const ADMIN_PASS = process.env.ODOO_ADMIN_PASS || 'Admin@2026';

const dir = 'C:\\Users\\othma\\OneDrive\\Bureau\\alibdaealamia';

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
        // 1. Connexion Odoo
        const adminUid = await callOdoo('common', 'login', [ODOO_DB, ADMIN_USER, ADMIN_PASS]);
        if (!adminUid) {
            console.error('❌ Échec de la connexion à Odoo.');
            return;
        }
        console.log(`✅ Authentifié avec succès en tant qu'administrateur (UID: ${adminUid})`);

        // 2. Année scolaire active 2026-2027
        const years = await callOdoo('object', 'execute_kw', [
            ODOO_DB, adminUid, ADMIN_PASS, 'school.year', 'search_read',
            [[['name', 'in', ['2026-2027', '2026/2027']]]],
            { fields: ['id', 'name'] }
        ]);
        let yearId = years.length > 0 ? years[0].id : null;
        if (!yearId) {
            yearId = await callOdoo('object', 'execute_kw', [
                ODOO_DB, adminUid, ADMIN_PASS, 'school.year', 'create',
                [{ name: '2026-2027', active: true, state: 'open' }]
            ]);
        }
        console.log(`📅 Année scolaire ID : ${yearId}`);

        // 3. Parser tous les fichiers Excel
        const files = fs.readdirSync(dir).filter(f => f.endsWith('.xlsx') && !f.startsWith('~$'));
        console.log(`📂 Lecture de ${files.length} fichiers Excel...`);

        const allStudentsMap = new Map();
        const classesMap = new Map();
        const teachersSet = new Set();

        files.forEach(f => {
            const wb = xlsx.readFile(path.join(dir, f));
            const sheet = wb.Sheets['NotesCC'] || wb.Sheets[wb.SheetNames[0]];
            const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
            
            let classCode = '';
            let levelName = '';
            let teacher = '';

            for (let i = 0; i < 14; i++) {
                const r = rows[i] || [];
                for (let j = 0; j < r.length; j++) {
                    const cell = String(r[j] || '').trim();
                    if (cell.includes('المستوى')) levelName = String(r[j+1] || '').trim();
                    if (cell.includes('القسم')) classCode = String(r[j+2] || r[j+1] || '').trim();
                    if (cell.includes('الاستاذ') || cell.includes('الأستاذ')) teacher = String(r[j+2] || r[j+1] || '').trim();
                }
            }

            if (classCode) {
                classesMap.set(classCode, levelName || classCode);
            }
            if (teacher) {
                teachersSet.add(teacher);
            }

            for (let r = 17; r < rows.length; r++) {
                const row = rows[r] || [];
                const emsId = row[1];
                const massar = String(row[2] || '').trim();
                const name = String(row[3] || '').trim();
                const birthDate = String(row[5] || '').trim();

                if (massar && name && massar.length >= 4) {
                    if (!allStudentsMap.has(massar)) {
                        allStudentsMap.set(massar, {
                            name,
                            massar_number: massar,
                            ems_id: typeof emsId === 'number' ? emsId : parseInt(emsId) || null,
                            birth_date: birthDate,
                            class_code: classCode,
                            level_name: levelName
                        });
                    }
                }
            }
        });

        console.log(`\n🏫 Classes détectées : ${classesMap.size}`);
        console.log(`👨‍🏫 Enseignants détectés : ${teachersSet.size}`);
        console.log(`🎓 Total Élèves uniques à insérer : ${allStudentsMap.size}`);

        // 4. Synchroniser / Créer les Classes (school.level)
        console.log('\n--- 1. Synchronisation des Classes ---');
        const existingLevels = await callOdoo('object', 'execute_kw', [
            ODOO_DB, adminUid, ADMIN_PASS, 'school.level', 'search_read',
            [[]],
            { fields: ['id', 'name'] }
        ]);

        const levelIdByCode = new Map();

        for (const [code, desc] of classesMap.entries()) {
            const formattedName = `${code} - ${desc}`;
            let matched = existingLevels.find(l => l.name.includes(code) || code.includes(l.name));
            
            if (matched) {
                levelIdByCode.set(code, matched.id);
                console.log(`  ✓ Classe existante : [${code}] -> ID ${matched.id} (${matched.name})`);
            } else {
                const newLvlId = await callOdoo('object', 'execute_kw', [
                    ODOO_DB, adminUid, ADMIN_PASS, 'school.level', 'create',
                    [{ name: formattedName }]
                ]);
                levelIdByCode.set(code, newLvlId);
                console.log(`  ✓ Nouvelle classe créée : [${code}] ${formattedName} -> ID ${newLvlId}`);
            }
        }

        // 5. Synchroniser / Créer les Enseignants (school.teacher)
        console.log('\n--- 2. Synchronisation des Enseignants ---');
        for (const tName of teachersSet) {
            try {
                const existingTeachers = await callOdoo('object', 'execute_kw', [
                    ODOO_DB, adminUid, ADMIN_PASS, 'school.teacher', 'search_read',
                    [[['name', '=', tName]]],
                    { fields: ['id', 'name'] }
                ]);
                if (existingTeachers.length === 0) {
                    const newTId = await callOdoo('object', 'execute_kw', [
                        ODOO_DB, adminUid, ADMIN_PASS, 'school.teacher', 'create',
                        [{ name: tName }]
                    ]);
                    console.log(`  ✓ Enseignant créé : ${tName} -> ID ${newTId}`);
                } else {
                    console.log(`  - Enseignant déjà présent : ${tName}`);
                }
            } catch (e) {
                console.warn(`  ⚠️ Remarque prof : ${e.message}`);
            }
        }

        // 6. Parent par défaut / Responsable pour rattachement initial
        let defaultParentId = null;
        try {
            const parents = await callOdoo('object', 'execute_kw', [
                ODOO_DB, adminUid, ADMIN_PASS, 'school.parent', 'search_read',
                [[]],
                { fields: ['id', 'name'], limit: 1 }
            ]);
            if (parents.length > 0) {
                defaultParentId = parents[0].id;
            } else {
                defaultParentId = await callOdoo('object', 'execute_kw', [
                    ODOO_DB, adminUid, ADMIN_PASS, 'school.parent', 'create',
                    [{ name: 'Parents d\'élèves Al Ibdae', email: 'parent@alibdaealamia.ma', phone: '0600000000' }]
                ]);
            }
        } catch (e) {
            console.warn(`  ⚠️ Remarque parent : ${e.message}`);
        }

        // 7. Insérer / Mettre à jour les 101 Élèves dans Odoo
        console.log('\n--- 3. Insertion des 101 Élèves dans school.student ---');
        let existingStudents = [];
        try {
            existingStudents = await callOdoo('object', 'execute_kw', [
                ODOO_DB, adminUid, ADMIN_PASS, 'school.student', 'search_read',
                [[]],
                { fields: ['id', 'name'] }
            ]);
        } catch (e) {
            console.warn('Erreur search_read students:', e.message);
        }

        const studentByName = new Map();
        existingStudents.forEach(st => {
            if (st.name) studentByName.set(st.name.trim(), st);
        });

        let insertedCount = 0;
        let updatedCount = 0;

        for (const [massar, data] of allStudentsMap.entries()) {
            const levelId = levelIdByCode.get(data.class_code) || false;
            const fullVals = {
                name: data.name,
                full_name: data.name,
                massar_number: data.massar_number,
                level_id: levelId,
                year_id: yearId,
            };
            const simpleVals = {
                name: data.name,
                full_name: data.name,
                level_id: levelId,
                year_id: yearId,
            };

            let existing = studentByName.get(data.name);

            if (existing) {
                try {
                    await callOdoo('object', 'execute_kw', [
                        ODOO_DB, adminUid, ADMIN_PASS, 'school.student', 'write',
                        [[existing.id], fullVals]
                    ]);
                    updatedCount++;
                    console.log(`  ✓ Mis à jour [${massar}] ${data.name} (Classe: ${data.class_code}) -> ID ${existing.id}`);
                } catch (errWrite) {
                    await callOdoo('object', 'execute_kw', [
                        ODOO_DB, adminUid, ADMIN_PASS, 'school.student', 'write',
                        [[existing.id], simpleVals]
                    ]);
                    updatedCount++;
                    console.log(`  ✓ Mis à jour (standard) [${massar}] ${data.name} -> ID ${existing.id}`);
                }
            } else {
                try {
                    const newId = await callOdoo('object', 'execute_kw', [
                        ODOO_DB, adminUid, ADMIN_PASS, 'school.student', 'create',
                        [{ ...fullVals, parent_id: defaultParentId }]
                    ]);
                    insertedCount++;
                    console.log(`  ✨ Créé [${massar}] ${data.name} (Classe: ${data.class_code}) -> ID ${newId}`);
                } catch (errCreate) {
                    const newId = await callOdoo('object', 'execute_kw', [
                        ODOO_DB, adminUid, ADMIN_PASS, 'school.student', 'create',
                        [{ ...simpleVals, parent_id: defaultParentId }]
                    ]);
                    insertedCount++;
                    console.log(`  ✨ Créé (standard) [${massar}] ${data.name} -> ID ${newId}`);
                }
            }
        }

        console.log(`\n======================================================`);
        console.log(`🎉 INTÉGRATION TERMINÉE AVEC SUCCÈS ! 🎉`);
        console.log(`- Nouveaux élèves créés : ${insertedCount}`);
        console.log(`- Élèves mis à jour : ${updatedCount}`);
        console.log(`- Total élèves dans la base : ${allStudentsMap.size}`);
        console.log(`======================================================`);

    } catch (err) {
        console.error('❌ Erreur globale lors de l\'intégration :', err.message);
    }
}

main();
