# -*- coding: utf-8 -*-
import sys
import xmlrpc.client

sys.stdout.reconfigure(encoding='utf-8')

ODOO_URL = 'http://68.183.19.16:8069'
ODOO_DB = 'alibdaealamia'
ADMIN_USER = 'othmanbakkali@gmail.com'
ADMIN_PASS = 'Admin@2026'

LEVEL_ID = 14  # 6APG-1 - السادس ابتدائي عام
YEAR_ID = 2   # 2026-2027

STUDENTS_DATA = [
    {"num": 115, "name": "يحيى الخياري",        "parent_id": 106, "parent_name": "الخيار محسن",        "parent_phone": "0633280164"},
    {"num": 116, "name": "ابقالي ريان",         "parent_id": 5,   "parent_name": "المصطفى ابقالي",     "parent_phone": "0641192626"},
    {"num": 117, "name": "الشاط فردوس",        "parent_id": 107, "parent_name": "امينة برورة",          "parent_phone": "0667033477"},
    {"num": 118, "name": "بالحمر صلاح الدين",   "parent_id": 8,   "parent_name": "بالحمر عبد الله",      "parent_phone": "0600388220"},
    {"num": 119, "name": "الحمدي هداية",        "parent_id": 24,  "parent_name": "بلال الحمدي",          "parent_phone": "0665296111"},
    {"num": 120, "name": "الحمزاوي محمد",       "parent_id": 108, "parent_name": "سارة بلقائد الصروخ",   "parent_phone": "0606134123"},
    {"num": 121, "name": "الجلولي اسراء",       "parent_id": 109, "parent_name": "عبد المجيد الجلولي",   "parent_phone": "0626806051"},
    {"num": 122, "name": "المودن آدم",          "parent_id": 72,  "parent_name": "محمد العربي المودن",   "parent_phone": "0718891331"},
    {"num": 123, "name": "خربوش امينة",         "parent_id": 74,  "parent_name": "محمد خربوش",           "parent_phone": "0633583410"},
    {"num": 124, "name": "خديجة السلاسي",       "parent_id": 91,  "parent_name": "محمد سلاسي",           "parent_phone": "0661837434"},
    {"num": 125, "name": "التريد حفصة",         "parent_id": 84,  "parent_name": "تريد نوردين",          "parent_phone": "0663406307"},
    {"num": 126, "name": "المهاجري مصعب",       "parent_id": 25,  "parent_name": "ياسين المهاجري",       "parent_phone": "0678831508"},
]

def main():
    print(f"Connecting to Odoo at {ODOO_URL} (db: {ODOO_DB})...")
    common = xmlrpc.client.ServerProxy(f'{ODOO_URL}/xmlrpc/2/common')
    uid = common.authenticate(ODOO_DB, ADMIN_USER, ADMIN_PASS, {})
    if not uid:
        print("Failed to authenticate.")
        sys.exit(1)
    print(f"Authenticated as Admin UID: {uid}")

    models = xmlrpc.client.ServerProxy(f'{ODOO_URL}/xmlrpc/2/object')

    levels = models.execute_kw(ODOO_DB, uid, ADMIN_PASS, 'school.level', 'read', [[LEVEL_ID]], {'fields': ['id', 'name']})
    if not levels:
        print(f"Level {LEVEL_ID} not found!")
        sys.exit(1)
    print(f"Target Level: {levels[0]['id']} - {levels[0]['name']}")

    existing_6apg = models.execute_kw(
        ODOO_DB, uid, ADMIN_PASS, 'school.student', 'search_read',
        [[['level_id', '=', LEVEL_ID]]],
        {'fields': ['id', 'name', 'parent_id']}
    )
    existing_by_name = {s['name'].strip(): s for s in existing_6apg}
    print(f"Currently {len(existing_6apg)} students in level {LEVEL_ID}.")

    created_count = 0
    updated_count = 0

    for item in STUDENTS_DATA:
        st_name = item['name'].strip()
        p_id = item['parent_id']

        # Ensure parent has the correct phone number if missing/needed
        if item.get('parent_phone'):
            parent_rec = models.execute_kw(ODOO_DB, uid, ADMIN_PASS, 'school.parent', 'read', [[p_id]], {'fields': ['id', 'name', 'phone']})
            if parent_rec and (not parent_rec[0]['phone'] or parent_rec[0]['phone'] == '-'):
                models.execute_kw(ODOO_DB, uid, ADMIN_PASS, 'school.parent', 'write', [[p_id], {'phone': item['parent_phone']}])
                print(f"  [Parent Update] Set phone {item['parent_phone']} for parent {p_id} ({parent_rec[0]['name']})")

        vals = {
            'name': st_name,
            'full_name': st_name,
            'level_id': LEVEL_ID,
            'year_id': YEAR_ID,
            'parent_id': p_id,
            'active': True,
        }

        if st_name in existing_by_name:
            st_id = existing_by_name[st_name]['id']
            models.execute_kw(ODOO_DB, uid, ADMIN_PASS, 'school.student', 'write', [[st_id], vals])
            updated_count += 1
            print(f"  [Updated] ID {st_id}: {st_name} (Parent ID {p_id})")
        else:
            new_id = models.execute_kw(ODOO_DB, uid, ADMIN_PASS, 'school.student', 'create', [vals])
            created_count += 1
            print(f"  [Created] ID {new_id}: {st_name} (Parent ID {p_id})")

    print("\n" + "=" * 60)
    print(f"6APG IMPORT COMPLETE:")
    print(f"  - Created: {created_count}")
    print(f"  - Updated: {updated_count}")
    print(f"  - Total processed: {len(STUDENTS_DATA)}")
    print("=" * 60)

if __name__ == '__main__':
    main()
