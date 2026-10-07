{
    'name': 'Gestion Scolaire Mobile V2',
    'version': '1.0',
    'summary': 'Portail parents - Élèves, Absences, Devoirs, Notes, Cantine & Personnalisation Alibdaealalamia',
    'category': 'Education',
    'author': 'Smart Digital School',
    'depends': ['base', 'mail', 'hr', 'web'],
    'data': [
        'security/school_security.xml',
        'security/ir.model.access.csv',
        'data/payment_sequence_data.xml',
        'data/homework_cron_data.xml',
        'data/mobile_tab_data.xml',
        'reports/school_payment_receipt_report.xml',
        'reports/school_wallet_transaction_receipt_report.xml',
        'reports/school_shop_order_reports.xml',
        'reports/school_level_schedule_report.xml',
        'views/school_views.xml',
        'views/mobile_tab_views.xml',
        'views/debranding_views.xml',
    ],
    'assets': {
        'web.assets_backend': [
            'school_mobile_v2/static/src/js/debrand_title.js',
        ],
        'web.assets_frontend': [
            'school_mobile_v2/static/src/js/debrand_title.js',
        ],
    },
    'installable': True,
    'application': True,
    'license': 'LGPL-3',
}
