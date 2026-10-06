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
    }, { timeout: 15000 });
    if (response.data.error) {
        throw new Error(response.data.error.data?.message || response.data.error.message || JSON.stringify(response.data.error));
    }
    return response.data.result;
};

async function main() {
    try {
        console.log(`🔌 Connexion à Odoo (${ODOO_URL}, DB: ${ODOO_DB})...`);
        const uid = await callOdoo('common', 'login', [ODOO_DB, ADMIN_USER, ADMIN_PASS]);
        console.log(`✅ Connecté en tant qu'administrateur (UID: ${uid})`);

        // 1. Obtenir ou créer les départements
        let depts = await callOdoo('object', 'execute_kw', [
            ODOO_DB, uid, ADMIN_PASS, 'hr.department', 'search_read',
            [[]], { fields: ['id', 'name'] }
        ]);

        let deptTeaching = depts.find(d => d.name.toLowerCase().includes('enseign'));
        if (!deptTeaching) {
            const newId = await callOdoo('object', 'execute_kw', [
                ODOO_DB, uid, ADMIN_PASS, 'hr.department', 'create',
                [{ name: 'Corps Enseignant' }]
            ]);
            deptTeaching = { id: newId, name: 'Corps Enseignant' };
            console.log(`🏢 Département créé: Corps Enseignant (ID: ${newId})`);
        } else {
            console.log(`🏢 Département existant: ${deptTeaching.name} (ID: ${deptTeaching.id})`);
        }

        let deptAdmin = depts.find(d => d.name.toLowerCase().includes('admin'));
        if (!deptAdmin) {
            const newId = await callOdoo('object', 'execute_kw', [
                ODOO_DB, uid, ADMIN_PASS, 'hr.department', 'create',
                [{ name: 'Administration' }]
            ]);
            deptAdmin = { id: newId, name: 'Administration' };
            console.log(`🏢 Département créé: Administration (ID: ${newId})`);
        } else {
            console.log(`🏢 Département existant: ${deptAdmin.name} (ID: ${deptAdmin.id})`);
        }

        // 2. Synchroniser les Professeurs
        const teachers = await callOdoo('object', 'execute_kw', [
            ODOO_DB, uid, ADMIN_PASS, 'school.teacher', 'search_read',
            [[]], { fields: ['id', 'name', 'email', 'phone', 'user_id', 'subject', 'employee_id'] }
        ]);
        console.log(`\n👨‍🏫 Synchronisation de ${teachers.length} professeurs vers hr.employee...`);

        for (const t of teachers) {
            let empId = t.employee_id ? t.employee_id[0] : null;

            if (!empId) {
                // Recherche par user_id, email, ou nom
                let existing = [];
                if (t.user_id) {
                    existing = await callOdoo('object', 'execute_kw', [
                        ODOO_DB, uid, ADMIN_PASS, 'hr.employee', 'search_read',
                        [[['user_id', '=', t.user_id[0]]]], { fields: ['id'] }
                    ]);
                }
                if (existing.length === 0 && t.email) {
                    existing = await callOdoo('object', 'execute_kw', [
                        ODOO_DB, uid, ADMIN_PASS, 'hr.employee', 'search_read',
                        [[['work_email', '=', t.email.trim()]]], { fields: ['id'] }
                    ]);
                }
                if (existing.length === 0 && t.name) {
                    existing = await callOdoo('object', 'execute_kw', [
                        ODOO_DB, uid, ADMIN_PASS, 'hr.employee', 'search_read',
                        [[['name', '=', t.name.trim()]]], { fields: ['id'] }
                    ]);
                }

                if (existing.length > 0) {
                    empId = existing[0].id;
                }
            }

            const jobTitle = t.subject ? `Enseignant (${t.subject})` : 'Enseignant';
            const empVals = {
                name: t.name,
                work_email: t.email || false,
                work_phone: t.phone || false,
                mobile_phone: t.phone || false,
                user_id: t.user_id ? t.user_id[0] : false,
                job_title: jobTitle,
                department_id: deptTeaching.id
            };

            if (empId) {
                await callOdoo('object', 'execute_kw', [
                    ODOO_DB, uid, ADMIN_PASS, 'hr.employee', 'write',
                    [[empId], empVals]
                ]);
            } else {
                empId = await callOdoo('object', 'execute_kw', [
                    ODOO_DB, uid, ADMIN_PASS, 'hr.employee', 'create',
                    [empVals]
                ]);
            }

            // Associer l'employé à la fiche professeur
            await callOdoo('object', 'execute_kw', [
                ODOO_DB, uid, ADMIN_PASS, 'school.teacher', 'write',
                [[t.id], { employee_id: empId }]
            ]);

            console.log(`   ✓ Professeur [ID ${t.id}] "${t.name}" -> Employé Odoo [ID ${empId}] (${jobTitle})`);
        }

        // 3. Synchroniser le Personnel Administratif
        const staffList = await callOdoo('object', 'execute_kw', [
            ODOO_DB, uid, ADMIN_PASS, 'school.staff', 'search_read',
            [[]], { fields: ['id', 'name', 'email', 'phone', 'user_id', 'role', 'employee_id'] }
        ]);
        console.log(`\n🏢 Synchronisation de ${staffList.length} membres administratifs vers hr.employee...`);

        for (const s of staffList) {
            let empId = s.employee_id ? s.employee_id[0] : null;

            if (!empId) {
                let existing = [];
                if (s.user_id) {
                    existing = await callOdoo('object', 'execute_kw', [
                        ODOO_DB, uid, ADMIN_PASS, 'hr.employee', 'search_read',
                        [[['user_id', '=', s.user_id[0]]]], { fields: ['id'] }
                    ]);
                }
                if (existing.length === 0 && s.email) {
                    existing = await callOdoo('object', 'execute_kw', [
                        ODOO_DB, uid, ADMIN_PASS, 'hr.employee', 'search_read',
                        [[['work_email', '=', s.email.trim()]]], { fields: ['id'] }
                    ]);
                }
                if (existing.length === 0 && s.name) {
                    existing = await callOdoo('object', 'execute_kw', [
                        ODOO_DB, uid, ADMIN_PASS, 'hr.employee', 'search_read',
                        [[['name', '=', s.name.trim()]]], { fields: ['id'] }
                    ]);
                }

                if (existing.length > 0) {
                    empId = existing[0].id;
                }
            }

            const jobTitle = s.role || 'Personnel Administratif';
            const empVals = {
                name: s.name,
                work_email: s.email || false,
                work_phone: s.phone || false,
                mobile_phone: s.phone || false,
                user_id: s.user_id ? s.user_id[0] : false,
                job_title: jobTitle,
                department_id: deptAdmin.id
            };

            if (empId) {
                await callOdoo('object', 'execute_kw', [
                    ODOO_DB, uid, ADMIN_PASS, 'hr.employee', 'write',
                    [[empId], empVals]
                ]);
            } else {
                empId = await callOdoo('object', 'execute_kw', [
                    ODOO_DB, uid, ADMIN_PASS, 'hr.employee', 'create',
                    [empVals]
                ]);
            }

            // Associer l'employé à la fiche staff
            await callOdoo('object', 'execute_kw', [
                ODOO_DB, uid, ADMIN_PASS, 'school.staff', 'write',
                [[s.id], { employee_id: empId }]
            ]);

            console.log(`   ✓ Staff [ID ${s.id}] "${s.name}" -> Employé Odoo [ID ${empId}] (${jobTitle})`);
        }

        // 4. Rapport global
        const totalEmployees = await callOdoo('object', 'execute_kw', [
            ODOO_DB, uid, ADMIN_PASS, 'hr.employee', 'search_count',
            [[]]
        ]);

        console.log('\n======================================================');
        console.log(`🎉 SYNCHRONISATION TERMINÉE !`);
        console.log(`   - Total employés dans Odoo (hr.employee) : ${totalEmployees}`);
        console.log(`   - Professeurs liés : ${teachers.length}`);
        console.log(`   - Personnel administratif lié : ${staffList.length}`);
        console.log('======================================================');

    } catch (e) {
        console.error('❌ Erreur:', e.message);
    }
}

main();
