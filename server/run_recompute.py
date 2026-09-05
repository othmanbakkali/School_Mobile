import paramiko
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

host = "68.183.19.16"
user = "root"
password = "lOnohi_1989$tm"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect(host, username=user, password=password, timeout=15)
    print("SUCCESS: Connected to server via SSH!")
except Exception as e:
    print(f"ERROR: Connection failed: {e}")
    sys.exit(1)

shell_script = """
su - odoo19 -s /bin/bash -c "/opt/odoo19/venv/bin/python3 /opt/odoo19/odoo/odoo-bin shell -c /etc/odoo19.conf -d alibdaealamia --no-http" << 'EOF'
students = env['school.student'].search([])
print(f"Total students to recompute: {len(students)}")
for st in students:
    st._compute_grade_summaries()
    st._compute_average_grade()
env.cr.commit()
print("Recomputation committed successfully!")
EOF
"""

print("\nExecuting recompute in Odoo shell...")
stdin, stdout, stderr = client.exec_command(shell_script)
out = stdout.read().decode('utf-8', errors='replace')
err = stderr.read().decode('utf-8', errors='replace')

print("=== STDOUT ===")
print(out)
print("=== STDERR ===")
print(err)
client.close()
