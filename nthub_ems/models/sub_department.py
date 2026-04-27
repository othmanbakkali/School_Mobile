# -*- coding: utf-8 -*-

from odoo import models, fields, api, _


class SubDepartment(models.Model):
    _name = 'sub.department'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _description = 'Sub Department'
    _rec_name = "name"

    name = fields.Char(string=_("name"))
    alternative_name = fields.Char(string=_("Alternative Name"))
    department_id = fields.Many2one("department", string=_("Department"))

    _name_uniq = models.Constraint(
        'unique(name,alternative_name)',
        'name and Alternative Name must be unique .',
    )

    

