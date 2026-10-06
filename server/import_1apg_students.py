# -*- coding: utf-8 -*-
import sys
import xmlrpc.client

sys.stdout.reconfigure(encoding='utf-8')

ODOO_URL = 'http://68.183.19.16:8069'
ODOO_DB = 'alibdaealamia'
ADMIN_USER = 'othmanbakkali@gmail.com'
ADMIN_PASS = 'Admin@2026'

LEVEL_ID = 15  # 1APG-1 - الأول ابتدائي عام
YEAR_ID = 2   # 2026-2027

# 32 students with validated names, parent IDs, and parent details
STUDENTS_DATA = [
    {"num": 1,  "name": "العسري محمد جود", "parent_id": 4,   "parent_name": "العسري عمر", "parent_phone": "0661553611"},
    {"num": 2,  "name": "تسنيم ابقالي",     "parent_id": 5,   "parent_name": "المصطفى ابقالي", "parent_phone": "0641192626"},
    {"num": 3,  "name": "أيمن أيت حدوت",   "parent_id": 6,   "parent_name": "ايت حدوت انس", "parent_phone": "0666132021"},
    {"num": 4,  "name": "التيزيني الزرع غيث", "parent_id": 7, "parent_name": "ايوسف التيزيني الزرع", "parent_phone": "0602885328"},
    {"num": 5,  "name": "أناس بلحمار",      "parent_id": 8,   "parent_name": "بالحمر عبد الله", "parent_phone": "0600388220"},
    {"num": 6,  "name": "رياض غزيل",        "parent_id": 9,   "parent_name": "جواد اغزيل", "parent_phone": "0667612808"},
    {"num": 7,  "name": "أميرة الحرور",    "parent_id": 10,  "parent_name": "صالح الحرور", "parent_phone": "0669302154"},
    {"num": 8,  "name": "إسراء الدوق",     "parent_id": 11,  "parent_name": "عبد العزيز الدوق", "parent_phone": "0678015270"},
    {"num": 9,  "name": "جاد عبوز",         "parent_id": 12,  "parent_name": "عبوز سفيان", "parent_phone": "0655235747"},
    {"num": 10, "name": "ريتاج نقيشة",      "parent_id": 13,  "parent_name": "عصام نقيشة", "parent_phone": "0662586691"},
    {"num": 11, "name": "الشاوي محمد يعقوب", "parent_id": 14, "parent_name": "محمد  الشاوي", "parent_phone": "0777386715"},
    {"num": 12, "name": "أمير نجيم",        "parent_id": 15,  "parent_name": "محمد امين نجيم", "parent_phone": "0667743343"},
    {"num": 13, "name": "صفاء ايت يحيى",    "parent_id": 16,  "parent_name": "محمد ايت يحيى", "parent_phone": "0713695434"},
    {"num": 14, "name": "محمد هارون عفيف",  "parent_id": 17,  "parent_name": "محمد عفيف", "parent_phone": "0625731026"},
    {"num": 15, "name": "إسلام هنتوري",     "parent_id": 18,  "parent_name": "مراد هنتوري", "parent_phone": "0688040041"},
    {"num": 16, "name": "ملاك الوهابي",     "parent_id": 19,  "parent_name": "ياسين الوهابي", "parent_phone": "0637400170"},
    {"num": 17, "name": "إخلاص بوكطيرة",    "parent_id": 20,  "parent_name": "ياسين بوكطيرة", "parent_phone": "0666346891"},
    {"num": 18, "name": "بلال العقدي",      "parent_id": 21,  "parent_name": "يحيى العقدي", "parent_phone": "0675641019"},
    {"num": 19, "name": "أمير هنتوري",      "parent_id": 18,  "parent_name": "مراد هنتوري", "parent_phone": "0688040041"},
    {"num": 20, "name": "أريج الطويل",      "parent_id": 22,  "parent_name": "عبد الرحمان الطويل", "parent_phone": "0624817272"},
    {"num": 21, "name": "صفوان عزي",        "parent_id": 23,  "parent_name": "عز الدين عزي", "parent_phone": "0673710373"},
    {"num": 22, "name": "نيزار الحمدي",     "parent_id": 24,  "parent_name": "بلال الحمدي", "parent_phone": "0665296111"},
    {"num": 23, "name": "ضحى المهاجري",     "parent_id": 25,  "parent_name": "ياسين المهاجري", "parent_phone": "0678831508"},
    {"num": 24, "name": "عماد الموساوي",    "parent_id": 26,  "parent_name": "المصطفى المساوي", "parent_phone": "0618188793"},
    {"num": 25, "name": "هداية اشعيبي",     "parent_id": 27,  "parent_name": "محمد اشعيبي", "parent_phone": "0667297271"},
    {"num": 26, "name": "قصي سيعمروا",      "parent_id": 28,  "parent_name": "محسن سيعمرو", "parent_phone": "0663812381"},
    {"num": 27, "name": "بنعياد شفاء",      "parent_id": 29,  "parent_name": "محمد بنعياد", "parent_phone": "0671788288"},
    {"num": 28, "name": "زيد الزيات",       "parent_id": 101, "parent_name": "عبد العزيز الزيات", "parent_phone": "0696478697"},
    {"num": 29, "name": "مريم السلاسي",     "parent_id": 31,  "parent_name": "محمد السلاسي", "parent_phone": "0622733108"},
    {"num": 30, "name": "محمد لحرش",        "parent_id": 32,  "parent_name": "ايوب لحرش", "parent_phone": "0772330379"},
    {"num": 31, "name": "أسية الشهبي",      "parent_id": 33,  "parent_name": "ابراهيم الشهبي", "parent_phone": "0628816126"},
    {"num": 32, "name": "أسيل مهيم",        "parent_id": 34,  "parent_name": "محمد مهيم", "parent_phone": "0626235786"},
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

    # Verify Level 15 exists
    levels = models.execute_kw(ODOO_DB, uid, ADMIN_PASS, 'school.level', 'read', [[LEVEL_ID]], {'fields': ['id', 'name']})
    if not levels:
        print(f"Level {LEVEL_ID} not found!")
        sys.exit(1)
    print(f"Target Level: {levels[0]['id']} - {levels[0]['name']}")

    # Fetch existing students in level 15 to ensure idempotency
    existing_1apg = models.execute_kw(
        ODOO_DB, uid, ADMIN_PASS, 'school.student', 'search_read',
        [[['level_id', '=', LEVEL_ID]]],
        {'fields': ['id', 'name', 'parent_id']}
    )
    existing_by_name = {s['name'].strip(): s for s in existing_1apg}
    print(f"Currently {len(existing_1apg)} students in level {LEVEL_ID}.")

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
    print(f"IMPORT COMPLETE:")
    print(f"  - Created: {created_count}")
    print(f"  - Updated: {updated_count}")
    print(f"  - Total processed: {len(STUDENTS_DATA)}")
    print("=" * 60)

if __name__ == '__main__':
    main()
