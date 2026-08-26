from odoo import models, fields, api

class SchoolMobileTab(models.Model):
    _name = 'school.mobile.tab'
    _description = 'Configuration des Onglets / Menus de l\'Application Mobile'
    _order = 'sequence, id'

    name = fields.Char(string='Nom de l\'onglet', required=True)
    technical_code = fields.Char(string='Code Technique', required=True, help="Identifiant unique de l'onglet dans l'app (ex: homework, notes)")
    icon = fields.Char(string='Icône (Ionicons)', required=True, default='document-text-outline')
    path = fields.Char(string='Route / Chemin App', required=True, default='/tabs/dashboard')
    sequence = fields.Integer(string='Séquence / Ordre', default=10)
    is_active = fields.Boolean(string='Actif', default=True, help="Si décoché, l'onglet est masqué pour tout le monde")
    
    # Restrictons / Droits d'accès détaillés
    group_ids = fields.Many2many(
        'res.groups', 
        'school_mobile_tab_group_rel', 
        'tab_id', 
        'group_id', 
        string='Groupes d\'accès autorisés',
        help="Si vide, l'onglet est accessible à tous les groupes"
    )
    allowed_user_ids = fields.Many2many(
        'res.users', 
        'school_mobile_tab_user_rel', 
        'tab_id', 
        'user_id', 
        string='Utilisateurs autorisés spécifiques'
    )
    denied_user_ids = fields.Many2many(
        'res.users', 
        'school_mobile_tab_denied_user_rel', 
        'tab_id', 
        'user_id', 
        string='Utilisateurs masqués spécifiques'
    )

    _sql_constraints = [
        ('code_unique', 'unique(technical_code)', 'Le code technique de l\'onglet doit être unique !')
    ]

    @api.model
    def _seed_default_tabs(self):
        existing = set(self.search([]).mapped('technical_code'))
        default_tabs = [
            {'name': 'Tableau de bord', 'technical_code': 'dashboard', 'icon': 'globeOutline', 'path': '/tabs/dashboard', 'sequence': 10},
            {'name': 'Emploi du temps', 'technical_code': 'schedule', 'icon': 'calendarOutline', 'path': '/tabs/schedule', 'sequence': 20},
            {'name': 'Devoirs', 'technical_code': 'homework', 'icon': 'documentTextOutline', 'path': '/tabs/homework', 'sequence': 30},
            {'name': 'Notes & Relevés', 'technical_code': 'notes', 'icon': 'ribbonOutline', 'path': '/tabs/notes', 'sequence': 40},
            {'name': 'Absences & Retards', 'technical_code': 'absences', 'icon': 'alertCircleOutline', 'path': '/tabs/absences', 'sequence': 50},
            {'name': 'Cahier de transmission', 'technical_code': 'transmission', 'icon': 'heartOutline', 'path': '/tabs/transmission', 'sequence': 60},
            {'name': 'Suivi Pédagogique', 'technical_code': 'suivi', 'icon': 'schoolOutline', 'path': '/tabs/suivi-pedagogique', 'sequence': 70},
            {'name': 'Ressources Pédagogiques', 'technical_code': 'ressources', 'icon': 'bookmarkOutline', 'path': '/tabs/ressources', 'sequence': 80},
            {'name': 'Cantine / Menus', 'technical_code': 'canteen', 'icon': 'restaurantOutline', 'path': '/tabs/vie-scolaire', 'sequence': 90},
            {'name': 'Transport Scolaire', 'technical_code': 'transport', 'icon': 'busOutline', 'path': '/tabs/transport', 'sequence': 100},
            {'name': 'Boutique Scolaire', 'technical_code': 'shop', 'icon': 'cartOutline', 'path': '/tabs/shop', 'sequence': 110},
            {'name': 'Portefeuille Portepay', 'technical_code': 'wallet', 'icon': 'swapHorizontalOutline', 'path': '/tabs/wallet', 'sequence': 120},
            {'name': 'Jeux & Défis', 'technical_code': 'games', 'icon': 'gameControllerOutline', 'path': '/tabs/games', 'sequence': 130},
            {'name': 'Succès & Badges', 'technical_code': 'success', 'icon': 'trophyOutline', 'path': '/tabs/success', 'sequence': 140},
            {'name': 'Paiements Scolarité', 'technical_code': 'payments', 'icon': 'cardOutline', 'path': '/tabs/payments', 'sequence': 150},
            {'name': 'Objets Perdus', 'technical_code': 'lostItems', 'icon': 'archiveOutline', 'path': '/tabs/lost-items', 'sequence': 160},
            {'name': 'Messagerie Directe', 'technical_code': 'chat', 'icon': 'mailOutline', 'path': '/chat', 'sequence': 170},
            {'name': 'Album Photo', 'technical_code': 'album', 'icon': 'imagesOutline', 'path': '/tabs/album', 'sequence': 180},
            {'name': 'Mon Compte', 'technical_code': 'account', 'icon': 'personOutline', 'path': '/tabs/account', 'sequence': 190},
        ]
        for t in default_tabs:
            if t['technical_code'] not in existing:
                self.create(t)

    @api.model
    def init(self):
        super(SchoolMobileTab, self).init()

    def action_generate_default_tabs(self):
        self.sudo()._seed_default_tabs()
        return True

    @api.model
    def get_user_tabs(self, user_id=None):
        """
        Retourne la liste des onglets autorisés pour un utilisateur donné ou l'utilisateur courant.
        """
        if not user_id:
            user = self.env.user
        else:
            user = self.env['res.users'].browse(user_id)
            
        tabs = self.search([('is_active', '=', True)], order='sequence, id')
        result = []

        user_group_ids = set(user.groups_id.ids)

        for tab in tabs:
            # 1. Vérifier si l'utilisateur est explicitement exclu
            if user in tab.denied_user_ids:
                continue

            # 2. Vérifier si l'utilisateur est explicitement autorisé
            if tab.allowed_user_ids and user in tab.allowed_user_ids:
                result.append(tab)
                continue

            # 3. Vérifier les groupes si spécifiés
            if tab.group_ids:
                tab_group_ids = set(tab.group_ids.ids)
                if not tab_group_ids.intersection(user_group_ids):
                    continue

            result.append(tab)

        return [{
            'id': t.id,
            'name': t.name,
            'technical_code': t.technical_code,
            'icon': t.icon,
            'path': t.path,
            'sequence': t.sequence,
            'is_active': t.is_active,
        } for t in result]
