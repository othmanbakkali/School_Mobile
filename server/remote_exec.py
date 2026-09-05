import paramiko
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

host = "68.183.19.16"
user = "root"
password = "lOnohi_1989$tm"

print(f"Connecting to {host} as {user}...")

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect(host, username=user, password=password, timeout=15)
    print("SUCCESS: Connected to server via SSH!")
except Exception as e:
    print(f"ERROR: Connection failed: {e}")
    sys.exit(1)

commands = """
set -e
echo "=== 1. Git pull on /root/School_Mobile ==="
if [ -d "/root/School_Mobile" ]; then
    cd /root/School_Mobile
    git fetch origin main
    git reset --hard origin/main
    git pull origin main
else
    echo "Creating /root/School_Mobile..."
    mkdir -p /root/School_Mobile
    git clone https://github.com/othmanbakkali/School_Mobile.git /root/School_Mobile
    cd /root/School_Mobile
fi

echo "=== 2. Copying school_mobile_v2 files ==="
mkdir -p /opt/odoo19/odoo/addons/school_mobile_v2
cp -r /root/School_Mobile/school_mobile_v2/* /opt/odoo19/odoo/addons/school_mobile_v2/
chown -R odoo19:odoo19 /opt/odoo19/odoo/addons/school_mobile_v2/
echo "Addons copied successfully."

echo "=== 3. Restarting Odoo service ==="
systemctl restart odoo19 || systemctl restart odoo || true
sleep 3
systemctl status odoo19 --no-pager | head -n 10 || systemctl status odoo --no-pager | head -n 10 || true

echo "=== 4. Updating module via odoo-bin if possible ==="
su - odoo19 -s /bin/bash -c "/opt/odoo19/venv/bin/python3 /opt/odoo19/odoo/odoo-bin -c /etc/odoo19.conf -u school_mobile_v2 -d alibdaealamia --stop-after-init" 2>&1 || true
systemctl restart odoo19 || true
"""

print("\nExecuting server deployment...")
stdin, stdout, stderr = client.exec_command(commands)
out = stdout.read().decode('utf-8', errors='replace')
err = stderr.read().decode('utf-8', errors='replace')

print(out)
if err:
    print("ERRORS / WARNINGS:")
    print(err)

client.close()
print("Execution finished.")
