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

# Test onchange when level_id is set
res = models.execute_kw(
    db, uid, password, 'school.homework', 'onchange',
    [[], {'level_id': 15, 'year_id': 1}, ['level_id', 'year_id'], {'level_id': {}, 'year_id': {}, 'student_ids': {}}]
)
print('ONCHANGE RESULT:', res)

view = models.execute_kw(
    db, uid, password, 'school.homework', 'get_views',
    [[[False, 'form']]], {}
)
print('VIEW ARCH:', view['views']['form']['arch'])

EOF
"""

stdin, stdout, stderr = client.exec_command(cmd)
print(stdout.read().decode('utf-8'))
print(stderr.read().decode('utf-8'))
client.close()
