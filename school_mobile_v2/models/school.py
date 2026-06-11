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
    homework_ids = fields.One2many('school.homework', 'student_id', string='Devoirs')
    grade_ids = fields.One2many('school.grade', 'student_id', string='Notes')
    attendance_ids = fields.One2many('school.attendance', 'student_id', string='Absences/Retards')
    payment_ids = fields.One2many('school.payment', 'student_id', string='Paiements')
    ems_id = fields.Integer(string='ID EMS')
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

    name = fields.Char(string='Nom de la matière', required=True)
    code = fields.Char(string='Code')


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
    subject_id = fields.Many2one('school.subject', string='Matière (Sélection)')
    date_due = fields.Date(string="Date d'échéance")
    level_id = fields.Many2one('school.level', string='Niveau / Classe', help="Sélectionnez un niveau pour envoyer à tous les élèves")
    student_id = fields.Many2one('school.student', string='Élève')
    year_id = fields.Many2one('school.year', string='Année Scolaire')
    state = fields.Selection([('draft', 'En cours'), ('done', 'Fait')], default='draft')
    attachment = fields.Binary(string='Pièce Jointe')
    attachment_name = fields.Char(string='Nom du fichier')
    @api.model_create_multi
    def create(self, vals_list):
        new_vals_list = []
        for vals in vals_list:
            if vals.get('level_id') and not vals.get('student_id'):
                # Attribution de masse
                students = self.env['school.student'].search([('level_id', '=', vals['level_id'])])
                for student in students:
                    copy_vals = vals.copy()
                    copy_vals['student_id'] = student.id
                    new_vals_list.append(copy_vals)
                continue
            new_vals_list.append(vals)
        return super(SchoolHomework, self).create(new_vals_list)


class SchoolGrade(models.Model):
    _name = 'school.grade'
    _description = 'Notes'

    subject = fields.Char(string='Matière (Texte)')
    subject_id = fields.Many2one('school.subject', string='Matière (Sélection)')
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
    teacher = fields.Char(string='Enseignant (Texte)')
    teacher_id = fields.Many2one('school.teacher', string='Professeur (Sélection)')
    level_id = fields.Many2one('school.level', string='Niveau / Classe', required=True)
    year_id = fields.Many2one('school.year', string='Année Scolaire')


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

