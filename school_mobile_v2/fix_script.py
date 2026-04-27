#!/usr/bin/env python3
# ===========================================
# Script de vérification et correction Odoo
# Exécuter dans le shell Odoo :
#   ./odoo-bin shell -d NOM_BD
# Puis coller ce code
# ===========================================

# Vérifier les modèles présents
print("=== Modèles School chargés ===")
for m in ['school.student', 'school.level', 'school.attendance', 
          'school.homework', 'school.grade', 'school.canteen.menu']:
    exists = m in env
    print(f"  {'✓' if exists else '✗'} {m}")

# Si school.level et school.attendance existent → créer vues et menus
if 'school.level' in env and 'school.attendance' in env:
    print("\n=== Création des vues Absences & Niveaux ===")
    
    # Droits d'accès
    for model_name in ['school.level', 'school.attendance']:
        model = env['ir.model'].search([('model', '=', model_name)], limit=1)
        if model and not env['ir.model.access'].search([('model_id', '=', model.id)], limit=1):
            env['ir.model.access'].create({
                'name': f'{model_name} access',
                'model_id': model.id,
                'perm_read': True, 'perm_write': True,
                'perm_create': True, 'perm_unlink': True,
            })
            print(f"  ✓ Droits créés pour {model_name}")

    # Root menu
    root = env.ref('school_mobile_v2.menu_mobile_v2_root', raise_if_not_found=False)
    if root:
        # Action Niveaux
        act_level = env['ir.actions.act_window'].create({
            'name': 'Niveaux / Classes',
            'res_model': 'school.level',
            'view_mode': 'list',
        })
        env['ir.ui.menu'].create({
            'name': 'Niveaux / Classes',
            'parent_id': root.id,
            'action': f'ir.actions.act_window,{act_level.id}',
            'sequence': 20,
        })
        
        # Action Absences
        act_att = env['ir.actions.act_window'].create({
            'name': 'Absences & Retards',
            'res_model': 'school.attendance',
            'view_mode': 'list,form',
        })
        env['ir.ui.menu'].create({
            'name': 'Absences / Retards',
            'parent_id': root.id,
            'action': f'ir.actions.act_window,{act_att.id}',
            'sequence': 30,
        })
        print("  ✓ Menus Niveaux et Absences créés")
    
    env.cr.commit()
    print("\n✅ Terminé ! Rafraîchissez votre navigateur Odoo.")
else:
    print("\n✗ Les modèles ne sont pas chargés. Redémarrage Odoo nécessaire.")
    print("  sudo systemctl restart odoo")
