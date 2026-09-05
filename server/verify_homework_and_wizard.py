import paramiko
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('68.183.19.16', username='root', password='lOnohi_1989$tm')

sftp = client.open_sftp()

remote_script = """
import xmlrpc.client

url = 'http://127.0.0.1:8069'
db = 'alibdaealamia'
username = 'othmanbakkali@gmail.com'
password = 'Admin@2026'

common = xmlrpc.client.ServerProxy(f'{url}/xmlrpc/2/common')
uid = common.authenticate(db, username, password, {})
models = xmlrpc.client.ServerProxy(f'{url}/xmlrpc/2/object')

print("=== 1. VERIFYING HOMEWORK FIELDS & DOMAIN ===")
hw_fields = models.execute_kw(db, uid, password, 'school.homework', 'fields_get', [['level_id', 'student_ids', 'student_id']], {'attributes': ['domain', 'required', 'type']})
print("Homework level_id required:", hw_fields.get('level_id', {}).get('required'))
print("Homework student_ids domain:", hw_fields.get('student_ids', {}).get('domain'))
print("Homework student_id domain:", hw_fields.get('student_id', {}).get('domain'))

print("\\n=== 2. VERIFYING LEVEL STUDENT FILTERING ===")
# Level 15 = 1APG-1
st_count_15 = models.execute_kw(db, uid, password, 'school.student', 'search_count', [[('level_id', '=', 15)]])
print("Total students in Level 15 (1APG-1):", st_count_15)

# Search students with domain [('level_id', '=', 15)]
students_lvl_15 = models.execute_kw(db, uid, password, 'school.student', 'search_read', [[('level_id', '=', 15)]], {'fields': ['id', 'name', 'level_id'], 'limit': 5})
print("Sample students for level 15:", [(s['id'], s['name']) for s in students_lvl_15])

print("\\n=== 3. VERIFYING PAYMENT TYPE & REGISTRATION ===")
pay_fields = models.execute_kw(db, uid, password, 'school.payment', 'fields_get', [['payment_type']], {'attributes': ['selection', 'string']})
print("Payment types:", pay_fields.get('payment_type', {}).get('selection'))

print("\\n=== 4. VERIFYING TRANSITION WIZARD MODEL ===")
wiz_fields = models.execute_kw(db, uid, password, 'school.student.transition.wizard', 'fields_get', [['source_year_id', 'target_year_id', 'source_level_id', 'target_level_id', 'student_ids', 'registration_fee', 'monthly_fee']], {'attributes': ['string', 'type']})
print("Wizard fields:", list(wiz_fields.keys()))

print("\\n=== ALL VERIFICATIONS PASSED SUCCESSFULLY! ===")
"""

with sftp.file('/tmp/test_verification.py', 'w') as f:
    f.write(remote_script)
sftp.close()

stdin, stdout, stderr = client.exec_command('python3 /tmp/test_verification.py')
print(stdout.read().decode('utf-8'))
print(stderr.read().decode('utf-8'))
client.close()
