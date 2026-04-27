def post_init_hook(env):
    """
    Crée automatiquement après l'installation :
    1. Les droits d'accès pour school.level et school.attendance
    2. Les vues et menus pour ces deux modèles
    """
    # =============================================
    # DROITS D'ACCÈS
    # =============================================
    AccessModel = env['ir.model.access']

    for model_name in ['school.level', 'school.attendance']:
        model = env['ir.model'].search([('model', '=', model_name)], limit=1)
        if model and not AccessModel.search([('model_id', '=', model.id)], limit=1):
            AccessModel.create({
                'name': f'{model_name} access',
                'model_id': model.id,
                'perm_read': True,
                'perm_write': True,
                'perm_create': True,
                'perm_unlink': True,
            })

    # =============================================
    # VUE LISTE : school.level
    # =============================================
    env['ir.ui.view'].create({
        'name': 'school.level.tree.hook',
        'model': 'school.level',
        'arch': '''<list editable="bottom"><field name="name"/></list>''',
    })

    # =============================================
    # VUE LISTE + FORM : school.attendance
    # =============================================
    env['ir.ui.view'].create({
        'name': 'school.attendance.tree.hook',
        'model': 'school.attendance',
        'arch': '''<list editable="bottom"
                        decoration-danger="type == \'absence\' and not is_justified"
                        decoration-warning="type == \'late\'">
                    <field name="student_id"/>
                    <field name="date"/>
                    <field name="type"/>
                    <field name="duration" optional="show"/>
                    <field name="reason"/>
                    <field name="is_justified"/>
                  </list>''',
    })

    env['ir.ui.view'].create({
        'name': 'school.attendance.form.hook',
        'model': 'school.attendance',
        'arch': '''<form>
                    <sheet>
                        <group>
                            <group string="Informations">
                                <field name="student_id"/>
                                <field name="date"/>
                                <field name="type"/>
                                <field name="duration"/>
                            </group>
                            <group string="Détails">
                                <field name="reason"/>
                                <field name="is_justified"/>
                            </group>
                        </group>
                    </sheet>
                  </form>''',
    })

    # =============================================
    # ACTIONS
    # =============================================
    action_level = env['ir.actions.act_window'].create({
        'name': 'Niveaux / Classes',
        'res_model': 'school.level',
        'view_mode': 'list',
    })

    action_attendance = env['ir.actions.act_window'].create({
        'name': 'Absences & Retards',
        'res_model': 'school.attendance',
        'view_mode': 'list,form',
    })

    # =============================================
    # MENUS
    # =============================================
    root_menu = env.ref('school_mobile_v2.menu_mobile_v2_root')

    env['ir.ui.menu'].create({
        'name': 'Niveaux / Classes',
        'parent_id': root_menu.id,
        'action': f'ir.actions.act_window,{action_level.id}',
        'sequence': 20,
    })

    env['ir.ui.menu'].create({
        'name': 'Absences / Retards',
        'parent_id': root_menu.id,
        'action': f'ir.actions.act_window,{action_attendance.id}',
        'sequence': 30,
    })
