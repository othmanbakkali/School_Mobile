# -*- coding: utf-8 -*-
import sys
import xmlrpc.client

sys.stdout.reconfigure(encoding='utf-8')

ODOO_URL = 'http://68.183.19.16:8069'
ODOO_DB = 'alibdaealamia'
ADMIN_USER = 'othmanbakkali@gmail.com'
ADMIN_PASS = 'Admin@2026'

common = xmlrpc.client.ServerProxy(f'{ODOO_URL}/xmlrpc/2/common')
uid = common.authenticate(ODOO_DB, ADMIN_USER, ADMIN_PASS, {})
models = xmlrpc.client.ServerProxy(f'{ODOO_URL}/xmlrpc/2/object')

# 1. Total students count
total_students = models.execute_kw(ODOO_DB, uid, ADMIN_PASS, 'school.student', 'search_count', [[]])
print(f"Total students in Odoo: {total_students}")

# 2. Students in Level 14
st_6apg = models.execute_kw(
    ODOO_DB, uid, ADMIN_PASS, 'school.student', 'search_read',
    [[['level_id', '=', 14]]],
    {'fields': ['id', 'name', 'full_name', 'level_id', 'year_id', 'parent_id']}
)
print(f"Total students in 6APG (Level 14): {len(st_6apg)}")

print("\n--- Listing 6APG Students and Linked Parents ---")
for s in st_6apg:
    pid = s['parent_id'][0] if s['parent_id'] else None
    pname = s['parent_id'][1] if s['parent_id'] else 'NONE'
    phone = ''
    kids = []
    if pid:
        prec = models.execute_kw(ODOO_DB, uid, ADMIN_PASS, 'school.parent', 'read', [[pid]], {'fields': ['phone', 'student_ids']})
        if prec:
            phone = prec[0]['phone'] or ''
            kids = prec[0]['student_ids']
    print(f"ID {s['id']:3d} | {s['name']:20s} | Parent: [ID {pid:3d}] {pname:22s} ({phone}) | All kids of parent: {kids}")

print("\n--- Multi-child Parent Checks for 6APG ---")
for pid in [5, 8, 24, 25, 72, 74, 84, 91]:
    prec = models.execute_kw(ODOO_DB, uid, ADMIN_PASS, 'school.parent', 'read', [[pid]], {'fields': ['id', 'name', 'phone', 'student_ids']})[0]
    kids_recs = models.execute_kw(ODOO_DB, uid, ADMIN_PASS, 'school.student', 'read', [prec['student_ids']], {'fields': ['id', 'name', 'level_id']})
    kids_summary = ", ".join([f"{k['name']} ({k['level_id'][1]})" for k in kids_recs])
    print(f"Parent [ID {pid:3d}] {prec['name']} ({prec['phone']}): {len(kids_recs)} children -> {kids_summary}")
