from odoo import models, fields, api


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
