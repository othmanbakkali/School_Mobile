
{
    'name': 'Gestion Scolaire Mobile V2',
    'version': '1.0',
    'summary': 'Portail parents - Élèves, Absences, Devoirs, Notes, Cantine',
    'category': 'Education',
    'author': 'Smart Digital School',
    'depends': ['base', 'mail'],
    'data': [
        'security/school_security.xml',
        'security/ir.model.access.csv',
        'data/mobile_tab_data.xml',
        'views/school_views.xml',
        'views/mobile_tab_views.xml',
    ],
    'installable': True,
    'application': True,
    'license': 'LGPL-3',
}
