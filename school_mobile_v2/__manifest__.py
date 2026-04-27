
{
    'name': 'Gestion Scolaire Mobile V2',
    'version': '1.0',
    'summary': 'Portail parents - Élèves, Absences, Devoirs, Notes, Cantine',
    'category': 'Education',
    'author': 'Smart Digital School',
    'depends': ['base', 'mail'],
    'data': [
        'security/ir.model.access.csv',
        'views/school_views.xml',
    ],
    'installable': True,
    'application': True,
    'license': 'LGPL-3',
}
