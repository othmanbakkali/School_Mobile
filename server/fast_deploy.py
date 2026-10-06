import tarfile
import paramiko
import os
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# 1. Create tar.gz bundle
bundle_name = "deploy_bundle.tar.gz"
print(f"Creating {bundle_name}...")

def exclude_git(tarinfo):
    if '.git' in tarinfo.name:
        return None
    return tarinfo

with tarfile.open(bundle_name, "w:gz") as tar:
    if os.path.exists("dist"):
        tar.add("dist", arcname="dist", filter=exclude_git)
        print("  Added dist/")
    if os.path.exists("server/index.js"):
        tar.add("server/index.js", arcname="server/index.js")
        print("  Added server/index.js")
    if os.path.exists("server/.env"):
        tar.add("server/.env", arcname="server/.env")
        print("  Added server/.env")
    if os.path.exists(".env"):
        tar.add(".env", arcname=".env")
        print("  Added .env")
    if os.path.exists("server/vapid_keys.json"):
        tar.add("server/vapid_keys.json", arcname="server/vapid_keys.json")
        print("  Added server/vapid_keys.json")
    if os.path.exists("school_mobile_v2"):
        tar.add("school_mobile_v2", arcname="school_mobile_v2", filter=exclude_git)
        print("  Added school_mobile_v2/")

print(f"Bundle {bundle_name} created successfully. Size: {os.path.getsize(bundle_name)} bytes.")

# 2. Upload to remote server
host = "68.183.19.16"
user = "root"
password = "lOnohi_1989$tm"

print(f"Connecting SSH to {host}...")
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=password, timeout=20)

sftp = client.open_sftp()
remote_bundle = f"/root/{bundle_name}"
print(f"Uploading {bundle_name} -> {remote_bundle}...")
sftp.put(bundle_name, remote_bundle)
sftp.close()
print("Upload completed in seconds!")

# 3. Extract and restart on server
commands = """
set -e
echo "=== 1. Extracting bundle into /root/School_Mobile ==="
mkdir -p /root/School_Mobile
tar -xzf /root/deploy_bundle.tar.gz -C /root/School_Mobile/

echo "=== 2. Updating Odoo Addon school_mobile_v2 ==="
if [ -d "/root/School_Mobile/school_mobile_v2" ]; then
    mkdir -p /opt/odoo19/odoo/addons/school_mobile_v2
    cp -r /root/School_Mobile/school_mobile_v2/* /opt/odoo19/odoo/addons/school_mobile_v2/
    chown -R odoo19:odoo19 /opt/odoo19/odoo/addons/school_mobile_v2/
    su - odoo19 -s /bin/bash -c "/opt/odoo19/venv/bin/python3 /opt/odoo19/odoo/odoo-bin -c /etc/odoo19.conf -u school_mobile_v2 -d alibdaealamia --stop-after-init" || true
    systemctl restart odoo19.service || true
fi

echo "=== 3. Verifying .env configuration ==="
cat << 'EOF' > /root/School_Mobile/.env
ODOO_URL=http://68.183.19.16:8069
ODOO_DB=alibdaealamia
ODOO_ADMIN_USER=othmanbakkali@gmail.com
ODOO_ADMIN_PASS=Admin@2026
VITE_ODOO_URL=https://adminschool.alibdaealamia.ma
VITE_ODOO_DB=alibdaealamia
EOF

cp /root/School_Mobile/.env /root/School_Mobile/server/.env

echo "=== 4. Ensuring dependencies in server ==="
cd /root/School_Mobile/server
npm install web-push dotenv --save || true

echo "=== 5. Restarting pm2 school-app and Nginx ==="
pm2 restart school-app || pm2 start /root/School_Mobile/server/index.js --name school-app
systemctl reload nginx

echo "=== 6. Verification ==="
pm2 list
ls -ld /root/School_Mobile/dist
echo "DEPLOYMENT COMPLETE!"
"""

print("Executing server commands...")
stdin, stdout, stderr = client.exec_command(commands)
out = stdout.read().decode('utf-8', errors='replace')
err = stderr.read().decode('utf-8', errors='replace')

print(out)
if err:
    print("ERRORS / WARNINGS:")
    print(err)

client.close()

if os.path.exists(bundle_name):
    os.remove(bundle_name)

print("Fast deploy finished!")
