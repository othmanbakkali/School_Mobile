# -*- coding: utf-8 -*-
from odoo import fields, models, api, _


class ResConfigSettingsInherit(models.TransientModel):
    _inherit = 'res.config.settings'


    evaluation_type = fields.Selection([('degree', 'By Degree'), ('letters', 'By Letters')],
                                       string=_('Evaluation Type'), default='degree',
                                       config_parameter='nthub_ems.evaluation_type')

    school_year = fields.Char(string=_('School Year'), config_parameter='nthub_ems.school_year', default='2025-2026')
    school_logo = fields.Binary(string=_('Application Logo'), config_parameter='nthub_ems.school_logo')
    school_name = fields.Char(string=_('School Name'), config_parameter='nthub_ems.school_name')
    school_address = fields.Text(string=_('School Address'), config_parameter='nthub_ems.school_address')
    school_phone = fields.Char(string=_('School Phone'), config_parameter='nthub_ems.school_phone')
    school_email = fields.Char(string=_('School Email'), config_parameter='nthub_ems.school_email')

    def set_values(self):
        """
           This method sets parameter values, including the maximum year parameter ('nthub_ems.maxyro'),
           by querying the maximum year from education records and updating the parameter accordingly.
           :return: Result of calling the super method
           """
        res = super(ResConfigSettingsInherit, self).set_values()
        self.env.cr.execute("select max(yro) from education_record as yro;")
        result = self.env.cr.fetchone()
        self.env['ir.config_parameter'].set_param('nthub_ems.maxyro', result[0])
        return res

