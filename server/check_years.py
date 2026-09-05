import paramiko
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('68.183.19.16', username='root', password='lOnohi_1989$tm')

sftp = client.open_sftp()
script = """
import xmlrpc.client

url = 'http://127.0.0.1:8069'
db = 'alibdaealamia'
username = 'othmanbakkali@gmail.com'
password = 'Admin@2026'

common = xmlrpc.client.ServerProxy(f'{url}/xmlrpc/2/common')
uid = common.authenticate(db, username, password, {})
models = xmlrpc.client.ServerProxy(f'{url}/xmlrpc/2/object')

years = models.execute_kw(db, uid, password, 'school.year', 'search_read', [[]], {'fields': ['id', 'name', 'state', 'active']})
print("School Years:", years)

students = models.execute_kw(db, uid, password, 'school.student', 'search_read', [[('active', '=', True)]], {'fields': ['id', 'name', 'level_id', 'year_id']})
print("Active Students Count:", len(students))

payments = models.execute_kw(db, uid, password, 'school.payment', 'search_read', [[]], {'fields': ['id', 'student_id', 'year_id', 'month', 'amount', 'state']})
print("Existing Payments Count:", len(payments))

"""
with sftp.file('/tmp/check_years.py', 'w') as f:
    f.write(script)
sftp.close()

stdin, stdout, stderr = client.exec_command('python3 /tmp/check_years.py')
print(stdout.read().decode('utf-8'))
print(stderr.read().decode('utf-8'))
client.close()
