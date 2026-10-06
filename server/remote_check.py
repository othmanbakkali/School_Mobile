import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('68.183.19.16', username='root', password='lOnohi_1989$tm', timeout=20)

commands = """
find / -name "school_mobile_v2" 2>/dev/null
docker ps 2>/dev/null || true
which odoo || true
systemctl list-units --type=service | grep -i odoo || true
"""

stdin, stdout, stderr = client.exec_command(commands)
print(stdout.read().decode('utf-8'))
client.close()
