import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('68.183.19.16', username='root', password='lOnohi_1989$tm')
stdin, stdout, stderr = client.exec_command('/opt/odoo19/venv/bin/python3 -c "import openpyxl; print(\'openpyxl is installed and ready!\')"')
print(stdout.read().decode())
print(stderr.read().decode())
client.close()
