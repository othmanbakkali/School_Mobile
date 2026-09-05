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

# Let's test onchange with recordset logic via odoo shell or direct call
EOF
"""

# Let's test with odoo-bin shell
test_shell_cmd = """su - odoo19 -s /bin/bash -c "/opt/odoo19/venv/bin/python3 /opt/odoo19/odoo/odoo-bin shell -c /etc/odoo19.conf -d alibdaealamia" << 'EOF'
hw = env['school.homework'].new({'level_id': 15, 'year_id': 1})
hw._onchange_level_id()
print("hw.student_ids count:", len(hw.student_ids))
print("hw.student_ids names:", hw.student_ids.mapped('name'))
EOF
"""

stdin, stdout, stderr = client.exec_command(test_shell_cmd)
print(stdout.read().decode('utf-8'))
print(stderr.read().decode('utf-8'))
client.close()
