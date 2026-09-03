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

    @api.model
    def _register_hook(self):
        super()._register_hook()
        try:
            model = self.env['ir.model'].sudo().search([('model', '=', 'school.sub.subject')], limit=1)
            if model:
                access = self.env['ir.model.access'].sudo().search([('model_id', '=', model.id)], limit=1)
                if not access:
                    self.env['ir.model.access'].sudo().create({
                        'name': 'school.sub.subject access',
                        'model_id': model.id,
                        'perm_read': True,
                        'perm_write': True,
                        'perm_create': True,
                        'perm_unlink': True,
                    })
        except Exception:
            pass
