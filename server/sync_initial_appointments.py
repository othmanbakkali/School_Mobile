import xmlrpc.client
import datetime
import os
import sys

ODOO_URL = "http://68.183.19.16:8069"
ODOO_DB = "alibdaealamia"
ODOO_ADMIN_USER = "othmanbakkali@gmail.com"
ODOO_ADMIN_PASS = "Admin@2026"

print(f"Connecting to Odoo RPC at {ODOO_URL}...")
common = xmlrpc.client.ServerProxy(f"{ODOO_URL}/xmlrpc/2/common")
uid = common.authenticate(ODOO_DB, ODOO_ADMIN_USER, ODOO_ADMIN_PASS, {})

if not uid:
    print("Authentication failed!")
    sys.exit(1)

print(f"Authenticated as Admin UID: {uid}")
models = xmlrpc.client.ServerProxy(f"{ODOO_URL}/xmlrpc/2/object")

# Check existing appointments
count = models.execute_kw(
    ODOO_DB, uid, ODOO_ADMIN_PASS,
    'school.appointment', 'search_count',
    [[]]
)
print(f"Current appointment count in Odoo: {count}")

# Get first 3 students
students = models.execute_kw(
    ODOO_DB, uid, ODOO_ADMIN_PASS,
    'school.student', 'search_read',
    [[('active', '=', True)]],
    {'fields': ['id', 'name', 'parent_id'], 'limit': 3}
)

if students and count == 0:
    today = datetime.date.today()
    
    # 1. Validated RDV in 2 days
    d1 = today + datetime.timedelta(days=2)
    models.execute_kw(
        ODOO_DB, uid, ODOO_ADMIN_PASS,
        'school.appointment', 'create',
        [{
            'student_id': students[0]['id'],
            'parent_id': students[0]['parent_id'][0] if students[0]['parent_id'] else False,
            'date': str(d1),
            'time_slot': '10:00 - 10:30',
            'subject': 'Suivi pédagogique & Résultats du 1er trimestre',
            'appointment_type': 'in_person',
            'notes': 'Discussion autour du travail en classe et du soutien nécessaire.',
            'location': 'Bureau de la Direction - Bâtiment Administratif',
            'admin_notes': 'Rendez-vous validé avec la direction.',
            'state': 'validated'
        }]
    )
    print(f"Created validated appointment for student {students[0]['name']}")

    if len(students) > 1:
        # 2. Pending RDV in 3 days
        d2 = today + datetime.timedelta(days=3)
        models.execute_kw(
            ODOO_DB, uid, ODOO_ADMIN_PASS,
            'school.appointment', 'create',
            [{
                'student_id': students[1]['id'],
                'parent_id': students[1]['parent_id'][0] if students[1]['parent_id'] else False,
                'date': str(d2),
                'time_slot': '11:00 - 11:30',
                'subject': 'Orientation & Choix de filière',
                'appointment_type': 'in_person',
                'notes': 'Échange sur les perspectives d\'orientation.',
                'state': 'pending'
            }]
        )
        print(f"Created pending appointment for student {students[1]['name']}")

    if len(students) > 2:
        # 3. Rescheduled RDV in 4 days
        d3 = today + datetime.timedelta(days=4)
        d3_prop = today + datetime.timedelta(days=5)
        models.execute_kw(
            ODOO_DB, uid, ODOO_ADMIN_PASS,
            'school.appointment', 'create',
            [{
                'student_id': students[2]['id'],
                'parent_id': students[2]['parent_id'][0] if students[2]['parent_id'] else False,
                'date': str(d3),
                'time_slot': '09:30 - 10:00',
                'subject': 'Demande administrative & Aménagement',
                'appointment_type': 'online',
                'notes': 'Point sur les horaires.',
                'proposed_date': str(d3_prop),
                'proposed_time_slot': '14:30 - 15:00',
                'admin_notes': 'La direction est indisponible le matin. Nous vous proposons ce créneau l\'après-midi.',
                'location': 'Visioconférence Google Meet',
                'state': 'rescheduled'
            }]
        )
        print(f"Created rescheduled appointment for student {students[2]['name']}")

# Verify
all_appointments = models.execute_kw(
    ODOO_DB, uid, ODOO_ADMIN_PASS,
    'school.appointment', 'search_read',
    [[]],
    {'fields': ['id', 'student_id', 'parent_name', 'date', 'time_slot', 'state']}
)
print(f"Total appointments in Odoo now: {len(all_appointments)}")
for a in all_appointments:
    print(f"  - #{a['id']}: {a['student_id'][1]} on {a['date']} at {a['time_slot']} (State: {a['state']})")
