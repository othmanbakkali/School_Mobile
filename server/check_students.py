import paramiko
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('68.183.19.16', username='root', password='lOnohi_1989$tm')

cmd = """python3 - << 'EOF'
import xmlrpc.client
url = 'http://127.0.0.1:8069'
db = 'alibdaealamia'
username = 'othmanbakkali@gmail.com'
password = 'Admin@2026'

common = xmlrpc.client.ServerProxy(f'{url}/xmlrpc/2/common')
uid = common.authenticate(db, username, password, {})

models = xmlrpc.client.ServerProxy(f'{url}/xmlrpc/2/object')

students = models.execute_kw(db, uid, password, 'school.student', 'search_read', [[]], {'fields': ['id', 'name', 'level_id', 'year_id']})
print(f"Total students: {len(students)}")
levels = models.execute_kw(db, uid, password, 'school.level', 'search_read', [[]], {'fields': ['id', 'name']})
for l in levels:
    cnt = len([s for s in students if s['level_id'] and s['level_id'][0] == l['id']])
    print(f"Level {l['name']} (id={l['id']}): {cnt} students")

# Check homework fields
hw_fields = models.execute_kw(db, uid, password, 'school.homework', 'fields_get', [['student_ids', 'level_id', 'student_id']], {'attributes': ['domain', 'string', 'type']})
print("HW Fields:", hw_fields)

EOF
"""

stdin, stdout, stderr = client.exec_command(cmd)
print(stdout.read().decode('utf-8'))
print(stderr.read().decode('utf-8'))
client.close()
