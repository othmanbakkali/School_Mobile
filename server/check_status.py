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

commands = """
systemctl is-active odoo19 || systemctl is-active odoo
"""

stdin, stdout, stderr = client.exec_command(commands)
print("Odoo service status:", stdout.read().decode('utf-8', errors='replace').strip())

client.close()
