# -*- coding: utf-8 -*-

from odoo import models, fields, api,_


class Department(models.Model):
    _name = 'department'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _description = 'Department'
    _rec_name = "name"

    name = fields.Char(string=_("Name"))
    alternative_name = fields.Char(string=_("Alternative Name"))

    _name_uniq = models.Constraint(
        'unique(name, alternative_name)',
        'name and Alternative Name must be unique .',
    )




