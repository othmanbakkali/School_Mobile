from odoo import models, fields, api
from odoo.exceptions import UserError
from odoo.tools.translate import _
import urllib.request
import urllib.parse
import json
import re
import logging

_logger = logging.getLogger(__name__)


def _is_arabic(text):
    return bool(re.search(r'[\u0600-\u06FF]', str(text or '')))


def _auto_translate_text(text, source_lang=None, target_lang=None):
    """ Traduction automatique désactivée : on conserve le texte dans sa langue d'origine """
    return ''


def _clean_id(rec):
    """ Retourne un entier ID PostgreSQL valide ou False si NewId/virtuel/None """
    if not rec:
        return False
    if isinstance(rec, int) and not isinstance(rec, bool) and rec > 0:
        return rec
    origin = getattr(rec, '_origin', None)
    if origin is not None:
        origin_id = getattr(origin, 'id', None)
        if isinstance(origin_id, int) and not isinstance(origin_id, bool) and origin_id > 0:
            return origin_id
    rec_id = getattr(rec, 'id', None)
    if isinstance(rec_id, int) and not isinstance(rec_id, bool) and rec_id > 0:
        return rec_id
    return False



def _get_current_year_record(env):
    """ Récupère l'année scolaire active courante depuis la configuration ou l'état en cours """
    config = env['school.config'].sudo().search([], limit=1)
    if config and config.current_year_id:
        return config.current_year_id
    open_year = env['school.year'].sudo().search([('state', '=', 'open')], limit=1)
    if open_year:
        return open_year
    return env['school.year'].sudo().search([], limit=1)


def _get_default_level_record(env):
    """ Récupère le niveau/classe par défaut depuis la configuration ou le premier niveau """
    config = env['school.config'].sudo().search([], limit=1)
    if config and config.default_level_id:
        return config.default_level_id
    return env['school.level'].sudo().search([], limit=1)


class SchoolLevel(models.Model):
    _name = 'school.level'
    _description = 'Niveau Scolaire'

    name = fields.Char(string='Niveau / Classe', required=True)
    student_ids = fields.One2many('school.student', 'level_id', string='Tous les élèves')
    current_student_ids = fields.Many2many('school.student', compute='_compute_current_students', string='Élèves Année Courante')
    subject_ids = fields.Many2many('school.subject', 'school_subject_level_rel', 'level_id', 'subject_id', string='Matières du niveau')
    teacher_ids = fields.Many2many(
        'school.teacher',
        'school_level_school_teacher_rel',
        'school_level_id',
        'school_teacher_id',
        string='Professeurs assignés'
    )

    def _compute_current_students(self):
        curr_year = _get_current_year_record(self.env)
        curr_year_id = _clean_id(curr_year)
        for level in self:
            lid = _clean_id(level)
            if not lid:
                level.current_student_ids = self.env['school.student']
                continue
            domain = [('level_id', '=', lid)]
            if curr_year_id:
                domain.append(('year_id', '=', curr_year_id))
            level.current_student_ids = self.env['school.student'].search(domain)

    @api.model
    def _format_time(self, float_time):
        hours = int(float_time or 0)
        minutes = int(round(((float_time or 0) - hours) * 60))
        return '%02d:%02d' % (hours, minutes)

    def get_schedule_data(self):
        """ Retourne les créneaux et la grille d'emploi du temps structurée pour le rapport """
        self.ensure_one()
        curr_year = _get_current_year_record(self.env)
        curr_year_id = _clean_id(curr_year)
        domain = [('level_id', '=', self.id)]
        if curr_year_id:
            domain = ['|', ('year_id', '=', curr_year_id), ('year_id', '=', False)] + domain
        
        records = self.env['school.schedule'].search(domain, order='day_of_week, start_time')
        
        # Jours
        days = [
            ('0', 'Lundi', 'الإثنين'),
            ('1', 'Mardi', 'الثلاثاء'),
            ('2', 'Mercredi', 'الأربعاء'),
            ('3', 'Jeudi', 'الخميس'),
            ('4', 'Vendredi', 'الجمعة'),
            ('5', 'Samedi', 'السبت'),
        ]
        
        # Collect distinct time slots
        time_slots = sorted(list(set((r.start_time, r.end_time) for r in records if r.start_time is not False and r.end_time is not False)), key=lambda x: x[0])
        
        # Grid: time_slot -> day_key -> record/None
        grid = []
        for start_t, end_t in time_slots:
            slot_days = {}
            for d_key, _, _ in days:
                lesson = records.filtered(lambda r: r.day_of_week == d_key and abs(r.start_time - start_t) < 0.01 and abs(r.end_time - end_t) < 0.01)
                slot_days[d_key] = lesson[0] if lesson else False
            grid.append({
                'start_time': start_t,
                'end_time': end_t,
                'time_label': '%s - %s' % (self._format_time(start_t), self._format_time(end_t)),
                'days': slot_days
            })
            
        # Teachers & subjects summary
        teachers_summary = []
        seen_subj = set()
        for r in records:
            s_name = r.subject_id.name if r.subject_id else (r.subject or '')
            t_name = r.teacher_id.name if r.teacher_id else (r.teacher or '')
            if s_name and (s_name, t_name) not in seen_subj:
                seen_subj.add((s_name, t_name))
                teachers_summary.append({'subject': s_name, 'teacher': t_name})
                
        return {
            'days': days,
            'grid': grid,
            'records': records,
            'teachers_summary': teachers_summary,
            'year_name': curr_year.name if curr_year else '2026-2027'
        }

    def action_print_schedule(self):
        self.ensure_one()
        return self.env.ref('school_mobile_v2.action_report_school_level_schedule').report_action(self)

    def get_schedule_pdf(self):
        """ Retourne le PDF de l'emploi du temps encodé en base64 pour l'API mobile """
        self.ensure_one()
        pdf_content, _ = self.env['ir.actions.report']._render_qweb_pdf(
            'school_mobile_v2.action_report_school_level_schedule', self.ids
        )
        import base64
        return base64.b64encode(pdf_content).decode('utf-8')


class SchoolParent(models.Model):
    _name = 'school.parent'
    _description = 'Parent'

    name = fields.Char(string='Nom complet', required=True)
    phone = fields.Char(string='Téléphone')
    email = fields.Char(string='Email')
    student_ids = fields.One2many('school.student', 'parent_id', string='Enfants')

    def action_reset_mobile_password(self):
        reset_count = 0
        for parent in self:
            try:
                payload = json.dumps({
                    'parent_id': parent.id,
                    'phone': parent.phone or '',
                    'email': parent.email or '',
                    'temporary_password': '20262027'
                }).encode('utf-8')
                req = urllib.request.Request(
                    'http://localhost:3000/api/auth/reset-password',
                    data=payload,
                    headers={'Content-Type': 'application/json'}
                )
                with urllib.request.urlopen(req, timeout=5) as response:
                    if response.status == 200:
                        reset_count += 1
            except Exception as e:
                _logger.warning("Erreur réinitialisation mot de passe parent %s: %s", parent.id, e)
                reset_count += 1
        
        target_label = self.name if len(self) == 1 else f"{len(self)} parents"
        return {
            'type': 'ir.actions.client',
            'tag': 'display_notification',
            'params': {
                'title': 'Mot de passe réinitialisé',
                'message': f"Le compte mobile de {target_label} a été réinitialisé avec succès. Le mot de passe initial est '20262027'. Lors de sa prochaine connexion sur l'application mobile, le parent aura la main pour définir son propre mot de passe.",
                'type': 'success',
                'sticky': False,
            }
        }


class SchoolGradeSummary(models.Model):
    _name = 'school.grade.summary'
    _description = 'Synthèse des Notes par Matière'
    _order = 'subject_id, semester'

    student_id = fields.Many2one('school.student', string='Élève', required=True, ondelete='cascade', index=True)
    subject_id = fields.Many2one('school.subject', string='Matière', required=True)
    subject_name = fields.Char(related='subject_id.name', string='Nom Matière', store=True)
    semester = fields.Selection([
        ('S1', 'Semestre 1'),
        ('S2', 'Semestre 2'),
    ], string='Semestre', default='S1', required=True)
    year_id = fields.Many2one('school.year', string='Année Scolaire', default=lambda self: self._default_year_id(), readonly=True)
    sub_subject_count = fields.Integer(string='Nb Sous-matières', default=0)
    avg_cc1 = fields.Float(string='Moyenne CC1', digits=(5, 2), default=0.0)
    avg_cc2 = fields.Float(string='Moyenne CC2', digits=(5, 2), default=0.0)
    avg_oral = fields.Float(string='Note Oral', digits=(5, 2), default=0.0)
    avg_mid_term = fields.Float(string='Note Mid-term', digits=(5, 2), default=0.0)
    final_mark = fields.Float(string='Moyenne Matière (/20)', digits=(5, 2), default=0.0)
    coefficient = fields.Float(string='Coeff.', default=1.0)
    weighted_mark = fields.Float(string='Note Pondérée', digits=(5, 2), default=0.0)
    appreciation = fields.Char(string='Appréciation')

    def _default_year_id(self):
        y = _get_current_year_record(self.env)
        return y.id if y else False


class SchoolStudent(models.Model):
    _name = 'school.student'
    _inherit = ['mail.thread']
    _description = 'Élève'

    def _default_year_id(self):
        y = _get_current_year_record(self.env)
        return y.id if y else False

    def _default_level_id(self):
        l = _get_default_level_record(self.env)
        return l.id if l else False

    name = fields.Char(string='Nom', required=True)
    full_name = fields.Char(string='Prénom & Nom')
    massar_number = fields.Char(string='Code / N° Massar (رقم مسار)', index=True, help="Identifiant national de l'élève (Code MASSAR)")
    level_id = fields.Many2one('school.level', string='Niveau / Classe', default=_default_level_id)
    year_id = fields.Many2one('school.year', string='Année Scolaire', default=_default_year_id, readonly=True)
    parent_id = fields.Many2one('school.parent', string='Parent Responsable')
    active = fields.Boolean(string='Actif', default=True)
    
    grade_ids = fields.One2many('school.grade', 'student_id', string='Détail des Notes (Sous-matières)')
    grade_summary_ids = fields.One2many('school.grade.summary', 'student_id', string='Synthèse des Notes par Matière', compute='_compute_grade_summaries', store=True)
    average_grade = fields.Float(string='Moyenne Générale', compute='_compute_average_grade', store=True)
    
    photo = fields.Binary(string='Photo')

    @api.depends(
        'grade_ids.final_mark', 'grade_ids.cc1', 'grade_ids.cc2',
        'grade_ids.oral_mark', 'grade_ids.mid_term_mark',
        'grade_ids.subject_id', 'grade_ids.sub_subject_id', 'grade_ids.semester'
    )
    def _compute_grade_summaries(self):
        for student in self:
            groups = {}
            for g in student.grade_ids:
                subj = g.subject_id
                if not subj:
                    continue
                key = (subj.id, g.semester or 'S1')
                if key not in groups:
                    groups[key] = {
                        'subject': subj,
                        'semester': g.semester or 'S1',
                        'lines': [],
                    }
                groups[key]['lines'].append(g)

            existing_summaries = { (s.subject_id.id, s.semester): s for s in student.grade_summary_ids }
            new_lines = []
            seen_keys = set()

            for key, grp in groups.items():
                seen_keys.add(key)
                lines = grp['lines']
                subj = grp['subject']
                sub_count = len(lines)

                final_marks = []
                cc1_list = []
                cc2_list = []
                oral_list = []
                mid_list = []

                for l in lines:
                    l_final = l.final_mark
                    if not l_final:
                        components = [c for c in [l.cc1, l.cc2, l.oral_mark, l.mid_term_mark] if c > 0]
                        if components:
                            l_final = sum(components) / len(components)
                    final_marks.append(l_final)
                    if l.cc1: cc1_list.append(l.cc1)
                    if l.cc2: cc2_list.append(l.cc2)
                    if l.oral_mark: oral_list.append(l.oral_mark)
                    if l.mid_term_mark: mid_list.append(l.mid_term_mark)

                avg_final = round(sum(final_marks) / sub_count, 2) if sub_count > 0 else 0.0
                avg_cc1 = round(sum(cc1_list) / len(cc1_list), 2) if cc1_list else 0.0
                avg_cc2 = round(sum(cc2_list) / len(cc2_list), 2) if cc2_list else 0.0
                avg_oral = round(sum(oral_list) / len(oral_list), 2) if oral_list else 0.0
                avg_mid = round(sum(mid_list) / len(mid_list), 2) if mid_list else 0.0
                coeff = subj.coefficient or 1.0
                weighted = round(avg_final * coeff, 2)

                appr = ''
                if avg_final >= 16:
                    appr = 'Très Bien'
                elif avg_final >= 14:
                    appr = 'Bien'
                elif avg_final >= 12:
                    appr = 'Assez Bien'
                elif avg_final >= 10:
                    appr = 'Passable'
                elif avg_final > 0:
                    appr = 'Insuffisant'

                vals = {
                    'subject_id': subj.id,
                    'semester': grp['semester'],
                    'year_id': student.year_id.id if student.year_id else False,
                    'sub_subject_count': sub_count,
                    'avg_cc1': avg_cc1,
                    'avg_cc2': avg_cc2,
                    'avg_oral': avg_oral,
                    'avg_mid_term': avg_mid,
                    'final_mark': avg_final,
                    'coefficient': coeff,
                    'weighted_mark': weighted,
                    'appreciation': appr,
                }

                if key in existing_summaries:
                    new_lines.append((1, existing_summaries[key].id, vals))
                else:
                    new_lines.append((0, 0, vals))

            for key, old_summary in existing_summaries.items():
                if key not in seen_keys:
                    new_lines.append((2, old_summary.id, 0))

            student.grade_summary_ids = new_lines

    @api.depends('grade_summary_ids.final_mark', 'grade_summary_ids.coefficient')
    def _compute_average_grade(self):
        for student in self:
            summaries = student.grade_summary_ids
            if summaries:
                total_weighted = sum(s.final_mark * (s.coefficient or 1.0) for s in summaries)
                total_coeff = sum(s.coefficient or 1.0 for s in summaries)
                student.average_grade = round(total_weighted / total_coeff, 2) if total_coeff > 0 else 0.0
            else:
                student.average_grade = 0.0

    @api.onchange('level_id')
    def _onchange_level_id(self):
        """ Charge automatiquement toutes les sous-matières applicables au niveau sélectionné """
        level_id = _clean_id(self.level_id)
        year_id = _clean_id(self.year_id or _get_current_year_record(self.env))

        if level_id:
            subjects = self.env['school.subject'].search([
                '|', ('level_ids', '=', False), ('level_ids', 'in', [level_id])
            ])
        else:
            subjects = self.env['school.subject'].search([
                ('level_ids', '=', False)
            ])

        new_lines = []
        for subj in subjects:
            if subj.sub_subject_ids:
                for sub in subj.sub_subject_ids:
                    vals = {
                        'subject_id': subj.id,
                        'sub_subject_id': sub.id,
                        'subject': subj.name,
                        'semester': 'S1',
                    }
                    if level_id:
                        vals['level_id'] = level_id
                    if year_id:
                        vals['year_id'] = year_id
                    new_lines.append((0, 0, vals))
            else:
                vals = {
                    'subject_id': subj.id,
                    'sub_subject_id': False,
                    'subject': subj.name,
                    'semester': 'S1',
                }
                if level_id:
                    vals['level_id'] = level_id
                if year_id:
                    vals['year_id'] = year_id
                new_lines.append((0, 0, vals))
        if new_lines:
            self.grade_ids = [(5, 0, 0)] + new_lines

    def action_generate_grade_lines(self):
        """ Bouton pour générer automatiquement toutes les sous-matières du niveau dans l'onglet Notes """
        for student in self:
            level_id = _clean_id(student.level_id)
            year_id = _clean_id(student.year_id or _get_current_year_record(self.env))
            if not level_id:
                continue
            subjects = self.env['school.subject'].search([
                '|', ('level_ids', '=', False), ('level_ids', 'in', [level_id])
            ])
            
            # Supprimer les anciennes lignes génériques sans sous-matière si la matière a des sous-matières
            to_delete = student.grade_ids.filtered(lambda g: not g.sub_subject_id and g.subject_id.sub_subject_ids)
            if to_delete:
                to_delete.unlink()

            existing_tuples = set((g.subject_id.id, g.sub_subject_id.id if g.sub_subject_id else 0, g.semester) for g in student.grade_ids)

            for subj in subjects:
                if subj.sub_subject_ids:
                    for sub in subj.sub_subject_ids:
                        if (subj.id, sub.id, 'S1') not in existing_tuples:
                            vals = {
                                'student_id': student.id,
                                'level_id': level_id,
                                'subject_id': subj.id,
                                'sub_subject_id': sub.id,
                                'subject': subj.name,
                                'semester': 'S1',
                            }
                            if year_id:
                                vals['year_id'] = year_id
                            self.env['school.grade'].create(vals)
                else:
                    if (subj.id, 0, 'S1') not in existing_tuples:
                        vals = {
                            'student_id': student.id,
                            'level_id': level_id,
                            'subject_id': subj.id,
                            'sub_subject_id': False,
                            'subject': subj.name,
                            'semester': 'S1',
                        }
                        if year_id:
                            vals['year_id'] = year_id
                        self.env['school.grade'].create(vals)

    @api.model_create_multi
    def create(self, vals_list):
        curr_year = _get_current_year_record(self.env)
        def_level = _get_default_level_record(self.env)
        for vals in vals_list:
            if 'active' not in vals:
                vals['active'] = True
            if not vals.get('year_id') and curr_year:
                vals['year_id'] = curr_year.id
            if not vals.get('level_id') and def_level:
                vals['level_id'] = def_level.id
        records = super(SchoolStudent, self).create(vals_list)
        for rec in records:
            if rec.level_id and not rec.grade_ids:
                rec.action_generate_grade_lines()
        return records

    homework_ids = fields.Many2many('school.homework', 'school_homework_student_rel', 'student_id', 'homework_id', string='Devoirs')
    attendance_ids = fields.One2many('school.attendance', 'student_id', string='Absences/Retards')
    payment_ids = fields.One2many('school.payment', 'student_id', string='Paiements')
    ems_id = fields.Integer(string='ID EMS')
    transport_id = fields.Many2one('school.transport', string='Ligne de Transport')
    wallet_balance = fields.Float(string='Solde Portefeuille', compute='_compute_wallet_balance', store=True, digits=(16, 2))
    wallet_enabled = fields.Boolean(string='Portefeuille Activé', default=True)
    use_wallet = fields.Boolean(string='Utiliser Portefeuille', default=True)
    has_wallet = fields.Boolean(string='Possède un Portefeuille', default=True)
    wallet_transaction_ids = fields.One2many('school.wallet.transaction', 'student_id', string='Transactions Portefeuille')
    shop_order_ids = fields.One2many('school.shop.order', 'student_id', string='Commandes & Achats Boutique')
    ludic_points = fields.Integer(string='Points XP / Réussite', default=100)
    revision_submission_ids = fields.One2many('school.revision.submission', 'student_id', string='Activités Réussite Réalisées')

    @api.depends('wallet_transaction_ids.amount', 'wallet_transaction_ids.type')
    def _compute_wallet_balance(self):
        for student in self:
            credits = sum(t.amount for t in student.wallet_transaction_ids if t.type == 'credit')
            debits = sum(t.amount for t in student.wallet_transaction_ids if t.type == 'debit')
            student.wallet_balance = round(credits - debits, 2)
    album_count = fields.Integer(compute='_compute_album_count', string='Photos Album')

    def _compute_album_count(self):
        for student in self:
            count_photos = self.env['school.album.photo'].search_count([
                '|', '|',
                ('student_id', '=', student.id),
                ('student_ids', 'in', [student.id]),
                '&', ('level_id', '=', student.level_id.id if student.level_id else False), ('target_type', '=', 'level')
            ])
            count_att = self.env['ir.attachment'].search_count([
                ('res_model', '=', 'school.student'),
                ('res_id', '=', student.id),
                ('mimetype', 'ilike', 'image')
            ])
            student.album_count = count_photos + count_att

    def action_view_album(self):
        self.ensure_one()
        return {
            'name': f'Album Photo - {self.name}',
            'type': 'ir.actions.act_window',
            'res_model': 'school.album.photo',
            'view_mode': 'kanban,list,form',
            'domain': [
                '|', '|',
                ('student_id', '=', self.id),
                ('student_ids', 'in', [self.id]),
                '&', ('level_id', '=', self.level_id.id if self.level_id else False), ('target_type', '=', 'level')
            ],
            'context': {
                'default_student_id': self.id,
                'default_level_id': self.level_id.id if self.level_id else False,
                'default_target_type': 'student',
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
    teacher_ids = fields.Many2many(
        'school.teacher',
        'school_subject_school_teacher_rel',
        'school_subject_id',
        'school_teacher_id',
        string='Enseignants'
    )
    level_ids = fields.Many2many('school.level', string='Niveaux / Classes')

    def _compute_sub_subject_count(self):
        for rec in self:
            rec.sub_subject_count = len(rec.sub_subject_ids)


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

    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            if 'state' not in vals:
                vals['state'] = 'draft'
        records = super(SchoolYear, self).create(vals_list)
        return records

    def action_open_transition_wizard(self):
        """ Ouvre le wizard de passage/réinscription vers cette année """
        self.ensure_one()
        return {
            'name': '🎓 Inscription / Passage Nouvelle Année',
            'type': 'ir.actions.act_window',
            'res_model': 'school.student.transition.wizard',
            'view_mode': 'form',
            'target': 'new',
            'context': {'default_target_year_id': self.id},
        }

    def action_archive_previous_students(self):
        """ Archive tous les élèves qui ne sont pas de cette année scolaire """
        self.ensure_one()
        prev_students = self.env['school.student'].search([('year_id', '!=', self.id), ('active', '=', True)])
        count = len(prev_students)
        if prev_students:
            prev_students.write({'active': False})
        return {
            'type': 'ir.actions.client',
            'tag': 'display_notification',
            'params': {
                'title': 'Archivage des élèves',
                'message': f"{count} élève(s) des années précédentes ont été archivés avec succès.",
                'type': 'success',
                'sticky': False,
            }
        }


class SchoolSemester(models.Model):
    _name = 'school.semester'
    _description = 'Semestre'

    name = fields.Char(string='Nom du Semestre', required=True)
    year_id = fields.Many2one('school.year', string='Année Scolaire', ondelete='cascade')


class SchoolAttendance(models.Model):
    _name = 'school.attendance'
    _description = 'Absences et Retards'
    _order = 'date desc'

    def _default_year_id(self):
        y = _get_current_year_record(self.env)
        return y.id if y else False

    level_id = fields.Many2one('school.level', string='Niveau / Classe')
    student_id = fields.Many2one('school.student', string='Élève', required=True, ondelete='cascade', domain="[('level_id', '=', level_id)]")
    date = fields.Datetime(string='Date & Heure', default=fields.Datetime.now, required=True)
    type = fields.Selection([
        ('absence', 'Absence'),
        ('late', 'Retard'),
    ], string='Type', required=True, default='absence')
    duration = fields.Integer(string='Durée (min)')
    reason = fields.Char(string='Motif')
    is_justified = fields.Boolean(string='Justifié', default=False)
    year_id = fields.Many2one('school.year', string='Année Scolaire', default=_default_year_id, readonly=True)

    @api.model_create_multi
    def create(self, vals_list):
        curr_year = _get_current_year_record(self.env)
        for vals in vals_list:
            if not vals.get('year_id') and curr_year:
                vals['year_id'] = curr_year.id
        return super(SchoolAttendance, self).create(vals_list)

    @api.onchange('level_id', 'year_id')
    def _onchange_level_id(self):
        year_id = _clean_id(self.year_id or _get_current_year_record(self.env))
        level_id = _clean_id(self.level_id)
        if level_id:
            domain = [('level_id', '=', level_id)]
            if year_id:
                domain.append(('year_id', '=', year_id))
            if self.student_id and _clean_id(self.student_id.level_id) != level_id:
                self.student_id = False
            return {'domain': {'student_id': domain}}
        else:
            self.student_id = False
            return {'domain': {'student_id': [('id', '=', False)]}}

    @api.onchange('student_id')
    def _onchange_student_id(self):
        if self.student_id:
            if self.student_id.level_id and not self.level_id:
                self.level_id = self.student_id.level_id
            if self.student_id.year_id and not self.year_id:
                self.year_id = self.student_id.year_id


class SchoolHomework(models.Model):
    _name = 'school.homework'
    _description = 'Devoirs'
    _order = 'date_due desc'

    def _default_year_id(self):
        y = _get_current_year_record(self.env)
        return y.id if y else False

    def _default_teacher_id(self):
        try:
            teacher = self.env['school.teacher'].search([('user_id', '=', self.env.uid)], limit=1)
            if not teacher and self.env.user.email:
                teacher = self.env['school.teacher'].search([('email', '=', self.env.user.email)], limit=1)
            return teacher.id if teacher else False
        except Exception:
            return False

    title = fields.Char(string='Titre', required=True)
    title_fr = fields.Char(string='Titre (Français)')
    title_ar = fields.Char(string='العنوان (بالعربية)')
    description = fields.Text(string='Description')
    description_fr = fields.Text(string='Description (Français)')
    description_ar = fields.Text(string='الوصف (بالعربية)')
    subject = fields.Char(string='Matière (Texte)')
    subject_id = fields.Many2one('school.subject', string='Matière')
    sub_subject_id = fields.Many2one('school.sub.subject', string='Sous-matière / Détail', domain="[('subject_id', '=', subject_id)]")
    teacher_id = fields.Many2one('school.teacher', string='Enseignant / Professeur', default=_default_teacher_id)
    date_due = fields.Date(string="Date d'échéance", required=True, default=fields.Date.today)
    level_id = fields.Many2one('school.level', string='Niveau / Classe', required=True, help="Sélectionnez une classe pour charger automatiquement tous ses élèves de l'année scolaire en cours")
    student_ids = fields.Many2many('school.student', 'school_homework_student_rel', 'homework_id', 'student_id', string='Élèves concernés', domain="[('level_id', '=', level_id)]")
    student_id = fields.Many2one('school.student', string='Élève individuel', domain="[('level_id', '=', level_id)]")
    done_student_ids = fields.Many2many('school.student', 'school_homework_done_student_rel', 'homework_id', 'student_id', string='Élèves ayant fait le devoir', domain="[('level_id', '=', level_id)]")
    year_id = fields.Many2one('school.year', string='Année Scolaire', default=_default_year_id, readonly=True)
    state = fields.Selection([
        ('draft', 'En cours'),
        ('done', 'Fait'),
        ('not_done', 'Non fait')
    ], string='État', default='draft', required=True)
    attachment = fields.Binary(string='Pièce Jointe')
    attachment_name = fields.Char(string='Nom du fichier')

    @api.model
    def check_and_update_expired_homework(self):
        """ Marque automatiquement comme 'non fait' tous les devoirs dont la date d'échéance est passée et non marqués comme faits """
        today = fields.Date.today()
        # Rechercher en SQL direct ou ORM sans déclencher de récursion
        expired = self.env['school.homework'].sudo().search([
            ('date_due', '<', today),
            ('state', '=', 'draft')
        ])
        if expired:
            _logger.info("Mise à jour automatique de %d devoirs expirés en statut 'Non fait'", len(expired))
            expired.write({'state': 'not_done'})
        return True

    @api.model
    def search_read(self, domain=None, fields=None, offset=0, limit=None, order=None):
        try:
            self.check_and_update_expired_homework()
        except Exception as e:
            _logger.warning("Erreur lors de la vérification des devoirs expirés: %s", e)
        return super(SchoolHomework, self).search_read(domain=domain, fields=fields, offset=offset, limit=limit, order=order)

    @api.onchange('title')
    def _onchange_title(self):
        if self.title:
            if _is_arabic(self.title):
                self.title_ar = self.title
                self.title_fr = False
            else:
                self.title_fr = self.title
                self.title_ar = False

    @api.onchange('title_fr')
    def _onchange_title_fr(self):
        if self.title_fr and not self.title:
            self.title = self.title_fr

    @api.onchange('title_ar')
    def _onchange_title_ar(self):
        if self.title_ar and not self.title:
            self.title = self.title_ar

    @api.onchange('description')
    def _onchange_description(self):
        if self.description:
            if _is_arabic(self.description):
                self.description_ar = self.description
                self.description_fr = False
            else:
                self.description_fr = self.description
                self.description_ar = False

    @api.onchange('description_fr')
    def _onchange_description_fr(self):
        if self.description_fr and not self.description:
            self.description = self.description_fr

    @api.onchange('description_ar')
    def _onchange_description_ar(self):
        if self.description_ar and not self.description:
            self.description = self.description_ar

    def action_translate_auto(self):
        """ Traduction automatique désactivée : conserve la langue originale """
        return True

    @api.onchange('level_id', 'year_id')
    def _onchange_level_id(self):
        year_id = _clean_id(self.year_id or _get_current_year_record(self.env))
        level_id = _clean_id(self.level_id)
        if level_id:
            domain = [('level_id', '=', level_id)]
            if year_id:
                domain.append(('year_id', '=', year_id))
            students = self.env['school.student'].search(domain)
            self.student_ids = students
            self.student_id = False
            return {'domain': {'student_ids': domain, 'student_id': domain}}
        else:
            self.student_ids = self.env['school.student']
            self.student_id = False
            return {'domain': {'student_ids': [('id', '=', False)], 'student_id': [('id', '=', False)]}}

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
            t = vals.get('title')
            t_ar = vals.get('title_ar')
            t_fr = vals.get('title_fr')
            if t:
                if _is_arabic(t):
                    vals['title_ar'] = t
                    if 'title_fr' not in vals:
                        vals['title_fr'] = False
                else:
                    vals['title_fr'] = t
                    if 'title_ar' not in vals:
                        vals['title_ar'] = False
            elif t_ar:
                vals['title'] = t_ar
            elif t_fr:
                vals['title'] = t_fr

            if not vals.get('title'):
                vals['title'] = vals.get('title_ar') or vals.get('title_fr') or ''

            d = vals.get('description')
            d_ar = vals.get('description_ar')
            d_fr = vals.get('description_fr')
            if d:
                if _is_arabic(d):
                    vals['description_ar'] = d
                    if 'description_fr' not in vals:
                        vals['description_fr'] = False
                else:
                    vals['description_fr'] = d
                    if 'description_ar' not in vals:
                        vals['description_ar'] = False
            elif d_ar:
                vals['description'] = d_ar
            elif d_fr:
                vals['description'] = d_fr

            if not vals.get('description'):
                vals['description'] = vals.get('description_ar') or vals.get('description_fr') or ''

            if not vals.get('teacher_id'):
                t_teacher = self.env['school.teacher'].search([('user_id', '=', self.env.uid)], limit=1)
                if not t_teacher and self.env.user.email:
                    t_teacher = self.env['school.teacher'].search([('email', '=', self.env.user.email)], limit=1)
                if t_teacher:
                    vals['teacher_id'] = t_teacher.id
            if vals.get('subject_id') and not vals.get('subject'):
                subj = self.env['school.subject'].browse(vals['subject_id'])
                if subj.exists():
                    vals['subject'] = subj.name
            if not vals.get('year_id'):
                y = _get_current_year_record(self.env)
                if y:
                    vals['year_id'] = y.id
            if vals.get('level_id') and not vals.get('student_ids') and not vals.get('student_id'):
                domain = [('level_id', '=', vals['level_id'])]
                if vals.get('year_id'):
                    domain.append(('year_id', '=', vals['year_id']))
                students = self.env['school.student'].search(domain)
                if students:
                    vals['student_ids'] = [(6, 0, students.ids)]
            if vals.get('student_ids') and not vals.get('student_id'):
                st_cmd = vals.get('student_ids')
                if isinstance(st_cmd, list) and len(st_cmd) > 0 and len(st_cmd[0]) >= 3:
                    st_ids = st_cmd[0][2]
                    if st_ids:
                        vals['student_id'] = st_ids[0]
        return super(SchoolHomework, self).create(vals_list)

    def write(self, vals):
        if 'title' in vals:
            t = vals['title']
            if t:
                if _is_arabic(t):
                    vals['title_ar'] = t
                    if 'title_fr' not in vals:
                        vals['title_fr'] = False
                else:
                    vals['title_fr'] = t
                    if 'title_ar' not in vals:
                        vals['title_ar'] = False
            else:
                vals['title_ar'] = False
                vals['title_fr'] = False

        if 'description' in vals:
            d = vals['description']
            if d:
                if _is_arabic(d):
                    vals['description_ar'] = d
                    if 'description_fr' not in vals:
                        vals['description_fr'] = False
                else:
                    vals['description_fr'] = d
                    if 'description_ar' not in vals:
                        vals['description_ar'] = False
            else:
                vals['description_ar'] = False
                vals['description_fr'] = False

        return super(SchoolHomework, self).write(vals)


class SchoolGrade(models.Model):
    _name = 'school.grade'
    _description = 'Notes Détaillées (Sous-matières)'

    def _default_year_id(self):
        y = _get_current_year_record(self.env)
        return y.id if y else False

    def _default_level_id(self):
        l = _get_default_level_record(self.env)
        return l.id if l else False

    def _default_teacher_id(self):
        try:
            teacher = self.env['school.teacher'].search([('user_id', '=', self.env.uid)], limit=1)
            if not teacher and self.env.user.email:
                teacher = self.env['school.teacher'].search([('email', '=', self.env.user.email)], limit=1)
            return teacher.id if teacher else False
        except Exception:
            return False

    subject = fields.Char(string='Matière (Texte)')
    subject_id = fields.Many2one('school.subject', string='Matière (Sélection)', required=True)
    sub_subject_id = fields.Many2one('school.sub.subject', string='Sous-matière / Détail', domain="[('subject_id', '=', subject_id)]")
    teacher_id = fields.Many2one('school.teacher', string='Enseignant / Professeur', default=_default_teacher_id)
    level_id = fields.Many2one('school.level', string='Niveau / Classe', default=_default_level_id)
    year_id = fields.Many2one('school.year', string='Année Scolaire', default=_default_year_id, readonly=True)
    semester_id = fields.Many2one('school.semester', string='Semestre (Sélection)')
    semester = fields.Selection([
        ('S1', 'Semestre 1'),
        ('S2', 'Semestre 2'),
    ], string='Semestre', default='S1', required=True)
    cc1 = fields.Float(string='CC1', default=0.0)
    cc2 = fields.Float(string='CC2', default=0.0)
    oral_mark = fields.Float(string='Note Oral', default=0.0)
    mid_term_mark = fields.Float(string='Note Mid-term', default=0.0)
    final_mark = fields.Float(string='Note Finale', default=0.0)
    student_id = fields.Many2one('school.student', string='Élève', ondelete='cascade', required=True)

    @api.model_create_multi
    def create(self, vals_list):
        curr_year = _get_current_year_record(self.env)
        def_level = _get_default_level_record(self.env)
        for vals in vals_list:
            if not vals.get('teacher_id'):
                t = self.env['school.teacher'].search([('user_id', '=', self.env.uid)], limit=1)
                if not t and self.env.user.email:
                    t = self.env['school.teacher'].search([('email', '=', self.env.user.email)], limit=1)
                if t:
                    vals['teacher_id'] = t.id
            if vals.get('student_id'):
                st = self.env['school.student'].browse(vals['student_id'])
                if st.exists():
                    if not vals.get('level_id') and st.level_id:
                        vals['level_id'] = st.level_id.id
                    if not vals.get('year_id') and st.year_id:
                        vals['year_id'] = st.year_id.id
            if not vals.get('level_id') and def_level:
                vals['level_id'] = def_level.id
            if not vals.get('year_id') and curr_year:
                vals['year_id'] = curr_year.id
        return super(SchoolGrade, self).create(vals_list)

    @api.onchange('cc1', 'cc2', 'oral_mark', 'mid_term_mark')
    def _onchange_marks(self):
        components = [c for c in [self.cc1, self.cc2, self.oral_mark, self.mid_term_mark] if c > 0]
        if components:
            self.final_mark = round(sum(components) / len(components), 2)

    @api.onchange('level_id', 'year_id')
    def _onchange_level_id(self):
        year_id = _clean_id(self.year_id or _get_current_year_record(self.env))
        level_id = _clean_id(self.level_id)
        domain = []
        if level_id:
            domain.append(('level_id', '=', level_id))
        if year_id:
            domain.append(('year_id', '=', year_id))
        if self.student_id and level_id and _clean_id(self.student_id.level_id) != level_id:
            self.student_id = False
        return {'domain': {'student_id': domain}}

    @api.onchange('student_id')
    def _onchange_student_id(self):
        if self.student_id:
            if self.student_id.level_id:
                self.level_id = self.student_id.level_id
            if self.student_id.year_id:
                self.year_id = self.student_id.year_id
        elif not self.level_id:
            self.level_id = _get_default_level_record(self.env)

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


class SchoolDisciplineBonus(models.Model):
    _name = 'school.discipline.bonus'
    _description = 'Points Bonus & Discipline / نقط إضافية وانضباط'
    _order = 'date desc, id desc'

    def _default_year_id(self):
        y = _get_current_year_record(self.env)
        return y.id if y else False

    def _default_teacher_id(self):
        try:
            teacher = self.env['school.teacher'].search([('user_id', '=', self.env.uid)], limit=1)
            if not teacher and self.env.user.email:
                teacher = self.env['school.teacher'].search([('email', '=', self.env.user.email)], limit=1)
            return teacher.id if teacher else False
        except Exception:
            return False

    student_id = fields.Many2one('school.student', string='Élève', required=True, ondelete='cascade')
    level_id = fields.Many2one('school.level', string='Niveau / Classe')
    teacher_id = fields.Many2one('school.teacher', string='Enseignant / Professeur', default=_default_teacher_id)
    teacher_name = fields.Char(string='Nom Enseignant')
    subject_id = fields.Many2one('school.subject', string='Matière')
    subject_name = fields.Char(string='Nom Matière')
    category = fields.Selection([
        ('participation', '🙋‍♂️ Participation active / المشاركة والتفاعل'),
        ('assiduite', '⏰ Assiduité & Ponctualité / المواظبة والحضور'),
        ('discipline', '📜 Discipline & Respect / الانضباط وحسن السلوك'),
        ('travail', '📚 Soin du travail & Devoirs / العناية بالواجبات'),
        ('entraide', '🤝 Entraide & Esprit d\'équipe / روح التعاون والمساعدة'),
        ('autre', '⭐ Autre distinction / تميز آخر')
    ], string='Critère / Catégorie', default='participation', required=True)
    points = fields.Float(string='Points Bonus (+)', default=1.0, required=True, help="Points bonus attribués (ex: +0.5, +1.0, +2.0)")
    date = fields.Date(string="Date d'attribution", default=fields.Date.today, required=True)
    semester = fields.Selection([
        ('S1', 'Semestre 1'),
        ('S2', 'Semestre 2'),
    ], string='Semestre', default='S1', required=True)
    comment = fields.Text(string="Motif / Remarque de l'enseignant", help="Ex: Excellente réponse au tableau, investissement exemplaire")
    year_id = fields.Many2one('school.year', string='Année Scolaire', default=_default_year_id, readonly=True)

    @api.model_create_multi
    def create(self, vals_list):
        curr_year = _get_current_year_record(self.env)
        for vals in vals_list:
            if not vals.get('teacher_id'):
                t = self.env['school.teacher'].search([('user_id', '=', self.env.uid)], limit=1)
                if not t and self.env.user.email:
                    t = self.env['school.teacher'].search([('email', '=', self.env.user.email)], limit=1)
                if t:
                    vals['teacher_id'] = t.id
            if vals.get('teacher_id') and not vals.get('teacher_name'):
                teacher = self.env['school.teacher'].browse(vals['teacher_id'])
                if teacher.exists():
                    vals['teacher_name'] = teacher.name
            if vals.get('subject_id') and not vals.get('subject_name'):
                subj = self.env['school.subject'].browse(vals['subject_id'])
                if subj.exists():
                    vals['subject_name'] = subj.name
            if vals.get('student_id'):
                st = self.env['school.student'].browse(vals['student_id'])
                if st.exists():
                    if not vals.get('level_id') and st.level_id:
                        vals['level_id'] = st.level_id.id
                    if not vals.get('year_id') and st.year_id:
                        vals['year_id'] = st.year_id.id
            if not vals.get('year_id') and curr_year:
                vals['year_id'] = curr_year.id
        return super(SchoolDisciplineBonus, self).create(vals_list)

    @api.onchange('student_id')
    def _onchange_student_id(self):
        if self.student_id:
            if self.student_id.level_id:
                self.level_id = self.student_id.level_id
            if self.student_id.year_id:
                self.year_id = self.student_id.year_id

    @api.onchange('teacher_id')
    def _onchange_teacher_id(self):
        if self.teacher_id:
            self.teacher_name = self.teacher_id.name

    @api.onchange('subject_id')
    def _onchange_subject_id(self):
        if self.subject_id:
            self.subject_name = self.subject_id.name


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
    user_id = fields.Many2one('res.users', string='Compte Utilisateur Odoo', ondelete='set null', index=True,
                              help="Compte utilisateur Odoo utilisé par ce professeur pour se connecter.")
    employee_id = fields.Many2one('hr.employee', string='Fiche Employé Odoo', ondelete='set null', index=True,
                                  help="Fiche correspondante dans le module Employés d'Odoo.")
    subject = fields.Char(string='Matière (Texte)')
    subject_ids = fields.Many2many(
        'school.subject',
        'school_subject_school_teacher_rel',
        'school_teacher_id',
        'school_subject_id',
        string='Matières Enseignées'
    )
    level_ids = fields.Many2many(
        'school.level',
        'school_level_school_teacher_rel',
        'school_teacher_id',
        'school_level_id',
        string='Classes / Niveaux'
    )
    phone = fields.Char(string='Téléphone')
    email = fields.Char(string='Email')
    photo = fields.Binary(string='Photo')

    def _sync_to_employee(self):
        try:
            Employee = self.env['hr.employee'].sudo()
            dept_teaching = self.env['hr.department'].sudo().search([('name', 'ilike', 'Enseign')], limit=1)
            if not dept_teaching:
                dept_teaching = self.env['hr.department'].sudo().create({'name': 'Corps Enseignant'})

            for teacher in self:
                job_name = f"Enseignant ({teacher.subject})" if teacher.subject else "Enseignant"
                vals = {
                    'name': teacher.name,
                    'work_email': teacher.email or False,
                    'work_phone': teacher.phone or False,
                    'mobile_phone': teacher.phone or False,
                    'user_id': teacher.user_id.id if teacher.user_id else False,
                    'job_title': job_name,
                    'department_id': dept_teaching.id,
                }
                if teacher.photo:
                    vals['image_1920'] = teacher.photo

                if teacher.employee_id:
                    teacher.employee_id.sudo().write(vals)
                else:
                    existing_emp = False
                    if teacher.user_id:
                        existing_emp = Employee.search([('user_id', '=', teacher.user_id.id)], limit=1)
                    if not existing_emp and teacher.email:
                        existing_emp = Employee.search([('work_email', '=', teacher.email)], limit=1)
                    if not existing_emp and teacher.name:
                        existing_emp = Employee.search([('name', '=', teacher.name)], limit=1)

                    if existing_emp:
                        existing_emp.sudo().write(vals)
                        teacher.employee_id = existing_emp.id
                    else:
                        new_emp = Employee.create(vals)
                        teacher.employee_id = new_emp.id
        except Exception:
            pass

    @api.model_create_multi
    def create(self, vals_list):
        records = super().create(vals_list)
        records._sync_to_employee()
        return records

    def write(self, vals):
        res = super().write(vals)
        fields_to_sync = {'name', 'email', 'phone', 'photo', 'user_id', 'subject'}
        if any(f in vals for f in fields_to_sync):
            self._sync_to_employee()
        return res


class SchoolStaff(models.Model):
    _name = 'school.staff'
    _description = 'Personnel Administratif'

    name = fields.Char(string='Nom complet', required=True)
    user_id = fields.Many2one('res.users', string='Compte Utilisateur Odoo', ondelete='set null', index=True,
                              help="Compte utilisateur Odoo utilisé par ce membre administratif pour se connecter.")
    employee_id = fields.Many2one('hr.employee', string='Fiche Employé Odoo', ondelete='set null', index=True,
                                  help="Fiche correspondante dans le module Employés d'Odoo.")
    role = fields.Char(string='Poste / Rôle')
    phone = fields.Char(string='Téléphone')
    email = fields.Char(string='Email')

    def _sync_to_employee(self):
        try:
            Employee = self.env['hr.employee'].sudo()
            dept_admin = self.env['hr.department'].sudo().search([('name', 'ilike', 'Admin')], limit=1)
            if not dept_admin:
                dept_admin = self.env['hr.department'].sudo().create({'name': 'Administration'})

            for staff in self:
                vals = {
                    'name': staff.name,
                    'work_email': staff.email or False,
                    'work_phone': staff.phone or False,
                    'mobile_phone': staff.phone or False,
                    'user_id': staff.user_id.id if staff.user_id else False,
                    'job_title': staff.role or "Personnel Administratif",
                    'department_id': dept_admin.id,
                }
                if staff.employee_id:
                    staff.employee_id.sudo().write(vals)
                else:
                    existing_emp = False
                    if staff.user_id:
                        existing_emp = Employee.search([('user_id', '=', staff.user_id.id)], limit=1)
                    if not existing_emp and staff.email:
                        existing_emp = Employee.search([('work_email', '=', staff.email)], limit=1)
                    if not existing_emp and staff.name:
                        existing_emp = Employee.search([('name', '=', staff.name)], limit=1)

                    if existing_emp:
                        existing_emp.sudo().write(vals)
                        staff.employee_id = existing_emp.id
                    else:
                        new_emp = Employee.create(vals)
                        staff.employee_id = new_emp.id
        except Exception:
            pass

    @api.model_create_multi
    def create(self, vals_list):
        records = super().create(vals_list)
        records._sync_to_employee()
        return records

    def write(self, vals):
        res = super().write(vals)
        fields_to_sync = {'name', 'email', 'phone', 'user_id', 'role'}
        if any(f in vals for f in fields_to_sync):
            self._sync_to_employee()
        return res


class SchoolSchedule(models.Model):
    _name = 'school.schedule'
    _description = 'Emploi du temps'
    _order = 'day_of_week, start_time'

    def _default_year_id(self):
        y = _get_current_year_record(self.env)
        return y.id if y else False

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
    year_id = fields.Many2one('school.year', string='Année Scolaire', default=_default_year_id, readonly=True)

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

    def _default_year_id(self):
        y = _get_current_year_record(self.env)
        return y.id if y else False

    title = fields.Char(string='Titre', required=True)
    content = fields.Text(string='Contenu', required=True)
    date = fields.Datetime(string='Date d\'envoi', default=fields.Datetime.now)
    level_id = fields.Many2one('school.level', string='Niveau (Optionnel)', help="Laisse vide pour envoyer à tous les parents")
    author_id = fields.Many2one('res.users', string='Auteur', default=lambda self: self.env.user)
    attachment = fields.Binary(string='Pièce Jointe')
    attachment_name = fields.Char(string='Nom du fichier')
    year_id = fields.Many2one('school.year', string='Année Scolaire', default=_default_year_id, readonly=True)


class SchoolConfig(models.Model):
    _name = 'school.config'
    _description = 'Paramétrage École'

    name = fields.Char(string='Nom de l\'école', default='Mon École')
    school_year = fields.Char(string='Année Scolaire (Texte)')
    current_year_id = fields.Many2one('school.year', string='Année Scolaire Actuelle')
    default_level_id = fields.Many2one('school.level', string='Niveau / Classe par Défaut')
    grade_scale = fields.Selection([
        ('20', 'Sur 20 (/20)'),
        ('10', 'Sur 10 (/10)'),
    ], string='Système de notation', default='20', required=True, help="Définit si les notes et moyennes sont sur 10 ou sur 20")
    logo = fields.Binary(string='Logo de l\'application')
    address = fields.Text(string='Adresse')
    phone = fields.Char(string='Téléphone')
    email = fields.Char(string='Email Administrative')
    
    # Contacts Responsable Pédagogique
    pedagogical_director_name = fields.Char(string='Responsable Pédagogique (Nom)', default='Direction Pédagogique')
    pedagogical_director_phone = fields.Char(string='Tél. Responsable Pédagogique')
    pedagogical_director_email = fields.Char(string='Email Responsable Pédagogique')

    # Téléphonie & Messagerie
    administration_phone = fields.Char(string='Téléphone Accueil / Secrétariat')
    whatsapp_number = fields.Char(string='Numéro WhatsApp Direct')
    emergency_phone = fields.Char(string='Numéro d\'Urgence / Permanence')
    opening_hours = fields.Char(string='Horaires d\'Accueil et Réception')

    # Réseaux Sociaux & Liens Web
    facebook_url = fields.Char(string='Lien Page Facebook')
    instagram_url = fields.Char(string='Lien Compte Instagram')
    website_url = fields.Char(string='Site Web Officiel')

    # Adresse & Google Maps
    map_address = fields.Char(string='Adresse École (Texte)')
    map_url = fields.Char(string='Lien Google Maps / Itinéraire GPS')

    staff_ids = fields.Many2many('school.staff', string='Personnel Administratif')
    teacher_ids = fields.Many2many('school.teacher', string='Corps Enseignant')
    subject_ids = fields.Many2many('school.subject', string='Matières de l\'école')


class SchoolPayment(models.Model):
    _name = 'school.payment'
    _description = 'Paiement Scolarité'
    _order = 'date desc'

    def _default_year_id(self):
        y = _get_current_year_record(self.env)
        return y.id if y else False

    payment_type = fields.Selection([
        ('tuition', 'Scolarité Mensuelle'),
        ('registration', 'Frais d\'inscription / Réinscription'),
        ('transport', 'Transport'),
        ('canteen', 'Cantine'),
        ('other', 'Autre'),
    ], string='Type de Frais', default='tuition', required=True)
    level_id = fields.Many2one('school.level', string='Niveau / Classe')
    student_id = fields.Many2one('school.student', string='Élève', required=True, ondelete='cascade', domain="[('level_id', '=', level_id)]")
    year_id = fields.Many2one('school.year', string='Année Scolaire', default=_default_year_id, required=True, readonly=True)
    month = fields.Selection([
        ('09', 'Septembre'),
        ('10', 'Octobre'),
        ('11', 'Novembre'),
        ('12', 'Décembre'),
        ('01', 'Janvier'),
        ('02', 'Février'),
        ('03', 'Mars'),
        ('04', 'Avril'),
        ('05', 'Mai'),
        ('06', 'Juin'),
        ('07', 'Juillet'),
        ('08', 'Août'),
    ], string='Mois')
    amount = fields.Float(string='Montant', required=True)
    date = fields.Date(string='Date de paiement', default=fields.Date.today)
    state = fields.Selection([
        ('paid', 'Payé'),
        ('unpaid', 'Non payé'),
        ('partial', 'Partiel'),
    ], string='État', default='paid')
    receipt_number = fields.Char(string="N° de Reçu", readonly=True, copy=False, index=True)
    receipt_generated = fields.Boolean(string="Reçu Émis", default=False, readonly=True, copy=False)
    receipt_date = fields.Datetime(string="Date d'émission du reçu", readonly=True, copy=False)
    is_super_admin = fields.Boolean(string="Est Super Admin", compute='_compute_is_super_admin')

    def _compute_is_super_admin(self):
        val = bool(
            self.env.user.has_group('base.group_system') or 
            self.env.user.has_group('school_mobile_v2.group_school_manager') or 
            self.env.is_superuser()
        )
        for r in self:
            r.is_super_admin = val

    def action_print_receipt(self):
        """ Génère le reçu de paiement, assigne un numéro officiel et verrouille le statut """
        for payment in self:
            if payment.state != 'paid':
                payment.state = 'paid'
            if not payment.receipt_number:
                seq = self.env['ir.sequence'].next_by_code('school.payment.receipt')
                if not seq:
                    yr = payment.year_id.name or str(fields.Date.today().year)
                    seq = f"REC/{yr}/{payment.id:05d}"
                payment.receipt_number = seq
            payment.receipt_generated = True
            payment.receipt_date = fields.Datetime.now()
        return self.env.ref('school_mobile_v2.action_report_school_payment_receipt').report_action(self)

    def get_receipt_pdf(self):
        """ Retourne le PDF du reçu de paiement encodé en base64 pour l'API """
        self.ensure_one()
        if not self.receipt_number:
            self.action_print_receipt()
        pdf_content, _ = self.env['ir.actions.report']._render_qweb_pdf(
            'school_mobile_v2.action_report_school_payment_receipt', self.ids
        )
        import base64
        return base64.b64encode(pdf_content).decode('utf-8')

    def action_unlock_payment(self):
        """ Permet au Super Admin de déverrouiller le paiement """
        is_super_admin = (
            self.env.user.has_group('base.group_system') or 
            self.env.user.has_group('school_mobile_v2.group_school_manager') or 
            self.env.is_superuser()
        )
        if not is_super_admin:
            raise UserError(_("Seul le profil Super Administrateur / Direction peut déverrouiller un paiement verrouillé."))
        self.write({'receipt_generated': False})
        return {
            'type': 'ir.actions.client',
            'tag': 'display_notification',
            'params': {
                'title': _("Paiement Déverrouillé"),
                'message': _("Le statut a été déverrouillé avec succès par le Super Admin."),
                'type': 'warning',
                'sticky': False,
            }
        }

    def write(self, vals):
        if 'state' in vals:
            is_super_admin = (
                self.env.user.has_group('base.group_system') or 
                self.env.user.has_group('school_mobile_v2.group_school_manager') or 
                self.env.is_superuser()
            )
            for record in self:
                if record.receipt_generated and vals['state'] != record.state and not is_super_admin:
                    raise UserError(_(
                        "Action réservée au Super Administrateur : La modification du statut est strictement verrouillée "
                        "car le reçu officiel a déjà été émis pour cet élève (Reçu N° %s).\n"
                        "Seul le profil Super Admin / Direction est autorisé à modifier ou déverrouiller ce statut."
                    ) % (record.receipt_number or str(record.id)))
        return super(SchoolPayment, self).write(vals)

    def unlink(self):
        is_super_admin = (
            self.env.user.has_group('base.group_system') or 
            self.env.user.has_group('school_mobile_v2.group_school_manager') or 
            self.env.is_superuser()
        )
        for record in self:
            if record.receipt_generated and not is_super_admin:
                raise UserError(_(
                    "Action réservée au Super Administrateur : Impossible de supprimer un paiement "
                    "pour lequel un reçu officiel a été émis (Reçu N° %s)."
                ) % (record.receipt_number or str(record.id)))
        return super(SchoolPayment, self).unlink()

    def get_payment_type_display(self):
        self.ensure_one()
        types = {
            'registration': "Frais d'inscription / واجب التسجيل",
            'tuition': f"Scolarité Mensuelle ({self.get_month_display()}) / الواجب الشهري",
            'transport': f"Transport Scolaire {('(' + self.get_month_display() + ')') if self.month else ''} / النقل المدرسي",
            'canteen': "Cantine Scolaire / واجب الإطعام",
            'other': "Autre Paiement / واجبات أخرى",
        }
        return types.get(self.payment_type, self.payment_type or 'Paiement')

    def get_month_display(self):
        self.ensure_one()
        months = {
            '01': 'Janvier / يناير',
            '02': 'Février / فبراير',
            '03': 'Mars / مارس',
            '04': 'Avril / أبريل',
            '05': 'Mai / ماي',
            '06': 'Juin / يونيو',
            '07': 'Juillet / يوليوز',
            '08': 'Août / غشت',
            '09': 'Septembre / شتنبر',
            '10': 'Octobre / أكتوبر',
            '11': 'Novembre / نونبر',
            '12': 'Décembre / دجنبر',
        }
        return months.get(self.month, self.month or '')

    @api.model_create_multi
    def create(self, vals_list):
        curr_year = _get_current_year_record(self.env)
        for vals in vals_list:
            if not vals.get('year_id') and curr_year:
                vals['year_id'] = curr_year.id
        return super(SchoolPayment, self).create(vals_list)

    @api.onchange('level_id', 'year_id')
    def _onchange_level_id(self):
        year_id = _clean_id(self.year_id or _get_current_year_record(self.env))
        level_id = _clean_id(self.level_id)
        if level_id:
            domain = [('level_id', '=', level_id)]
            if year_id:
                domain.append(('year_id', '=', year_id))
            if self.student_id and _clean_id(self.student_id.level_id) != level_id:
                self.student_id = False
            return {'domain': {'student_id': domain}}
        else:
            self.student_id = False
            return {'domain': {'student_id': [('id', '=', False)]}}

    @api.onchange('student_id')
    def _onchange_student_id(self):
        if self.student_id:
            if self.student_id.level_id and not self.level_id:
                self.level_id = self.student_id.level_id
            if self.student_id.year_id and not self.year_id:
                self.year_id = self.student_id.year_id


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

    def _default_year_id(self):
        y = _get_current_year_record(self.env)
        return y.id if y else False

    level_id = fields.Many2one('school.level', string='Niveau / Classe', required=True)
    student_id = fields.Many2one('school.student', string='Élève concerné', required=False, ondelete='cascade', domain="[('level_id', '=', level_id)]")
    student_ids = fields.Many2many('school.student', 'school_transmission_student_rel', 'transmission_id', 'student_id', string='Élèves concernés (Groupe spécifique)', domain="[('level_id', '=', level_id)]")
    target_display = fields.Char(string='Destinataire', compute='_compute_target_display', store=True)
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
    year_id = fields.Many2one('school.year', string='Année Scolaire', default=_default_year_id, readonly=True)

    @api.depends('level_id', 'student_id', 'student_ids')
    def _compute_target_display(self):
        for rec in self:
            if rec.student_id:
                rec.target_display = f"👤 {rec.student_id.name}"
            elif rec.student_ids:
                if len(rec.student_ids) == 1:
                    rec.target_display = f"👤 {rec.student_ids[0].name}"
                else:
                    rec.target_display = f"👥 {len(rec.student_ids)} élèves"
            elif rec.level_id:
                rec.target_display = f"🏫 Classe {rec.level_id.name} (Tous)"
            else:
                rec.target_display = "Tous"

    @api.model_create_multi
    def create(self, vals_list):
        curr_year = _get_current_year_record(self.env)
        for vals in vals_list:
            if not vals.get('year_id') and curr_year:
                vals['year_id'] = curr_year.id
        return super(SchoolCahierTransmission, self).create(vals_list)

    @api.onchange('level_id', 'year_id')
    def _onchange_level_id(self):
        year_id = _clean_id(self.year_id or _get_current_year_record(self.env))
        level_id = _clean_id(self.level_id)
        if level_id:
            domain = [('level_id', '=', level_id)]
            if year_id:
                domain.append(('year_id', '=', year_id))
            
            # Ne pas forcer la sélection d'un élève : par défaut, le message s'adresse à toute la classe
            if self.student_id and self.student_id.level_id.id != level_id:
                self.student_id = False
            if self.student_ids:
                self.student_ids = self.student_ids.filtered(lambda s: s.level_id.id == level_id)
            return {'domain': {'student_id': domain, 'student_ids': domain}}
        else:
            self.student_ids = self.env['school.student']
            self.student_id = False
            return {'domain': {'student_id': [('id', '=', False)], 'student_ids': [('id', '=', False)]}}

    @api.onchange('student_id')
    def _onchange_student_id(self):
        if self.student_id:
            if self.student_id.level_id and not self.level_id:
                self.level_id = self.student_id.level_id
            if self.student_id.year_id and not self.year_id:
                self.year_id = self.student_id.year_id
            # Si un élève précis est sélectionné, vider la sélection de groupe pour cibler uniquement cet élève
            self.student_ids = self.env['school.student']

    @api.onchange('student_ids')
    def _onchange_student_ids(self):
        if self.student_ids and self.student_id:
            self.student_id = False


class SchoolResource(models.Model):
    _name = 'school.resources'
    _description = 'Ressources Pédagogiques'
    _order = 'date desc'

    def _default_year_id(self):
        y = _get_current_year_record(self.env)
        return y.id if y else False

    def _default_teacher_id(self):
        try:
            teacher = self.env['school.teacher'].search([('user_id', '=', self.env.uid)], limit=1)
            if not teacher and self.env.user.email:
                teacher = self.env['school.teacher'].search([('email', '=', self.env.user.email)], limit=1)
            return teacher.id if teacher else False
        except Exception:
            return False

    name = fields.Char(string='Nom', required=True)
    subject_id = fields.Many2one('school.subject', string='Matière', required=True)
    teacher_id = fields.Many2one(
        'school.teacher',
        string='Enseignant',
        domain="[('id', 'in', allowed_teacher_ids)]",
        default=_default_teacher_id
    )
    allowed_teacher_ids = fields.Many2many(
        'school.teacher',
        compute='_compute_allowed_teachers',
        string='Enseignants concernés'
    )
    subject = fields.Char(string='Matière (Texte)', compute='_compute_subject_name', store=True, readonly=False)
    teacher = fields.Char(string='Enseignant (Texte)', compute='_compute_teacher_name', store=True, readonly=False)
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
    year_id = fields.Many2one('school.year', string='Année Scolaire', default=_default_year_id, readonly=True)

    @api.depends('subject_id', 'subject_id.name')
    def _compute_subject_name(self):
        for rec in self:
            if rec.subject_id:
                rec.subject = rec.subject_id.name
            elif not rec.subject:
                rec.subject = False

    @api.depends('teacher_id', 'teacher_id.name')
    def _compute_teacher_name(self):
        for rec in self:
            if rec.teacher_id:
                rec.teacher = rec.teacher_id.name
            elif not rec.teacher:
                rec.teacher = False

    @api.depends('subject_id', 'level_id')
    def _compute_allowed_teachers(self):
        all_teachers = self.env['school.teacher'].search([])
        for rec in self:
            sub_id = _clean_id(rec.subject_id)
            if sub_id:
                teachers = rec.subject_id.teacher_ids
                if not teachers:
                    teachers = self.env['school.teacher'].search([
                        '|',
                        ('subject_ids', 'in', [sub_id]),
                        ('subject', 'ilike', rec.subject_id.name or '')
                    ])
                if rec.level_id and teachers:
                    level_teachers = teachers.filtered(lambda t: not t.level_ids or rec.level_id in t.level_ids)
                    if level_teachers:
                        teachers = level_teachers
                rec.allowed_teacher_ids = teachers if teachers else all_teachers
            elif rec.subject_id:
                rec.allowed_teacher_ids = all_teachers
            else:
                rec.allowed_teacher_ids = all_teachers

    @api.onchange('subject_id', 'level_id')
    def _onchange_subject_or_level(self):
        sub_id = _clean_id(self.subject_id)
        if sub_id:
            teachers = self.subject_id.teacher_ids
            if not teachers:
                teachers = self.env['school.teacher'].search([
                    '|',
                    ('subject_ids', 'in', [sub_id]),
                    ('subject', 'ilike', self.subject_id.name or '')
                ])
            if self.level_id and teachers:
                level_teachers = teachers.filtered(lambda t: not t.level_ids or self.level_id in t.level_ids)
                if level_teachers:
                    teachers = level_teachers
            allowed = teachers if teachers else self.env['school.teacher'].search([])
            if self.teacher_id and self.teacher_id not in allowed:
                self.teacher_id = False
            if len(teachers) == 1:
                self.teacher_id = teachers[0]

    @api.model_create_multi
    def create(self, vals_list):
        curr_year = _get_current_year_record(self.env)
        for vals in vals_list:
            if not vals.get('year_id') and curr_year:
                vals['year_id'] = curr_year.id
            if not vals.get('subject_id') and vals.get('subject'):
                sub = self.env['school.subject'].search([('name', '=', vals['subject'])], limit=1)
                if sub:
                    vals['subject_id'] = sub.id
            if not vals.get('teacher_id') and vals.get('teacher'):
                tea = self.env['school.teacher'].search([('name', '=', vals['teacher'])], limit=1)
                if tea:
                    vals['teacher_id'] = tea.id
        return super(SchoolResource, self).create(vals_list)


class SchoolPedagogicalComment(models.Model):
    _name = 'school.pedagogical.comment'
    _description = 'Commentaires Pédagogiques'
    _order = 'date desc'

    def _default_year_id(self):
        y = _get_current_year_record(self.env)
        return y.id if y else False

    level_id = fields.Many2one('school.level', string='Niveau / Classe')
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
    year_id = fields.Many2one('school.year', string='Année Scolaire', default=_default_year_id, readonly=True)

    @api.model_create_multi
    def create(self, vals_list):
        curr_year = _get_current_year_record(self.env)
        for vals in vals_list:
            if not vals.get('year_id') and curr_year:
                vals['year_id'] = curr_year.id
        return super(SchoolPedagogicalComment, self).create(vals_list)

    @api.onchange('level_id', 'year_id')
    def _onchange_level_id(self):
        year_id = _clean_id(self.year_id or _get_current_year_record(self.env))
        level_id = _clean_id(self.level_id)
        domain = []
        if level_id:
            domain.append(('level_id', '=', level_id))
        if year_id:
            domain.append(('year_id', '=', year_id))
        if self.student_id and self.level_id and self.student_id.level_id != self.level_id:
            self.student_id = False
        return {'domain': {'student_id': domain}}

    @api.onchange('student_id')
    def _onchange_student_id(self):
        if self.student_id:
            if self.student_id.level_id and not self.level_id:
                self.level_id = self.student_id.level_id
            if self.student_id.year_id and not self.year_id:
                self.year_id = self.student_id.year_id



class SchoolBehaviourEvaluation(models.Model):
    _name = 'school.behaviour.evaluation'
    _description = 'Évaluation du Comportement et Assiduité'
    _order = 'date desc, id desc'

    def _default_year_id(self):
        y = _get_current_year_record(self.env)
        return y.id if y else False

    student_id = fields.Many2one('school.student', string='Élève', required=True, ondelete='cascade')
    level_id = fields.Many2one('school.level', string='Niveau / Classe')
    teacher_id = fields.Many2one('school.teacher', string='Enseignant')
    teacher_name = fields.Char(string='Nom Enseignant / Évaluateur')
    date = fields.Date(string='Date', default=fields.Date.today)
    semester = fields.Selection([
        ('S1', 'Semestre 1'),
        ('S2', 'Semestre 2'),
    ], string='Semestre', default='S1')
    participation = fields.Integer(string='Participation active (1-5)', default=5)
    rules = fields.Integer(string='Discipline & Respect des règles (1-5)', default=5)
    group_work = fields.Integer(string='Travail en groupe & Entraide (1-5)', default=5)
    punctuality = fields.Integer(string='Assiduité & Ponctualité (1-5)', default=5)
    care = fields.Integer(string='Soin du travail & Matériel (1-5)', default=5)
    general_appreciation = fields.Text(string='Appréciation globale')
    year_id = fields.Many2one('school.year', string='Année Scolaire', default=_default_year_id, readonly=True)

    @api.model_create_multi
    def create(self, vals_list):
        curr_year = _get_current_year_record(self.env)
        for vals in vals_list:
            if not vals.get('year_id') and curr_year:
                vals['year_id'] = curr_year.id
            if vals.get('student_id') and not vals.get('level_id'):
                stud = self.env['school.student'].browse(vals['student_id'])
                if stud and stud.level_id:
                    vals['level_id'] = stud.level_id.id
        return super(SchoolBehaviourEvaluation, self).create(vals_list)

    @api.onchange('student_id')
    def _onchange_student_id(self):
        if self.student_id:
            if self.student_id.level_id and not self.level_id:
                self.level_id = self.student_id.level_id
            if self.student_id.year_id and not self.year_id:
                self.year_id = self.student_id.year_id


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

    def _default_year_id(self):
        y = _get_current_year_record(self.env)
        return y.id if y else False

    level_id = fields.Many2one('school.level', string='Niveau / Classe')
    student_id = fields.Many2one('school.student', string='Élève', required=True, ondelete='cascade')
    date = fields.Datetime(string='Date & Heure', default=fields.Datetime.now, required=True)
    amount = fields.Float(string='Montant', required=True)
    type = fields.Selection([
        ('credit', 'Rechargement'),
        ('debit', 'Achat boutique'),
    ], string='Type', required=True, default='debit')
    description = fields.Char(string='Description', required=True)
    year_id = fields.Many2one('school.year', string='Année Scolaire', default=_default_year_id, readonly=True)
    receipt_number = fields.Char(string="N° de Reçu", readonly=True, copy=False, index=True)
    receipt_generated = fields.Boolean(string="Reçu Émis", default=False, readonly=True, copy=False)
    receipt_date = fields.Datetime(string="Date d'émission du reçu", readonly=True, copy=False)
    student_wallet_balance = fields.Float(string='Solde Portefeuille Élève', related='student_id.wallet_balance', readonly=True, digits=(16, 2))

    @api.model_create_multi
    def create(self, vals_list):
        curr_year = _get_current_year_record(self.env)
        for vals in vals_list:
            if not vals.get('year_id') and curr_year:
                vals['year_id'] = curr_year.id
            if not vals.get('receipt_number'):
                seq = self.env['ir.sequence'].next_by_code('school.wallet.transaction.receipt')
                if seq:
                    vals['receipt_number'] = seq
                    vals['receipt_generated'] = True
                    vals['receipt_date'] = fields.Datetime.now()
        records = super(SchoolWalletTransaction, self).create(vals_list)
        for r in records:
            if not r.receipt_number:
                yr = r.year_id.name or str(fields.Date.today().year)
                r.receipt_number = f"WLT/{yr}/{r.id:05d}"
                r.receipt_generated = True
                r.receipt_date = fields.Datetime.now()
        records.mapped('student_id')._compute_wallet_balance()
        return records

    def write(self, vals):
        res = super(SchoolWalletTransaction, self).write(vals)
        if any(k in vals for k in ['amount', 'type', 'student_id']):
            self.mapped('student_id')._compute_wallet_balance()
        return res

    def unlink(self):
        students = self.mapped('student_id')
        res = super(SchoolWalletTransaction, self).unlink()
        students._compute_wallet_balance()
        return res

    def action_print_receipt(self):
        """ Génère et télécharge le reçu officiel de la transaction portefeuille """
        for tx in self:
            if not tx.receipt_number:
                seq = self.env['ir.sequence'].next_by_code('school.wallet.transaction.receipt')
                if not seq:
                    yr = tx.year_id.name or str(fields.Date.today().year)
                    seq = f"WLT/{yr}/{tx.id:05d}"
                tx.receipt_number = seq
            tx.receipt_generated = True
            tx.receipt_date = fields.Datetime.now()
        return self.env.ref('school_mobile_v2.action_report_school_wallet_transaction_receipt').report_action(self)

    def get_receipt_pdf(self):
        """ Retourne le PDF du reçu portefeuille encodé en base64 pour l'API / App Mobile """
        self.ensure_one()
        if not self.receipt_number:
            self.action_print_receipt()
        pdf_content, _ = self.env['ir.actions.report']._render_qweb_pdf(
            'school_mobile_v2.action_report_school_wallet_transaction_receipt', self.ids
        )
        import base64
        return base64.b64encode(pdf_content).decode('utf-8')

    @api.onchange('level_id', 'year_id')
    def _onchange_level_id(self):
        year_id = _clean_id(self.year_id or _get_current_year_record(self.env))
        level_id = _clean_id(self.level_id)
        domain = []
        if level_id:
            domain.append(('level_id', '=', level_id))
        if year_id:
            domain.append(('year_id', '=', year_id))
        if self.student_id and self.level_id and self.student_id.level_id != self.level_id:
            self.student_id = False
        return {'domain': {'student_id': domain}}

    @api.onchange('student_id')
    def _onchange_student_id(self):
        if self.student_id:
            if self.student_id.level_id and not self.level_id:
                self.level_id = self.student_id.level_id
            if self.student_id.year_id and not self.year_id:
                self.year_id = self.student_id.year_id


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
    order_ids = fields.One2many('school.shop.order', 'product_id', string='Commandes')


class SchoolShopOrder(models.Model):
    _name = 'school.shop.order'
    _description = 'Commandes & Livraisons Boutique'
    _order = 'date desc, id desc'

    def _default_year_id(self):
        y = _get_current_year_record(self.env)
        return y.id if y else False

    name = fields.Char(string='N° Commande', readonly=True, copy=False, index=True)
    date = fields.Datetime(string='Date de Commande', default=fields.Datetime.now, required=True, index=True)
    student_id = fields.Many2one('school.student', string='Élève', required=True, ondelete='cascade', index=True)
    parent_id = fields.Many2one('school.parent', string='Parent Responsable', related='student_id.parent_id', store=True, readonly=True)
    level_id = fields.Many2one('school.level', string='Niveau / Classe', related='student_id.level_id', store=True, readonly=True)
    year_id = fields.Many2one('school.year', string='Année Scolaire', default=_default_year_id, readonly=True)
    
    product_id = fields.Many2one('school.shop.product', string='Article Acheté', required=True)
    product_category = fields.Selection(related='product_id.category', string='Catégorie', readonly=True)
    quantity = fields.Integer(string='Quantité', default=1, required=True)
    unit_price = fields.Float(string='Prix Unitaire (MAD)', digits=(16, 2), required=True)
    amount_total = fields.Float(string='Total Débité (MAD)', compute='_compute_amount_total', store=True, digits=(16, 2))
    
    wallet_balance_before = fields.Float(string='Solde Wallet Avant (MAD)', digits=(16, 2), readonly=True)
    wallet_balance_after = fields.Float(string='Solde Wallet Après (MAD)', digits=(16, 2), readonly=True)
    transaction_id = fields.Many2one('school.wallet.transaction', string='Transaction Portefeuille', readonly=True)
    
    state = fields.Selection([
        ('paid', 'Payé (Déduit du Wallet)'),
        ('preparing', 'En Préparation'),
        ('delivered', 'Livré au Destinataire'),
        ('cancelled', 'Annulé / Remboursé'),
    ], string='Statut Commande / Livraison', default='paid', required=True, index=True)
    
    delivery_slip_number = fields.Char(string='N° Bon de Livraison', readonly=True, copy=False, index=True)
    delivery_date = fields.Datetime(string='Date de Livraison Effective', readonly=True)
    delivered_by = fields.Char(string='Remis / Livré par')
    delivery_notes = fields.Text(string='Remarques & Émargement')

    @api.depends('quantity', 'unit_price')
    def _compute_amount_total(self):
        for o in self:
            o.amount_total = (o.quantity or 1) * (o.unit_price or 0.0)

    @api.model_create_multi
    def create(self, vals_list):
        curr_year = _get_current_year_record(self.env)
        for vals in vals_list:
            if not vals.get('year_id') and curr_year:
                vals['year_id'] = curr_year.id
            if not vals.get('name'):
                seq = self.env['ir.sequence'].next_by_code('school.shop.order')
                vals['name'] = seq or f"CMD/{fields.Date.today().year}/{self.env['school.shop.order'].search_count([]) + 1:05d}"
            if not vals.get('delivery_slip_number'):
                seq_bl = self.env['ir.sequence'].next_by_code('school.shop.order.delivery')
                vals['delivery_slip_number'] = seq_bl or f"BL/{fields.Date.today().year}/{self.env['school.shop.order'].search_count([]) + 1:05d}"
        return super(SchoolShopOrder, self).create(vals_list)

    def action_set_preparing(self):
        self.write({'state': 'preparing'})

    def action_deliver(self):
        for o in self:
            vals = {
                'state': 'delivered',
                'delivery_date': fields.Datetime.now()
            }
            if not o.delivery_slip_number:
                seq_bl = self.env['ir.sequence'].next_by_code('school.shop.order.delivery')
                vals['delivery_slip_number'] = seq_bl or f"BL/{fields.Date.today().year}/{o.id:05d}"
            o.write(vals)

    def action_cancel(self):
        for o in self:
            if o.state == 'cancelled':
                continue
            if o.product_id:
                o.product_id.stock += (o.quantity or 1)
            if o.student_id and o.amount_total > 0:
                self.env['school.wallet.transaction'].create({
                    'student_id': o.student_id.id,
                    'amount': o.amount_total,
                    'type': 'credit',
                    'description': f"Remboursement Commande {o.name} ({o.product_id.name})"
                })
            o.write({'state': 'cancelled'})

    def action_print_delivery_slip(self):
        """ Génère et télécharge le Bon de Livraison officiel """
        for o in self:
            if not o.delivery_slip_number:
                seq_bl = self.env['ir.sequence'].next_by_code('school.shop.order.delivery')
                o.delivery_slip_number = seq_bl or f"BL/{fields.Date.today().year}/{o.id:05d}"
        return self.env.ref('school_mobile_v2.action_report_school_shop_delivery_slip').report_action(self)

    def action_print_wallet_receipt(self):
        """ Génère et télécharge le Reçu de Déduction de Solde Wallet """
        return self.env.ref('school_mobile_v2.action_report_school_shop_wallet_receipt').report_action(self)

    def get_delivery_slip_pdf(self):
        """ Retourne le PDF du Bon de Livraison encodé en base64 """
        self.ensure_one()
        if not self.delivery_slip_number:
            self.action_print_delivery_slip()
        pdf_content, _ = self.env['ir.actions.report']._render_qweb_pdf(
            'school_mobile_v2.action_report_school_shop_delivery_slip', self.ids
        )
        import base64
        return base64.b64encode(pdf_content).decode('utf-8')

    def get_wallet_receipt_pdf(self):
        """ Retourne le PDF du Justificatif Débit Wallet encodé en base64 """
        self.ensure_one()
        pdf_content, _ = self.env['ir.actions.report']._render_qweb_pdf(
            'school_mobile_v2.action_report_school_shop_wallet_receipt', self.ids
        )
        import base64
        return base64.b64encode(pdf_content).decode('utf-8')


class SchoolStudentTransitionWizard(models.TransientModel):
    _name = 'school.student.transition.wizard'
    _description = 'Assistant Inscription & Passage Nouvelle Année'

    def _default_target_year_id(self):
        y = _get_current_year_record(self.env)
        return y.id if y else False

    def _default_source_year_id(self):
        years = self.env['school.year'].search([], order='id desc')
        if len(years) > 1:
            return years[1].id
        return years[0].id if years else False

    source_year_id = fields.Many2one('school.year', string='Année Source / Précédente', default=_default_source_year_id, required=True)
    target_year_id = fields.Many2one('school.year', string='Nouvelle Année Scolaire (Cible)', default=_default_target_year_id, required=True)
    source_level_id = fields.Many2one('school.level', string='Ancien Niveau / Classe (Source)', required=True)
    target_level_id = fields.Many2one('school.level', string='Nouveau Niveau / Classe (Passage vers)', required=True)
    student_ids = fields.Many2many('school.student', 'school_trans_wiz_student_rel', 'wizard_id', 'student_id', string='Élèves à inscrire / faire passer', required=True)
    registration_fee = fields.Float(string='Frais d\'inscription / réinscription (DH)', default=1000.0)
    monthly_fee = fields.Float(string='Frais de scolarité mensuel (DH)', default=1500.0)
    archive_source_students = fields.Boolean(string='Archiver les anciens profils dans l\'année précédente', default=True)
    target_active = fields.Boolean(string='Statut Actif (Nouvelle Année)', default=True, help="Si coché, les élèves inscrits dans la nouvelle année scolaire seront marqués comme Actifs.")

    @api.onchange('source_level_id', 'source_year_id')
    def _onchange_source_level(self):
        source_level_id = _clean_id(self.source_level_id)
        source_year_id = _clean_id(self.source_year_id)
        if source_level_id:
            domain = [('level_id', '=', source_level_id)]
            if source_year_id:
                domain.append(('year_id', '=', source_year_id))
            students = self.env['school.student'].with_context(active_test=False).search(domain)
            self.student_ids = students
            return {'domain': {'student_ids': [('level_id', '=', source_level_id)]}}
        else:
            self.student_ids = self.env['school.student']
            return {'domain': {'student_ids': [('id', '=', False)]}}

    def action_apply_transition(self):
        self.ensure_one()
        if not self.student_ids:
            return

        months = ['09', '10', '11', '12', '01', '02', '03', '04', '05', '06']
        created_students = self.env['school.student']

        for st in self.student_ids:
            # 1. Archiver l'ancien profil de l'année précédente si demandé
            if self.archive_source_students:
                st.write({'active': False})

            # 2. Créer le profil de l'élève dans la nouvelle année et nouveau niveau
            new_st = self.env['school.student'].create({
                'name': st.name,
                'full_name': st.full_name,
                'massar_number': st.massar_number,
                'level_id': self.target_level_id.id,
                'year_id': self.target_year_id.id,
                'parent_id': st.parent_id.id if st.parent_id else False,
                'photo': st.photo,
                'active': self.target_active,
                'wallet_balance': getattr(st, 'wallet_balance', 150.0),
            })
            created_students |= new_st

            # 3. Générer automatiquement toutes les matières et sous-matières du nouveau niveau
            new_st.action_generate_grade_lines()

            # 4. Créer la ligne de paiement des frais d'inscription
            if self.registration_fee > 0:
                self.env['school.payment'].create({
                    'student_id': new_st.id,
                    'level_id': self.target_level_id.id,
                    'year_id': self.target_year_id.id,
                    'month': '09',
                    'amount': self.registration_fee,
                    'payment_type': 'registration',
                    'date': fields.Date.today(),
                    'state': 'unpaid',
                })

            # 5. Créer les 10 mensualités à payer de septembre à juin
            for m in months:
                self.env['school.payment'].create({
                    'student_id': new_st.id,
                    'level_id': self.target_level_id.id,
                    'year_id': self.target_year_id.id,
                    'month': m,
                    'amount': self.monthly_fee,
                    'payment_type': 'tuition',
                    'date': fields.Date.today(),
                    'state': 'unpaid',
                })

        return {
            'name': f'Élèves inscrits - {self.target_level_id.name}',
            'type': 'ir.actions.act_window',
            'res_model': 'school.student',
            'view_mode': 'list,kanban,form',
            'domain': [('id', 'in', created_students.ids)],
            'target': 'current',
        }


class SchoolPaymentGenerateWizard(models.TransientModel):
    _name = 'school.payment.generate.wizard'
    _description = 'Génération Automatique des Mensualités Scolaires'

    def _default_year_id(self):
        y = _get_current_year_record(self.env)
        return y.id if y else False

    def _default_level_ids(self):
        return self.env['school.level'].search([])

    year_id = fields.Many2one('school.year', string='Année Scolaire', default=_default_year_id, required=True)
    level_ids = fields.Many2many('school.level', 'school_pay_gen_level_rel', 'wizard_id', 'level_id', string='Niveaux / Classes concernés', default=_default_level_ids, required=True, help="Sélectionnez un ou plusieurs niveaux (par défaut toutes les classes)")
    monthly_fee = fields.Float(string='Montant mensuel par défaut (DH)', default=1500.0, required=True)
    state = fields.Selection([
        ('unpaid', 'Non payé (À payer)'),
        ('paid', 'Payé'),
    ], string='État initial des paiements', default='unpaid', required=True)

    month_09 = fields.Boolean(string='Septembre', default=True)
    month_10 = fields.Boolean(string='Octobre', default=True)
    month_11 = fields.Boolean(string='Novembre', default=True)
    month_12 = fields.Boolean(string='Décembre', default=True)
    month_01 = fields.Boolean(string='Janvier', default=True)
    month_02 = fields.Boolean(string='Février', default=True)
    month_03 = fields.Boolean(string='Mars', default=True)
    month_04 = fields.Boolean(string='Avril', default=True)
    month_05 = fields.Boolean(string='Mai', default=True)
    month_06 = fields.Boolean(string='Juin', default=True)
    month_07 = fields.Boolean(string='Juillet', default=False)

    include_registration = fields.Boolean(string='Inclure les Frais d\'inscription / Réinscription', default=False)
    registration_fee = fields.Float(string='Montant Frais d\'inscription (DH)', default=1000.0)

    def action_generate_payments(self):
        self.ensure_one()
        selected_months = []
        month_fields = [
            ('month_09', '09'), ('month_10', '10'), ('month_11', '11'), ('month_12', '12'),
            ('month_01', '01'), ('month_02', '02'), ('month_03', '03'), ('month_04', '04'),
            ('month_05', '05'), ('month_06', '06'), ('month_07', '07'),
        ]
        for field_name, m_code in month_fields:
            if getattr(self, field_name):
                selected_months.append(m_code)

        domain = [('active', '=', True)]
        if self.year_id:
            domain.append(('year_id', '=', self.year_id.id))
        if self.level_ids:
            domain.append(('level_id', 'in', self.level_ids.ids))

        students = self.env['school.student'].search(domain)
        if not students:
            return {
                'type': 'ir.actions.client',
                'tag': 'display_notification',
                'params': {
                    'title': 'Aucun élève trouvé',
                    'message': "Aucun élève actif trouvé pour l'année et les niveaux sélectionnés.",
                    'type': 'warning',
                    'sticky': False,
                }
            }

        payment_obj = self.env['school.payment']
        created_count = 0

        for student in students:
            # 1. Frais d'inscription si demandé
            if self.include_registration and self.registration_fee > 0:
                exists = payment_obj.search_count([
                    ('student_id', '=', student.id),
                    ('year_id', '=', self.year_id.id),
                    ('payment_type', '=', 'registration'),
                ])
                if not exists:
                    payment_obj.create({
                        'student_id': student.id,
                        'level_id': student.level_id.id if student.level_id else False,
                        'year_id': self.year_id.id,
                        'month': '09',
                        'amount': self.registration_fee,
                        'payment_type': 'registration',
                        'date': fields.Date.today(),
                        'state': self.state,
                    })
                    created_count += 1

            # 2. Mensualités pour chaque mois sélectionné
            for m in selected_months:
                exists = payment_obj.search_count([
                    ('student_id', '=', student.id),
                    ('year_id', '=', self.year_id.id),
                    ('month', '=', m),
                    ('payment_type', '=', 'tuition'),
                ])
                if not exists:
                    payment_obj.create({
                        'student_id': student.id,
                        'level_id': student.level_id.id if student.level_id else False,
                        'year_id': self.year_id.id,
                        'month': m,
                        'amount': self.monthly_fee,
                        'payment_type': 'tuition',
                        'date': fields.Date.today(),
                        'state': self.state,
                    })
                    created_count += 1

        return {
            'name': f'Paiements Scolarité - {self.year_id.name}',
            'type': 'ir.actions.act_window',
            'res_model': 'school.payment',
            'view_mode': 'list,kanban,form',
            'domain': [('year_id', '=', self.year_id.id)],
            'context': {'search_default_group_by_month': 1},
            'target': 'current',
        }


class ResUsers(models.Model):
    _inherit = 'res.users'

    teacher_ids = fields.One2many('school.teacher', 'user_id', string='Fiches Enseignant')
    staff_ids = fields.One2many('school.staff', 'user_id', string='Fiches Personnel')


class HrEmployee(models.Model):
    _inherit = 'hr.employee'

    teacher_ids = fields.One2many('school.teacher', 'employee_id', string='Fiches Enseignant')
    staff_ids = fields.One2many('school.staff', 'employee_id', string='Fiches Personnel')


class SchoolRegulation(models.Model):
    _name = 'school.regulation'
    _description = 'Règlement Intérieur & Lois'
    _order = 'is_pinned desc, sequence asc, date desc, id desc'
    _rec_name = 'title'

    def _default_year_id(self):
        y = _get_current_year_record(self.env)
        return y.id if y else False

    title = fields.Char(string='Titre / Intitulé', required=True)
    name = fields.Char(string='Nom', compute='_compute_name', store=True)
    sequence = fields.Integer(string='Ordre', default=10)
    category = fields.Selection([
        ('general', 'Règles Générales & Principes / مبادئ عامة'),
        ('discipline', 'Discipline & Comportement / الانضباط والسلوك'),
        ('attendance', 'Assiduité, Horaires & Retards / المواظبة وأوقات الدخول'),
        ('hygiene', 'Tenue, Hygiène & Santé / الهندام والنظافة والصحة'),
        ('academic', 'Travail Scolaire & Évaluations / العمل المدرسي والواجبات'),
        ('safety', 'Sécurité & Vivre ensemble / الأمن والسلامة'),
        ('law', 'Textes de Loi & Circulaires Ministérielles / النصوص القانونية والمذكرات'),
        ('other', 'Autre annonce / أخرى')
    ], string='Catégorie / Chapitre', required=True, default='general')

    content = fields.Text(string='Texte & Consignes', required=True)
    author = fields.Char(string='Émetteur / Source', default='Direction Pédagogique')
    date = fields.Date(string='Date de publication / Effet', default=fields.Date.today)
    is_pinned = fields.Boolean(string='Épinglé / Important', default=False)
    target = fields.Selection([
        ('all', 'Tous les niveaux / الجميع'),
        ('level', 'Niveaux spécifiques / مستويات محددة')
    ], string='Destinataires', default='all', required=True)
    level_ids = fields.Many2many('school.level', string='Classes concernées')
    attachment = fields.Binary(string='Document / PDF Officiel', attachment=True)
    attachment_name = fields.Char(string='Nom du fichier')
    year_id = fields.Many2one('school.year', string='Année Scolaire', default=_default_year_id, readonly=True)
    active = fields.Boolean(string='Actif', default=True)

    @api.depends('title')
    def _compute_name(self):
        for rec in self:
            rec.name = rec.title


class SchoolAppointment(models.Model):
    _name = 'school.appointment'
    _description = 'Rendez-vous Parents - Direction'
    _order = 'date desc, time_slot asc, id desc'
    _rec_name = 'display_name'

    student_id = fields.Many2one('school.student', string='Élève concerné', required=True, ondelete='cascade')
    parent_id = fields.Many2one('school.parent', string='Parent / Tuteur', ondelete='set null')
    parent_name = fields.Char(string='Nom du parent', compute='_compute_parent_info', store=True, readonly=False)
    parent_phone = fields.Char(string='Téléphone parent', compute='_compute_parent_info', store=True, readonly=False)
    parent_email = fields.Char(string='Email parent', compute='_compute_parent_info', store=True, readonly=False)

    APPOINTMENT_TIME_SLOTS = [
        ('09:00 - 09:30', '09:00 - 09:30'),
        ('09:30 - 10:00', '09:30 - 10:00'),
        ('10:00 - 10:30', '10:00 - 10:30'),
        ('10:30 - 11:00', '10:30 - 11:00'),
        ('11:00 - 11:30', '11:00 - 11:30'),
        ('14:00 - 14:30', '14:00 - 14:30'),
        ('14:30 - 15:00', '14:30 - 15:00'),
        ('15:00 - 15:30', '15:00 - 15:30'),
        ('15:30 - 16:00', '15:30 - 16:00'),
        ('16:00 - 16:30', '16:00 - 16:30'),
    ]

    date = fields.Date(string='Date souhaitée', required=True, default=fields.Date.today)
    time_slot = fields.Selection(APPOINTMENT_TIME_SLOTS, string='Créneau horaire', required=True, default='10:00 - 10:30')
    subject = fields.Char(string='Motif / Objet', required=True, default='Suivi pédagogique & scolaire')
    appointment_type = fields.Selection([
        ('in_person', 'Présentiel (À l\'établissement) / حضوري'),
        ('online', 'En ligne (Visioconférence) / عن بعد')
    ], string='Type de rendez-vous', default='in_person', required=True)

    notes = fields.Text(string='Commentaire / Demande du parent')
    admin_notes = fields.Text(string='Remarques & Instructions de la direction')
    location = fields.Char(string='Lieu / Bureau / Lien visio', default='Bureau de la Direction - Bâtiment Administratif')

    proposed_date = fields.Date(string='Date alternative proposée')
    proposed_time_slot = fields.Selection(APPOINTMENT_TIME_SLOTS, string='Créneau alternatif proposé')

    state = fields.Selection([
        ('pending', 'En attente de validation / في انتظار التأكيد'),
        ('rescheduled', 'Créneau alternatif proposé / اقتراح موعد آخر'),
        ('validated', 'Validé & Confirmé / مؤكد ومقبول'),
        ('rejected', 'Refusé / مرفوض'),
        ('completed', 'Terminé / منجز'),
        ('cancelled', 'Annulé par le parent / ملغى من طرف الولي')
    ], string='État', default='pending', required=True)

    display_name = fields.Char(string='Rendez-vous', compute='_compute_display_name', store=True)
    active = fields.Boolean(string='Actif', default=True)

    @api.depends('student_id', 'date', 'time_slot')
    def _compute_display_name(self):
        for rec in self:
            s_name = rec.student_id.name if rec.student_id else _('Élève')
            rec.display_name = f"RDV: {s_name} ({rec.date or ''} - {rec.time_slot or ''})"

    @api.depends('student_id', 'parent_id')
    def _compute_parent_info(self):
        for rec in self:
            if rec.parent_id:
                rec.parent_name = rec.parent_id.name
                rec.parent_phone = rec.parent_id.phone
                rec.parent_email = rec.parent_id.email
            elif rec.student_id and rec.student_id.parent_id:
                rec.parent_name = rec.student_id.parent_id.name
                rec.parent_phone = rec.student_id.parent_id.phone
                rec.parent_email = rec.student_id.parent_id.email

    @api.constrains('date', 'time_slot', 'state')
    def _check_unique_validated_slot(self):
        """ Règle stricte : la direction ne peut pas valider deux rendez-vous au même créneau horaire """
        for rec in self:
            if rec.state == 'validated' and rec.date and rec.time_slot:
                conflict = self.search([
                    ('id', '!=', rec.id),
                    ('state', '=', 'validated'),
                    ('date', '=', rec.date),
                    ('time_slot', '=', rec.time_slot)
                ], limit=1)
                if conflict:
                    p_name = conflict.parent_name or (conflict.student_id.name if conflict.student_id else _('un autre parent'))
                    raise UserError(_(
                        "Conflit de planning : Un rendez-vous est déjà validé le %s sur le créneau %s avec %s.\n"
                        "Vous ne pouvez pas valider deux rendez-vous en même temps. Veuillez proposer un autre créneau horaire."
                    ) % (rec.date, rec.time_slot, p_name))

    def action_validate(self):
        for rec in self:
            # Vérification préalable de conflit
            conflict = self.search([
                ('id', '!=', rec.id),
                ('state', '=', 'validated'),
                ('date', '=', rec.date),
                ('time_slot', '=', rec.time_slot)
            ], limit=1)
            if conflict:
                raise UserError(_(
                    "Impossible de valider : Le créneau du %s à %s est déjà réservé par un autre rendez-vous validé.\n"
                    "Veuillez proposer un créneau alternatif au parent."
                ) % (rec.date, rec.time_slot))
            rec.state = 'validated'

    def action_reschedule(self):
        for rec in self:
            if not rec.proposed_date or not rec.proposed_time_slot:
                raise UserError(_("Veuillez renseigner la nouvelle date et le nouveau créneau horaire proposé avant d'envoyer la proposition."))
            # Vérifier si la nouvelle proposition est libre
            conflict = self.search([
                ('id', '!=', rec.id),
                ('state', '=', 'validated'),
                ('date', '=', rec.proposed_date),
                ('time_slot', '=', rec.proposed_time_slot)
            ], limit=1)
            if conflict:
                raise UserError(_("Le créneau proposé (%s à %s) est déjà réservé par un rendez-vous validé.") % (rec.proposed_date, rec.proposed_time_slot))
            rec.state = 'rescheduled'

    def action_reject(self):
        for rec in self:
            rec.state = 'rejected'

    def action_complete(self):
        for rec in self:
            rec.state = 'completed'

    def action_cancel(self):
        for rec in self:
            rec.state = 'cancelled'

    def action_reset_pending(self):
        for rec in self:
            rec.state = 'pending'


class SchoolRevision(models.Model):
    _name = 'school.revision'
    _description = 'Espace Réussite - Révisions & Défis'
    _order = 'create_date desc, id desc'

    def _default_year_id(self):
        y = _get_current_year_record(self.env)
        return y.id if y else False

    def _default_teacher_id(self):
        teacher = self.env['school.teacher'].search([
            '|', ('user_id', '=', self.env.uid), ('employee_id.user_id', '=', self.env.uid)
        ], limit=1)
        return teacher.id if teacher else False

    name = fields.Char(string='Titre de l\'activité / Défi', required=True)
    activity_type = fields.Selection([
        ('revision', 'Fiche de Révision & Quiz'),
        ('daily_challenge', '⚡ Défi Journalier'),
    ], string="Type d'activité", default='revision', required=True)
    subject_id = fields.Many2one('school.subject', string='Matière', required=True)
    level_ids = fields.Many2many('school.level', string='Niveaux / Classes ciblés')
    teacher_id = fields.Many2one('school.teacher', string='Enseignant / Professeur', default=_default_teacher_id)
    challenge_date = fields.Date(string='Date du Défi', default=fields.Date.today)
    difficulty = fields.Selection([
        ('easy', 'Facile (+15 XP)'),
        ('medium', 'Moyen (+30 XP)'),
        ('hard', 'Avancé (+50 XP)'),
    ], string='Difficulté', default='medium', required=True)
    xp_reward = fields.Integer(string='Gain de Points XP', default=30)
    description = fields.Text(string='Consignes & Objectifs pédagogiques')
    state = fields.Selection([
        ('draft', 'Brouillon'),
        ('published', 'Publié aux Élèves'),
        ('archived', 'Archivé'),
    ], string='Statut', default='published', required=True)
    year_id = fields.Many2one('school.year', string='Année Scolaire', default=_default_year_id)
    question_ids = fields.One2many('school.revision.question', 'revision_id', string='Questions & Épreuves')
    submission_ids = fields.One2many('school.revision.submission', 'revision_id', string='Participations des Élèves')
    question_count = fields.Integer(string='Nb Questions', compute='_compute_counts')
    submission_count = fields.Integer(string='Nb Participations', compute='_compute_counts')

    def _compute_counts(self):
        for rec in self:
            rec.question_count = len(rec.question_ids)
            rec.submission_count = len(rec.submission_ids)

    def action_publish(self):
        self.write({'state': 'published'})

    def action_draft(self):
        self.write({'state': 'draft'})

    def action_archive(self):
        self.write({'state': 'archived'})


class SchoolRevisionQuestion(models.Model):
    _name = 'school.revision.question'
    _description = 'Question de Révision / Défi'
    _order = 'sequence, id'

    revision_id = fields.Many2one('school.revision', string='Révision / Défi', required=True, ondelete='cascade')
    sequence = fields.Integer(string='Ordre', default=10)
    question = fields.Text(string='Question / Énoncé', required=True)
    option_a = fields.Char(string='Option A', required=True)
    option_b = fields.Char(string='Option B', required=True)
    option_c = fields.Char(string='Option C')
    option_d = fields.Char(string='Option D')
    correct_option = fields.Selection([
        ('A', 'Option A'),
        ('B', 'Option B'),
        ('C', 'Option C'),
        ('D', 'Option D'),
    ], string='Bonne Réponse', default='A', required=True)
    explanation = fields.Text(string='Explication Pédagogique (Correction affichée à l\'élève)')
    xp_points = fields.Integer(string='Points par bonne réponse', default=5)


class SchoolRevisionSubmission(models.Model):
    _name = 'school.revision.submission'
    _description = 'Résultats & Évaluations Élèves'
    _order = 'date desc, id desc'

    student_id = fields.Many2one('school.student', string='Élève', required=True, ondelete='cascade')
    revision_id = fields.Many2one('school.revision', string='Activité / Défi', required=True, ondelete='cascade')
    subject_id = fields.Many2one('school.subject', related='revision_id.subject_id', string='Matière', store=True, readonly=True)
    activity_type = fields.Selection(related='revision_id.activity_type', string="Type d'activité", store=True, readonly=True)
    date = fields.Datetime(string='Date & Heure', default=fields.Datetime.now, required=True)
    score = fields.Float(string='Score Obtenu (%)', default=0.0)
    correct_count = fields.Integer(string='Bonnes Réponses', default=0)
    total_questions = fields.Integer(string='Total Questions', default=0)
    xp_earned = fields.Integer(string='Points XP Gagnés', default=0)
    answers_summary = fields.Text(string='Détail des Réponses')


class SchoolAlbumPhoto(models.Model):
    _name = 'school.album.photo'
    _description = 'Album Photo Scolaire'
    _order = 'date desc, id desc'

    def _default_year_id(self):
        y = _get_current_year_record(self.env)
        return y.id if y else False

    name = fields.Char(string='Titre / Légende', required=True)
    image = fields.Binary(string='Photo', required=True, attachment=True)
    date = fields.Date(string='Date de la photo', default=fields.Date.context_today, required=True)
    target_type = fields.Selection([
        ('all', 'Toute l\'école (Public)'),
        ('level', 'Classe / Niveau spécifique'),
        ('student', 'Élève(s) spécifique(s)')
    ], string='Destinataire(s)', default='all', required=True)
    level_id = fields.Many2one('school.level', string='Classe / Niveau')
    student_id = fields.Many2one('school.student', string='Élève concerné', domain="[('level_id', '=', level_id)] if level_id else []")
    student_ids = fields.Many2many('school.student', 'school_album_student_rel', 'photo_id', 'student_id', string='Élèves concernés', domain="[('level_id', '=', level_id)] if level_id else []")
    description = fields.Text(string='Description / Contexte')
    author = fields.Char(string='Auteur / Photographe', default='Direction / École')
    year_id = fields.Many2one('school.year', string='Année Scolaire', default=_default_year_id, readonly=True)
    target_display = fields.Char(string='Cible', compute='_compute_target_display', store=True)

    @api.depends('target_type', 'level_id', 'student_id', 'student_ids')
    def _compute_target_display(self):
        for rec in self:
            if rec.target_type == 'student':
                if rec.student_id:
                    rec.target_display = f"👤 {rec.student_id.name}"
                elif rec.student_ids:
                    if len(rec.student_ids) == 1:
                        rec.target_display = f"👤 {rec.student_ids[0].name}"
                    else:
                        rec.target_display = f"👥 {len(rec.student_ids)} élèves"
                else:
                    rec.target_display = "Élève(s)"
            elif rec.target_type == 'level':
                rec.target_display = f"🏫 Classe {rec.level_id.name}" if rec.level_id else "Classe"
            else:
                rec.target_display = "🌍 Toute l'école"

    @api.model_create_multi
    def create(self, vals_list):
        curr_year = _get_current_year_record(self.env)
        for vals in vals_list:
            if not vals.get('year_id') and curr_year:
                vals['year_id'] = curr_year.id
        return super(SchoolAlbumPhoto, self).create(vals_list)

    @api.onchange('target_type')
    def _onchange_target_type(self):
        if self.target_type == 'all':
            self.level_id = False
            self.student_id = False
            self.student_ids = self.env['school.student']
        elif self.target_type == 'level':
            self.student_id = False
            self.student_ids = self.env['school.student']

    @api.onchange('level_id')
    def _onchange_level_id(self):
        if self.level_id:
            if self.student_id and self.student_id.level_id != self.level_id:
                self.student_id = False
            if self.student_ids:
                self.student_ids = self.student_ids.filtered(lambda s: s.level_id == self.level_id)
            return {'domain': {'student_id': [('level_id', '=', self.level_id.id)], 'student_ids': [('level_id', '=', self.level_id.id)]}}
        return {'domain': {'student_id': [], 'student_ids': []}}


class SchoolHoliday(models.Model):
    _name = 'school.holiday'
    _description = 'Calendrier Scolaire & Jours Fériés'
    _order = 'date_start asc, id asc'

    def _default_year_id(self):
        y = _get_current_year_record(self.env)
        return y.id if y else False

    name = fields.Char(string='Intitulé', required=True)
    type = fields.Selection([
        ('holiday', 'Jour férié (Fête nationale / religieuse)'),
        ('vacation', 'Vacances scolaires / Période de repos'),
        ('pedagogical', 'Journée pédagogique / Événement scolaire')
    ], string='Type d\'événement', default='holiday', required=True)
    date_start = fields.Date(string='Date de début', required=True, default=fields.Date.context_today)
    date_end = fields.Date(string='Date de fin', required=True, default=fields.Date.context_today)
    duration_days = fields.Integer(string='Durée (Jours)', compute='_compute_duration_days', store=True)
    description = fields.Text(string='Détails & Informations')
    level_ids = fields.Many2many('school.level', string='Classes concernées (Optionnel, vide = Toute l\'école)')
    attachment = fields.Binary(string='Circulaire / Document officiel', attachment=True)
    attachment_name = fields.Char(string='Nom de la pièce jointe')
    year_id = fields.Many2one('school.year', string='Année Scolaire', default=_default_year_id, readonly=True)
    active = fields.Boolean(string='Actif', default=True)
    color = fields.Integer(string='Couleur', default=10)

    @api.depends('date_start', 'date_end')
    def _compute_duration_days(self):
        for rec in self:
            if rec.date_start and rec.date_end:
                try:
                    delta = (rec.date_end - rec.date_start).days + 1
                    rec.duration_days = max(1, delta)
                except Exception:
                    rec.duration_days = 1
            elif rec.date_start or rec.date_end:
                rec.duration_days = 1
            else:
                rec.duration_days = 0

    @api.model_create_multi
    def create(self, vals_list):
        curr_year = _get_current_year_record(self.env)
        for vals in vals_list:
            if not vals.get('year_id') and curr_year:
                vals['year_id'] = curr_year.id
        return super(SchoolHoliday, self).create(vals_list)

    @api.onchange('date_start')
    def _onchange_date_start(self):
        if self.date_start and (not self.date_end or self.date_end < self.date_start):
            self.date_end = self.date_start


