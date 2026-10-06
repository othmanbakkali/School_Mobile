import paramiko
import os
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

host = "68.183.19.16"
user = "root"
password = "lOnohi_1989$tm"

print(f"Connecting to {host}...")
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=password, timeout=20)
sftp = client.open_sftp()
print("SFTP connected.")

# 1. Upload server/index.js
local_index = "server/index.js"
remote_index = "/root/School_Mobile/server/index.js"
print(f"Uploading {local_index} -> {remote_index}...")
sftp.put(local_index, remote_index)
print("Uploaded server/index.js successfully.")

# Upload vapid_keys.json if exists
if os.path.exists("server/vapid_keys.json"):
    print("Uploading vapid_keys.json...")
    sftp.put("server/vapid_keys.json", "/root/School_Mobile/server/vapid_keys.json")

# 2. Upload dist folder
local_dist = "dist"
remote_dist = "/root/School_Mobile/dist"

def upload_dir(local_path, remote_path):
    try:
        sftp.mkdir(remote_path)
    except IOError:
        pass
    for item in os.listdir(local_path):
        l_item = os.path.join(local_path, item)
        r_item = f"{remote_path}/{item}"
        if os.path.isdir(l_item):
            upload_dir(l_item, r_item)
        else:
            sftp.put(l_item, r_item)

print(f"Uploading {local_dist} -> {remote_dist}...")
upload_dir(local_dist, remote_dist)
print("Uploaded dist successfully.")

sftp.close()

# 3. Restart pm2 and nginx
def exec_cmd(cmd):
    print(f"Executing: {cmd}")
    stdin, stdout, stderr = client.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    if out: print(out)
    if err: print("ERR:", err)

# Ensure web-push package is installed in server/node_modules if needed
exec_cmd("cd /root/School_Mobile/server && npm install web-push dotenv --save || true")
exec_cmd("pm2 restart school-app")
exec_cmd("systemctl reload nginx")

client.close()
print("Deploy complete!")
