import paramiko
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

host = "68.183.19.16"
user = "root"
password = "lOnohi_1989$tm"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=password, timeout=15)

script = """
python3 -c "
import xmlrpc.client
url = 'http://127.0.0.1:8069'
db = 'alibdaealamia'
username = 'othmanbakkali@gmail.com'
pwd = 'Admin@2026'

common = xmlrpc.client.ServerProxy(f'{url}/xmlrpc/2/common')
uid = common.authenticate(db, username, pwd, {})
models = xmlrpc.client.ServerProxy(f'{url}/xmlrpc/2/object')

views = models.execute_kw(db, uid, pwd, 'ir.ui.view', 'search_read', [[('key', 'in', ['web.layout', 'web.login_layout', 'web.brand_promotion', 'web.login', 'web.brand_promotion_message'])]], {'fields': ['id', 'name', 'key', 'arch_db']})
print('Found views:', len(views))
for v in views:
    print('Key:', v['key'], 'Name:', v['name'])
    print(v['arch_db'][:200])
    print('-'*40)

company = models.execute_kw(db, uid, pwd, 'res.company', 'search_read', [[]], {'fields': ['id', 'name', 'email', 'website', 'logo']})
print('Company:', [{'id': c['id'], 'name': c['name'], 'has_logo': bool(c['logo'])} for c in company])
"
"""

stdin, stdout, stderr = client.exec_command(script)
print(stdout.read().decode('utf-8', errors='replace'))
print(stderr.read().decode('utf-8', errors='replace'))
