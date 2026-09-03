from odoo import models, fields, api


class SchoolLevel(models.Model):
    _name = 'school.level'
    _description = 'Niveau Scolaire'

    name = fields.Char(string='Niveau / Classe', required=True)
    student_ids = fields.One2many('school.student', 'level_id', string='Élèves')


class SchoolParent(models.Model):
    _name = 'school.parent'
    _description = 'Parent'

    name = fields.Char(string='Nom complet', required=True)
    phone = fields.Char(string='Téléphone')
    email = fields.Char(string='Email')
    student_ids = fields.One2many('school.student', 'parent_id', string='Enfants')


class SchoolStudent(models.Model):
    _name = 'school.student'
    _inherit = ['mail.thread']
    _description = 'Élève'

    name = fields.Char(string='Nom', required=True)
    full_name = fields.Char(string='Prénom & Nom')
    level_id = fields.Many2one('school.level', string='Niveau / Classe')
    year_id = fields.Many2one('school.year', string='Année Scolaire')
    parent_id = fields.Many2one('school.parent', string='Parent Responsable')
    average_grade = fields.Float(string='Moyenne', compute='_compute_average_grade', store=True)
    photo = fields.Binary(string='Photo')

    @api.depends('grade_ids.final_mark')
    def _compute_average_grade(self):
        for student in self:
            if student.grade_ids:
                student.average_grade = sum(student.grade_ids.mapped('final_mark')) / len(student.grade_ids)
            else:
                student.average_grade = 0.0
    homework_ids = fields.Many2many('school.homework', 'school_homework_student_rel', 'student_id', 'homework_id', string='Devoirs')
    grade_ids = fields.One2many('school.grade', 'student_id', string='Notes')
    attendance_ids = fields.One2many('school.attendance', 'student_id', string='Absences/Retards')
    payment_ids = fields.One2many('school.payment', 'student_id', string='Paiements')
    ems_id = fields.Integer(string='ID EMS')
    transport_id = fields.Many2one('school.transport', string='Ligne de Transport')
    wallet_balance = fields.Float(string='Solde Portefeuille', default=150.00)
    wallet_enabled = fields.Boolean(string='Portefeuille Activé', default=True)
    use_wallet = fields.Boolean(string='Utiliser Portefeuille', default=True)
    has_wallet = fields.Boolean(string='Possède un Portefeuille', default=True)
    wallet_transaction_ids = fields.One2many('school.wallet.transaction', 'student_id', string='Transactions Portefeuille')
    album_count = fields.Integer(compute='_compute_album_count', string='Photos Album')

    def _compute_album_count(self):
        for student in self:
            student.album_count = self.env['ir.attachment'].search_count([
                ('res_model', '=', 'school.student'),
                ('res_id', '=', student.id),
                ('mimetype', 'ilike', 'image')
            ])

    def action_view_album(self):
        self.ensure_one()
        return {
            'name': 'Album Photo',
            'type': 'ir.actions.act_window',
            'res_model': 'ir.attachment',
            'view_mode': 'kanban,list,form',
            'domain': [('res_model', '=', 'school.student'), ('res_id', '=', self.id), ('mimetype', 'ilike', 'image')],
            'context': {
                'default_res_model': 'school.student',
                'default_res_id': self.id,
            },
            'target': 'current',
        }


class SchoolSubject(models.Model):
    _name = 'school.subject'
    _description = 'Matière'
    _order = 'name'

    name = fields.Char(string='Nom de la matière', required=True)
    code = fields.Char(string='Code')
    coefficient = fields.Float(string='Coefficient', default=1.0)
    description = fields.Text(string='Description / Programme')
    sub_subject_ids = fields.One2many('school.sub.subject', 'subject_id', string='Sous-matières / Détails')
    sub_subject_count = fields.Integer(string='Nb Sous-matières', compute='_compute_sub_subject_count')
    teacher_ids = fields.Many2many('school.teacher', string='Enseignants')
    level_ids = fields.Many2many('school.level', string='Niveaux / Classes')

    def _compute_sub_subject_count(self):
        for rec in self:
            rec.sub_subject_count = len(rec.sub_subject_ids)


class SchoolSubSubject(models.Model):
    _name = 'school.sub.subject'
    _description = 'Sous-matière / Détail Matière'
    _order = 'sequence, name'

    name = fields.Char(string='Nom de la sous-matière / détail', required=True)
    code = fields.Char(string='Code')
    sequence = fields.Integer(string='Séquence', default=10)
    subject_id = fields.Many2one('school.subject', string='Matière principale', required=True, ondelete='cascade')
    coefficient = fields.Float(string='Coefficient', default=1.0)
    description = fields.Text(string='Description / Objectifs pédagogiques')


class SchoolYear(models.Model):
    _name = 'school.year'
    _description = 'Année Scolaire'

    name = fields.Char(string='Année Scolaire', required=True)
    active = fields.Boolean(string='Actif', default=True)
    state = fields.Selection([
        ('draft', 'Brouillon'),
        ('open', 'En cours'),
        ('closed', 'Fermé'),
    ], string='État', default='open', required=True)
    semester_ids = fields.One2many('school.semester', 'year_id', string='Semestres')

    _sql_constraints = [
        ('name_unique', 'unique(name)', 'L\'année scolaire doit être unique !')
    ]


class SchoolSemester(models.Model):
    _name = 'school.semester'
    _description = 'Semestre'

    name = fields.Char(string='Nom du Semestre', required=True)
    year_id = fields.Many2one('school.year', string='Année Scolaire', ondelete='cascade')


class SchoolAttendance(models.Model):
    _name = 'school.attendance'
    _description = 'Absences et Retards'
    _order = 'date desc'

    student_id = fields.Many2one('school.student', string='Élève', required=True, ondelete='cascade')
    date = fields.Datetime(string='Date & Heure', default=fields.Datetime.now, required=True)
    type = fields.Selection([
        ('absence', 'Absence'),
        ('late', 'Retard'),
    ], string='Type', required=True, default='absence')
    duration = fields.Integer(string='Durée (min)')
    reason = fields.Char(string='Motif')
    is_justified = fields.Boolean(string='Justifié', default=False)
    year_id = fields.Many2one('school.year', string='Année Scolaire')


class SchoolHomework(models.Model):
    _name = 'school.homework'
    _description = 'Devoirs'
    _order = 'date_due desc'

    title = fields.Char(string='Titre', required=True)
    description = fields.Text(string='Description')
    subject = fields.Char(string='Matière (Texte)')
    subject_id = fields.Many2one('school.subject', string='Matière')
    sub_subject_id = fields.Many2one('school.sub.subject', string='Sous-matière / Détail', domain="[('subject_id', '=', subject_id)]")
    date_due = fields.Date(string="Date d'échéance")
    level_id = fields.Many2one('school.level', string='Niveau / Classe', help="Sélectionnez une classe pour charger automatiquement tous ses élèves")
    student_ids = fields.Many2many('school.student', 'school_homework_student_rel', 'homework_id', 'student_id', string='Élèves concernés')
    student_id = fields.Many2one('school.student', string='Élève individuel')
    year_id = fields.Many2one('school.year', string='Année Scolaire')
    state = fields.Selection([('draft', 'En cours'), ('done', 'Fait')], default='draft')
    attachment = fields.Binary(string='Pièce Jointe')
    attachment_name = fields.Char(string='Nom du fichier')

    @api.onchange('level_id')
    def _onchange_level_id(self):
        if self.level_id:
            students = self.env['school.student'].search([('level_id', '=', self.level_id.id)])
            self.student_ids = [(6, 0, students.ids)]
            self.student_id = False
            return {'domain': {'student_ids': [('level_id', '=', self.level_id.id)]}}
        else:
            self.student_ids = [(5, 0, 0)]
            self.student_id = False
            return {'domain': {'student_ids': []}}

    @api.onchange('subject_id')
    def _onchange_subject_id(self):
        if self.subject_id:
            self.subject = self.subject_id.name
            if self.sub_subject_id and self.sub_subject_id.subject_id != self.subject_id:
                self.sub_subject_id = False
            return {'domain': {'sub_subject_id': [('subject_id', '=', self.subject_id.id)]}}
        else:
            self.sub_subject_id = False
            return {'domain': {'sub_subject_id': []}}

    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            if vals.get('subject_id') and not vals.get('subject'):
                subj = self.env['school.subject'].browse(vals['subject_id'])
                if subj.exists():
                    vals['subject'] = subj.name
            if vals.get('level_id') and not vals.get('student_ids') and not vals.get('student_id'):
                students = self.env['school.student'].search([('level_id', '=', vals['level_id'])])
                if students:
                    vals['student_ids'] = [(6, 0, students.ids)]
            if vals.get('student_ids') and not vals.get('student_id'):
                st_cmd = vals.get('student_ids')
                if isinstance(st_cmd, list) and len(st_cmd) > 0 and len(st_cmd[0]) >= 3:
                    st_ids = st_cmd[0][2]
                    if st_ids:
                        vals['student_id'] = st_ids[0]
        return super(SchoolHomework, self).create(vals_list)


class SchoolGrade(models.Model):
    _name = 'school.grade'
    _description = 'Notes'

    subject = fields.Char(string='Matière (Texte)')
    subject_id = fields.Many2one('school.subject', string='Matière (Sélection)')
    sub_subject_id = fields.Many2one('school.sub.subject', string='Sous-matière / Détail', domain="[('subject_id', '=', subject_id)]")
    year_id = fields.Many2one('school.year', string='Année Scolaire')
    semester_id = fields.Many2one('school.semester', string='Semestre (Sélection)')
    semester = fields.Selection([
        ('S1', 'Semestre 1'),
        ('S2', 'Semestre 2'),
    ], string='Semestre (Texte)', default='S1')
    cc1 = fields.Float(string='CC1', default=0.0)
    cc2 = fields.Float(string='CC2', default=0.0)
    oral_mark = fields.Float(string='Note Oral', default=0.0)
    mid_term_mark = fields.Float(string='Note Mid-term', default=0.0)
    final_mark = fields.Float(string='Note Finale', default=0.0)
    student_id = fields.Many2one('school.student', string='Élève', ondelete='cascade')

    @api.onchange('subject_id')
    def _onchange_subject_id(self):
        if self.subject_id:
            self.subject = self.subject_id.name
            if self.sub_subject_id and self.sub_subject_id.subject_id != self.subject_id:
                self.sub_subject_id = False
            return {'domain': {'sub_subject_id': [('subject_id', '=', self.subject_id.id)]}}
        else:
            self.sub_subject_id = False
            return {'domain': {'sub_subject_id': []}}


class SchoolCanteen(models.Model):
    _name = 'school.canteen.menu'
    _description = 'Menu Cantine'
    _rec_name = 'date'

    date = fields.Date(string='Jour', required=True)
    starter = fields.Char(string='Entrée')
    main = fields.Char(string='Plat Principal')
    dessert = fields.Char(string='Dessert')


class SchoolTeacher(models.Model):
    _name = 'school.teacher'
    _description = 'Professeur'

    name = fields.Char(string='Nom complet', required=True)
    subject = fields.Char(string='Matière (Texte)')
    subject_ids = fields.Many2many('school.subject', string='Matières Enseignées')
    phone = fields.Char(string='Téléphone')
    email = fields.Char(string='Email')
    photo = fields.Binary(string='Photo')


class SchoolStaff(models.Model):
    _name = 'school.staff'
    _description = 'Personnel Administratif'

    name = fields.Char(string='Nom complet', required=True)
    role = fields.Char(string='Poste / Rôle')
    phone = fields.Char(string='Téléphone')
    email = fields.Char(string='Email')


class SchoolSchedule(models.Model):
    _name = 'school.schedule'
    _description = 'Emploi du temps'
    _order = 'day_of_week, start_time'

    day_of_week = fields.Selection([
        ('0', 'Lundi'),
        ('1', 'Mardi'),
        ('2', 'Mercredi'),
        ('3', 'Jeudi'),
        ('4', 'Vendredi'),
        ('5', 'Samedi'),
        ('6', 'Dimanche'),
    ], string='Jour', required=True)
    start_time = fields.Float(string='Heure de début', required=True)
    end_time = fields.Float(string='Heure de fin', required=True)
    subject = fields.Char(string='Matière (Texte)')
    subject_id = fields.Many2one('school.subject', string='Matière (Sélection)')
    sub_subject_id = fields.Many2one('school.sub.subject', string='Sous-matière / Détail', domain="[('subject_id', '=', subject_id)]")
    teacher = fields.Char(string='Enseignant (Texte)')
    teacher_id = fields.Many2one('school.teacher', string='Professeur (Sélection)')
    level_id = fields.Many2one('school.level', string='Niveau / Classe', required=True)
    year_id = fields.Many2one('school.year', string='Année Scolaire')

    @api.onchange('subject_id')
    def _onchange_subject_id(self):
        if self.subject_id:
            self.subject = self.subject_id.name
            if self.sub_subject_id and self.sub_subject_id.subject_id != self.subject_id:
                self.sub_subject_id = False
            return {'domain': {'sub_subject_id': [('subject_id', '=', self.subject_id.id)]}}
        else:
            self.sub_subject_id = False
            return {'domain': {'sub_subject_id': []}}


class SchoolAnnouncement(models.Model):
    _name = 'school.announcement'
    _description = 'Annonces aux Parents'
    _order = 'date desc'

    title = fields.Char(string='Titre', required=True)
    content = fields.Text(string='Contenu', required=True)
    date = fields.Datetime(string='Date d\'envoi', default=fields.Datetime.now)
    level_id = fields.Many2one('school.level', string='Niveau (Optionnel)', help="Laisse vide pour envoyer à tous les parents")
    author_id = fields.Many2one('res.users', string='Auteur', default=lambda self: self.env.user)
    attachment = fields.Binary(string='Pièce Jointe')
    attachment_name = fields.Char(string='Nom du fichier')
    year_id = fields.Many2one('school.year', string='Année Scolaire')


class SchoolConfig(models.Model):
    _name = 'school.config'
    _description = 'Paramétrage École'

    name = fields.Char(string='Nom de l\'école', default='Mon École')
    school_year = fields.Char(string='Année Scolaire (Texte)')
    current_year_id = fields.Many2one('school.year', string='Année Scolaire Actuelle')
    grade_scale = fields.Selection([
        ('20', 'Sur 20 (/20)'),
        ('10', 'Sur 10 (/10)'),
    ], string='Système de notation', default='20', required=True, help="Définit si les notes et moyennes sont sur 10 ou sur 20")
    logo = fields.Binary(string='Logo de l\'application')
    address = fields.Text(string='Adresse')
    phone = fields.Char(string='Téléphone')
    email = fields.Char(string='Email Administrative')
    staff_ids = fields.Many2many('school.staff', string='Personnel Administratif')
    teacher_ids = fields.Many2many('school.teacher', string='Corps Enseignant')
    subject_ids = fields.Many2many('school.subject', string='Matières de l\'école')
class SchoolPayment(models.Model):
    _name = 'school.payment'
    _description = 'Paiement Scolarité'
    _order = 'date desc'

    student_id = fields.Many2one('school.student', string='Élève', required=True, ondelete='cascade')
    year_id = fields.Many2one('school.year', string='Année Scolaire', required=True)
    month = fields.Selection([
        ('01', 'Janvier'), ('02', 'Février'), ('03', 'Mars'),
        ('04', 'Avril'), ('05', 'Mai'), ('06', 'Juin'),
        ('07', 'Juillet'), ('08', 'Août'), ('09', 'Septembre'),
        ('10', 'Octobre'), ('11', 'Novembre'), ('12', 'Décembre'),
    ], string='Mois', required=True)
    amount = fields.Float(string='Montant', required=True)
    date = fields.Date(string='Date de paiement', default=fields.Date.today)
    state = fields.Selection([
        ('paid', 'Payé'),
        ('unpaid', 'Non payé'),
        ('partial', 'Partiel'),
    ], string='État', default='paid')


class SchoolLostItem(models.Model):
    _name = 'school.lost.item'
    _description = 'Objets Perdus'
    _order = 'date_found desc'

    name = fields.Char(string='Objet', required=True)
    description = fields.Text(string='Description')
    date_found = fields.Date(string='Trouvé le', default=fields.Date.today)
    location = fields.Char(string='Lieu')
    photo = fields.Binary(string='Photo')
    state = fields.Selection([
        ('lost', 'Perdu (Au bureau)'),
        ('claimed', 'Récupéré'),
    ], string='État', default='lost')


class SchoolCahierTransmission(models.Model):
    _name = 'school.cahier.transmission'
    _description = 'Cahier de Transmission'
    _order = 'date desc'

    student_id = fields.Many2one('school.student', string='Élève', required=True, ondelete='cascade')
    type = fields.Selection([
        ('info', 'Information'),
        ('warning', 'Avertissement'),
        ('urgent', 'Urgent'),
        ('homework', 'Devoir'),
        ('event', 'Événement'),
    ], string='Type', required=True, default='info')
    title = fields.Char(string='Titre', required=True)
    content = fields.Text(string='Contenu', required=True)
    author = fields.Char(string='Auteur', default='Direction')
    date = fields.Datetime(string='Date', default=fields.Datetime.now)
    requires_signature = fields.Boolean(string='Signature requise', default=False)
    signed = fields.Boolean(string='Signé', default=False)
    year_id = fields.Many2one('school.year', string='Année Scolaire')


class SchoolResource(models.Model):
    _name = 'school.resources'
    _description = 'Ressources Pédagogiques'
    _order = 'date desc'

    name = fields.Char(string='Nom', required=True)
    subject = fields.Char(string='Matière')
    teacher = fields.Char(string='Enseignant')
    type = fields.Selection([
        ('pdf', 'PDF'),
        ('video', 'Vidéo'),
        ('image', 'Image'),
        ('doc', 'Document'),
        ('excel', 'Tableur'),
        ('powerpoint', 'Présentation'),
    ], string='Type', required=True, default='pdf')
    mimetype = fields.Char(string='Mimetype')
    date = fields.Date(string='Date', default=fields.Date.today)
    size = fields.Char(string='Taille')
    url = fields.Char(string='URL')
    datas = fields.Binary(string='Fichier (Données)')
    level_id = fields.Many2one('school.level', string='Niveau / Classe')
    year_id = fields.Many2one('school.year', string='Année Scolaire')


class SchoolPedagogicalComment(models.Model):
    _name = 'school.pedagogical.comment'
    _description = 'Commentaires Pédagogiques'
    _order = 'date desc'

    student_id = fields.Many2one('school.student', string='Élève', required=True, ondelete='cascade')
    teacher = fields.Char(string='Enseignant', required=True)
    subject = fields.Char(string='Matière')
    date = fields.Date(string='Date', default=fields.Date.today)
    sentiment = fields.Selection([
        ('positive', 'Bien'),
        ('negative', 'À améliorer'),
        ('neutral', 'Neutre'),
    ], string='Sentiment', required=True, default='neutral')
    text = fields.Text(string='Commentaire', required=True)
    year_id = fields.Many2one('school.year', string='Année Scolaire')


class SchoolTransport(models.Model):
    _name = 'school.transport'
    _description = 'Transport Scolaire'
    _order = 'name'

    name = fields.Char(string='Nom de la Ligne', required=True)
    driver_name = fields.Char(string='Chauffeur')
    driver_phone = fields.Char(string='Téléphone Chauffeur')
    vehicle_info = fields.Char(string='Véhicule (Matricule/Modèle)')
    pickup_time = fields.Char(string='Heure de Ramassage')
    dropoff_time = fields.Char(string='Heure de Retour')
    student_ids = fields.One2many('school.student', 'transport_id', string='Élèves inscrits')


class SchoolWalletTransaction(models.Model):
    _name = 'school.wallet.transaction'
    _description = 'Transactions Portefeuille'
    _order = 'date desc'

    student_id = fields.Many2one('school.student', string='Élève', required=True, ondelete='cascade')
    date = fields.Datetime(string='Date & Heure', default=fields.Datetime.now, required=True)
    amount = fields.Float(string='Montant', required=True)
    type = fields.Selection([
        ('credit', 'Rechargement'),
        ('debit', 'Achat boutique'),
    ], string='Type', required=True, default='debit')
    description = fields.Char(string='Description', required=True)
    year_id = fields.Many2one('school.year', string='Année Scolaire')


class SchoolShopProduct(models.Model):
    _name = 'school.shop.product'
    _description = 'Boutique - Produits'
    _order = 'name'

    name = fields.Char(string='Nom de l\'article', required=True)
    price = fields.Float(string='Prix (MAD)', required=True)
    category = fields.Selection([
        ('uniform', 'Uniforme'),
        ('book', 'Livre / Manuel'),
        ('material', 'Fourniture scolaire'),
    ], string='Catégorie', default='uniform', required=True)
    description = fields.Text(string='Description')
    photo = fields.Binary(string='Photo')
    stock = fields.Integer(string='Stock disponible', default=10)


class SchoolMobileTab(models.Model):
    _name = 'school.mobile.tab'
    _description = 'Configuration des Onglets / Menus de l\'Application Mobile'
    _order = 'sequence, id'

    name = fields.Char(string='Nom de l\'onglet', required=True)
    technical_code = fields.Char(string='Code Technique', required=True, help="Identifiant unique de l'onglet dans l'app (ex: homework, notes)")
    icon = fields.Char(string='Icône (Ionicons)', required=True, default='document-text-outline')
    path = fields.Char(string='Route / Chemin App', required=True, default='/tabs/dashboard')
    sequence = fields.Integer(string='Séquence / Ordre', default=10)
    is_active = fields.Boolean(string='Actif', default=True, help="Si décoché, l'onglet est masqué pour tout le monde")
    
    # Restrictons / Droits d'accès détaillés
    group_ids = fields.Many2many(
        'res.groups', 
        'school_mobile_tab_group_rel', 
        'tab_id', 
        'group_id', 
        string='Groupes d\'accès autorisés',
        help="Si vide, l'onglet est accessible à tous les groupes"
    )
    allowed_user_ids = fields.Many2many(
        'res.users', 
        'school_mobile_tab_user_rel', 
        'tab_id', 
        'user_id', 
        string='Utilisateurs autorisés spécifiques'
    )
    denied_user_ids = fields.Many2many(
        'res.users', 
        'school_mobile_tab_denied_user_rel', 
        'tab_id', 
        'user_id', 
        string='Utilisateurs masqués spécifiques'
    )

    _sql_constraints = [
        ('code_unique', 'unique(technical_code)', 'Le code technique de l\'onglet doit être unique !')
    ]

    @api.model
    def _seed_default_tabs(self):
        existing = set(self.search([]).mapped('technical_code'))
        default_tabs = [
            {'name': 'Tableau de bord', 'technical_code': 'dashboard', 'icon': 'globeOutline', 'path': '/tabs/dashboard', 'sequence': 10},
            {'name': 'Emploi du temps', 'technical_code': 'schedule', 'icon': 'calendarOutline', 'path': '/tabs/schedule', 'sequence': 20},
            {'name': 'Devoirs', 'technical_code': 'homework', 'icon': 'documentTextOutline', 'path': '/tabs/homework', 'sequence': 30},
            {'name': 'Notes & Relevés', 'technical_code': 'notes', 'icon': 'ribbonOutline', 'path': '/tabs/notes', 'sequence': 40},
            {'name': 'Absences & Retards', 'technical_code': 'absences', 'icon': 'alertCircleOutline', 'path': '/tabs/absences', 'sequence': 50},
            {'name': 'Cahier de transmission', 'technical_code': 'transmission', 'icon': 'heartOutline', 'path': '/tabs/transmission', 'sequence': 60},
            {'name': 'Suivi Pédagogique', 'technical_code': 'suivi', 'icon': 'schoolOutline', 'path': '/tabs/suivi-pedagogique', 'sequence': 70},
            {'name': 'Ressources Pédagogiques', 'technical_code': 'ressources', 'icon': 'bookmarkOutline', 'path': '/tabs/ressources', 'sequence': 80},
            {'name': 'Cantine / Menus', 'technical_code': 'canteen', 'icon': 'restaurantOutline', 'path': '/tabs/vie-scolaire', 'sequence': 90},
            {'name': 'Transport Scolaire', 'technical_code': 'transport', 'icon': 'busOutline', 'path': '/tabs/transport', 'sequence': 100},
            {'name': 'Boutique Scolaire', 'technical_code': 'shop', 'icon': 'cartOutline', 'path': '/tabs/shop', 'sequence': 110},
            {'name': 'Portefeuille Portepay', 'technical_code': 'wallet', 'icon': 'swapHorizontalOutline', 'path': '/tabs/wallet', 'sequence': 120},
            {'name': 'Jeux & Défis', 'technical_code': 'games', 'icon': 'gameControllerOutline', 'path': '/tabs/games', 'sequence': 130},
            {'name': 'Succès & Badges', 'technical_code': 'success', 'icon': 'trophyOutline', 'path': '/tabs/success', 'sequence': 140},
            {'name': 'Paiements Scolarité', 'technical_code': 'payments', 'icon': 'cardOutline', 'path': '/tabs/payments', 'sequence': 150},
            {'name': 'Objets Perdus', 'technical_code': 'lostItems', 'icon': 'archiveOutline', 'path': '/tabs/lost-items', 'sequence': 160},
            {'name': 'Messagerie Directe', 'technical_code': 'chat', 'icon': 'mailOutline', 'path': '/chat', 'sequence': 170},
            {'name': 'Album Photo', 'technical_code': 'album', 'icon': 'imagesOutline', 'path': '/tabs/album', 'sequence': 180},
            {'name': 'Mon Compte', 'technical_code': 'account', 'icon': 'personOutline', 'path': '/tabs/account', 'sequence': 190},
        ]
        for t in default_tabs:
            if t['technical_code'] not in existing:
                self.create(t)

    @api.model
    def init(self):
        super(SchoolMobileTab, self).init()

    def action_generate_default_tabs(self):
        self.sudo()._seed_default_tabs()
        return True




    @api.model
    def get_user_tabs(self, user_id=None):
        """
        Retourne la liste des onglets autorisés pour un utilisateur donné ou l'utilisateur courant.
        """
        if not user_id:
            user = self.env.user
        else:
            user = self.env['res.users'].browse(user_id)
            
        tabs = self.search([('is_active', '=', True)], order='sequence, id')
        result = []

        user_group_ids = set(user.groups_id.ids)

        for tab in tabs:
            if user in tab.denied_user_ids:
                continue
            if tab.allowed_user_ids and user in tab.allowed_user_ids:
                result.append(tab)
                continue
            if tab.group_ids:
                tab_group_ids = set(tab.group_ids.ids)
                if not tab_group_ids.intersection(user_group_ids):
                    continue
            result.append(tab)

        return [{
            'id': t.id,
            'name': t.name,
            'technical_code': t.technical_code,
            'icon': t.icon,
            'path': t.path,
            'sequence': t.sequence,
            'is_active': t.is_active,
        } for t in result]


