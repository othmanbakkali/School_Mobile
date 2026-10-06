import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('68.183.19.16', username='root', password='lOnohi_1989$tm', timeout=20)

commands = """
systemctl cat odoo19.service
"""

stdin, stdout, stderr = client.exec_command(commands)
print(stdout.read().decode('utf-8'))
client.close()
