
const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const ODOO_URL = process.env.ODOO_URL;
const ODOO_DB = process.env.ODOO_DB;
const ADMIN_USER = process.env.ODOO_ADMIN_USER;
const ADMIN_PASS = process.env.ODOO_ADMIN_PASS;

let ADMIN_UID = null;

const getAdminUid = async () => {
    if (ADMIN_UID) return ADMIN_UID;
    try {
        const response = await axios.post(`${ODOO_URL}/jsonrpc`, {
            jsonrpc: '2.0',
            method: 'call',
            params: { service: 'common', method: 'login', args: [ODOO_DB, ADMIN_USER, ADMIN_PASS] },
            id: 1
        });
        if (!response.data.result) {
            throw new Error("Échec de la connexion Admin à Odoo. Vérifiez ODOO_DB, ADMIN_USER et ADMIN_PASS dans server/.env");
        }
        ADMIN_UID = response.data.result;
        return ADMIN_UID;
    } catch (e) { 
        console.error("❌ Admin login failed:", e.message); 
        throw new Error("Le serveur n'a pas pu se connecter à Odoo (Admin).");
    }
};

const callOdoo = async (service, method, args, kwargs = {}) => {
    try {
        const response = await axios.post(`${ODOO_URL}/jsonrpc`, {
            jsonrpc: '2.0',
            method: 'call',
            params: { service, method, args, kwargs },
            id: Math.floor(Math.random() * 1000)
        });
        if (response.data.error) throw new Error(response.data.error.data.message);
        return response.data.result;
    } catch (error) { throw error; }
};

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body; // username = email, password = phone
    try {
        const adminUid = await getAdminUid();
        // Rechercher le parent avec cet email et ce téléphone
        const parents = await callOdoo('object', 'execute_kw', [
            ODOO_DB, adminUid, ADMIN_PASS, 'school.parent', 'search_read', 
            [[['email', '=', username], ['phone', '=', password]]], 
            { fields: ['id', 'name', 'email'] }
        ]);

        if (parents && parents.length > 0) {
            const parent = parents[0];
            res.json({ success: true, uid: parent.id, name: parent.name, email: parent.email });
        } else {
            res.status(401).json({ success: false, message: "Email ou numéro de téléphone incorrect" });
        }
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

app.post('/api/school/student', async (req, res) => {
    const { email } = req.body;
    try {
        const adminUid = await getAdminUid();
        const result = await callOdoo('object', 'execute_kw', [
            ODOO_DB, adminUid, ADMIN_PASS, 'school.student', 'search_read', 
            [[['parent_id.email', '=', email]]], 
            { fields: ['name', 'full_name', 'display_name', 'level_id', 'parent_id', 'average_grade', 'photo'] }
        ]);
        res.json(result);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/school/homework', async (req, res) => {
    const { student_id } = req.body;
    try {
        const adminUid = await getAdminUid();
        const result = await callOdoo('object', 'execute_kw', [
            ODOO_DB, adminUid, ADMIN_PASS, 'school.homework', 'search_read', 
            [[['student_id', '=', parseInt(student_id)]]], 
            { fields: ['id', 'title', 'description', 'date_due', 'state', 'subject', 'attachment', 'attachment_name'] }
        ]);
        res.json(result);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/school/homework/status', async (req, res) => {
    const { homework_id, state } = req.body;
    try {
        const adminUid = await getAdminUid();
        await callOdoo('object', 'execute_kw', [
            ODOO_DB, adminUid, ADMIN_PASS, 'school.homework', 'write', 
            [[parseInt(homework_id)], { state }]
        ]);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/school/notifications', async (req, res) => {
    const { student_id } = req.body;
    try {
        const adminUid = await getAdminUid();
        // On récupère les messages récents sur le profil de l'élève (notifications)
        const result = await callOdoo('object', 'execute_kw', [
            ODOO_DB, adminUid, ADMIN_PASS, 'mail.message', 'search_read', 
            [[['model', '=', 'school.student'], ['res_id', '=', parseInt(student_id)]]], 
            { fields: ['id', 'body', 'date'], order: 'date desc', limit: 10 }
        ]);
        res.json(result);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/school/grades', async (req, res) => {
    const { student_id } = req.body;
    try {
        const adminUid = await getAdminUid();
        const result = await callOdoo('object', 'execute_kw', [
            ODOO_DB, adminUid, ADMIN_PASS, 'school.grade', 'search_read', [[['student_id', '=', student_id]]], { fields: ['subject', 'oral_mark', 'mid_term_mark', 'final_mark'] }
        ]);
        res.json(result);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/school/canteen', async (req, res) => {
    try {
        const adminUid = await getAdminUid();
        const result = await callOdoo('object', 'execute_kw', [
            ODOO_DB, adminUid, ADMIN_PASS, 'school.canteen.menu', 'search_read', [[]], { fields: ['date', 'starter', 'main', 'dessert'] }
        ]);
        res.json(result);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/school/attendance', async (req, res) => {
    const { student_id } = req.body;
    try {
        const adminUid = await getAdminUid();
        const result = await callOdoo('object', 'execute_kw', [
            ODOO_DB, adminUid, ADMIN_PASS, 'school.attendance', 'search_read', [[['student_id', '=', student_id]]], { fields: ['date', 'type', 'duration', 'reason', 'is_justified'] }
        ]);
        res.json(result);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/school/contact-admin', async (req, res) => {
    const { student_id, message } = req.body;
    try {
        const adminUid = await getAdminUid();
        
        // 1. Poster le message dans le chatter (Standard Odoo)
        await callOdoo('object', 'execute_kw', [
            ODOO_DB, adminUid, ADMIN_PASS, 'school.student', 'message_post', [parseInt(student_id)], { 
                body: message,
                message_type: 'comment',
                subtype_xmlid: 'mail.mt_comment'
            }
        ]);

        // 2. Créer une activité pour l'administration pour déclencher une notification visuelle
        try {
            // Récupérer l'ID du modèle school.student
            const modelResult = await callOdoo('object', 'execute_kw', [
                ODOO_DB, adminUid, ADMIN_PASS, 'ir.model', 'search_read', 
                [[['model', '=', 'school.student']]], { fields: ['id'], limit: 1 }
            ]);

            if (modelResult && modelResult.length > 0) {
                const modelId = modelResult[0].id;
                await callOdoo('object', 'execute_kw', [
                    ODOO_DB, adminUid, ADMIN_PASS, 'mail.activity', 'create', 
                    [{
                        'res_id': parseInt(student_id),
                        'res_model_id': modelId,
                        'activity_type_id': 4, // 4 est souvent l'ID pour "To Do" ou "Exception"
                        'summary': 'Nouveau message de parent',
                        'note': message,
                        'user_id': adminUid, // Notifier l'administrateur
                        'date_deadline': new Date().toISOString().split('T')[0]
                    }]
                ]);
            }
        } catch (actErr) {
            console.error("Erreur création activité Odoo:", actErr);
            // On ne bloque pas le retour success si seule l'activité échoue
        }

        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/school/chat/history', async (req, res) => {
    const { student_id } = req.body;
    try {
        const adminUid = await getAdminUid();
        const result = await callOdoo('object', 'execute_kw', [
            ODOO_DB, adminUid, ADMIN_PASS, 'mail.message', 'search_read', 
            [[['model', '=', 'school.student'], ['res_id', '=', student_id], ['message_type', '=', 'comment']]], 
            { fields: ['id', 'body', 'date', 'author_id', 'author_guest_id'], order: 'date asc' }
        ]);
        
        // Nettoyer le corps du message (Odoo envoie du HTML)
        const cleaned = result.map(m => ({
            id: m.id,
            body: m.body.replace(/<[^>]*>?/gm, ''), // Simple HTML strip
            date: m.date,
            author: m.author_id ? m.author_id[1] : 'Système',
            is_parent: m.author_id && m.author_id[1].toLowerCase().includes('parent') // Heuristique simple
        }));

        res.json(cleaned);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/school/schedule', async (req, res) => {
    const { level_id } = req.body;
    try {
        const adminUid = await getAdminUid();
        const result = await callOdoo('object', 'execute_kw', [
            ODOO_DB, adminUid, ADMIN_PASS, 'school.schedule', 'search_read', 
            [[['level_id', '=', level_id]]], 
            { fields: ['day_of_week', 'start_time', 'end_time', 'subject', 'teacher'] }
        ]);
        res.json(result);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/school/announcements', async (req, res) => {
    const { level_id } = req.body;
    try {
        const adminUid = await getAdminUid();
        // Domain correctly formatted for Odoo OR: ['|', A, B]
        let domain = [['level_id', '=', false]]; 
        if (level_id) {
            domain = ['|', ['level_id', '=', false], ['level_id', '=', parseInt(level_id)]];
        }
        
        const result = await callOdoo('object', 'execute_kw', [
            ODOO_DB, adminUid, ADMIN_PASS, 'school.announcement', 'search_read', 
            [domain], 
            { fields: ['title', 'content', 'date', 'attachment', 'attachment_name'], order: 'date desc' }
        ]);
        res.json(result);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/school/announcements/send', async (req, res) => {
    const { title, content, level_id } = req.body;
    try {
        const adminUid = await getAdminUid();
        const result = await callOdoo('object', 'execute_kw', [
            ODOO_DB, adminUid, ADMIN_PASS, 'school.announcement', 'create', 
            [{ title, content, level_id: level_id || false }]
        ]);
        res.json({ success: true, id: result });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/school/levels', async (req, res) => {
    try {
        const adminUid = await getAdminUid();
        const result = await callOdoo('object', 'execute_kw', [
            ODOO_DB, adminUid, ADMIN_PASS, 'school.level', 'search_read', 
            [[]], 
            { fields: ['id', 'name'] }
        ]);
        res.json(result);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/school/contacts', async (req, res) => {
    // Liste des contacts de l'établissement
    const contacts = [
        { id: 1, name: 'Direction', role: 'Directeur Général', phone: '01 23 45 67 89', email: 'direction@ecole.com' },
        { id: 2, name: 'Secrétariat', role: 'Inscriptions & Documents', phone: '01 23 45 67 90', email: 'secretariat@ecole.com' },
        { id: 3, name: 'Comptabilité', role: 'Frais scolaires', phone: '01 23 45 67 91', email: 'compta@ecole.com' }
    ];
    res.json(contacts);
});

app.post('/api/school/admin/incoming-messages', async (req, res) => {
    try {
        const adminUid = await getAdminUid();
        // Chercher les messages postés sur les étudiants par des parents
        const result = await callOdoo('object', 'execute_kw', [
            ODOO_DB, adminUid, ADMIN_PASS, 'mail.message', 'search_read', 
            [[['model', '=', 'school.student'], ['message_type', '=', 'comment']]], 
            { fields: ['id', 'body', 'date', 'author_id', 'res_id', 'record_name'], order: 'date desc', limit: 50 }
        ]);
        
        const cleaned = result.map(m => ({
            id: m.id,
            body: m.body.replace(/<[^>]*>?/gm, ''),
            date: m.date,
            author: m.author_id ? m.author_id[1] : 'Parent',
            student_name: m.record_name,
            student_id: m.res_id
        }));

        res.json(cleaned);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Safe Mode V2 Backend running on http://localhost:${PORT}`));
