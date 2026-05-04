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


class SchoolHomework(models.Model):
    _name = 'school.homework'
    _description = 'Devoirs'

    title = fields.Char(string='Titre', required=True)
    description = fields.Text(string='Description')
    subject = fields.Char(string='Matière')
    date_due = fields.Date(string="Date d'échéance")
    level_id = fields.Many2one('school.level', string='Niveau / Classe', help="Sélectionnez un niveau pour envoyer à tous les élèves")
    student_id = fields.Many2one('school.student', string='Élève')
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

    subject = fields.Char(string='Matière')
    semester = fields.Selection([
        ('S1', 'Semestre 1'),
        ('S2', 'Semestre 2'),
    ], string='Semestre', default='S1')
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
    subject = fields.Char(string='Matière', required=True)
    teacher = fields.Char(string='Enseignant')
    level_id = fields.Many2one('school.level', string='Niveau / Classe', required=True)


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


class SchoolConfig(models.Model):
    _name = 'school.config'
    _description = 'Paramétrage École'

    name = fields.Char(string='Nom de l\'école', default='Mon École')
    school_year = fields.Char(string='Année Scolaire', default='2025-2026')
    logo = fields.Binary(string='Logo de l\'application')
    address = fields.Text(string='Adresse')
    phone = fields.Char(string='Téléphone')
    email = fields.Char(string='Email Administrative')
