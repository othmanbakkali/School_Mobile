import tarfile
import paramiko
import os
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

bundle_name = "odoo_school_module.tar.gz"
print(f"Creating {bundle_name}...")

def exclude_pycache(tarinfo):
    if '__pycache__' in tarinfo.name or '.git' in tarinfo.name:
        return None
    return tarinfo

with tarfile.open(bundle_name, "w:gz") as tar:
    tar.add("school_mobile_v2", arcname="school_mobile_v2", filter=exclude_pycache)

print(f"Bundle created successfully ({os.path.getsize(bundle_name)} bytes).")

host = "68.183.19.16"
user = "root"
password = "lOnohi_1989$tm"

print(f"Connecting SSH to {host}...")
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=password, timeout=30)

sftp = client.open_sftp()
remote_bundle = f"/root/{bundle_name}"
print(f"Uploading {bundle_name} -> {remote_bundle}...")
sftp.put(bundle_name, remote_bundle)
sftp.close()
print("Upload complete!")

commands = """
set -e
echo "=== 1. Extracting module into /opt/odoo19/odoo/addons/ ==="
tar -xzf /root/odoo_school_module.tar.gz -C /opt/odoo19/odoo/addons/
chown -R odoo19:odoo19 /opt/odoo19/odoo/addons/school_mobile_v2

echo "=== 2. Upgrading school_mobile_v2 module in Odoo 19 ==="
su - odoo19 -s /bin/bash -c "/opt/odoo19/venv/bin/python3 /opt/odoo19/odoo/odoo-bin -c /etc/odoo19.conf -u school_mobile_v2 -d alibdaealamia --stop-after-init"

echo "=== 3. Restarting odoo19 service ==="
systemctl restart odoo19.service

echo "=== 4. Verifying service status ==="
systemctl is-active odoo19.service
echo "ODOO UPGRADE SUCCESSFUL!"
"""

print("Executing upgrade commands on server...")
stdin, stdout, stderr = client.exec_command(commands)
out = stdout.read().decode('utf-8', errors='replace')
err = stderr.read().decode('utf-8', errors='replace')

print(out)
if err:
    print("STDERR:")
    print(err)

client.close()

if os.path.exists(bundle_name):
    os.remove(bundle_name)

print("Deploy script completed.")
