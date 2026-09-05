import paramiko
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('68.183.19.16', username='root', password='lOnohi_1989$tm')

shell_code = """
level = env['school.level'].search([('name', 'ilike', '3APG-1')], limit=1)
print('Class found:', level.name, '(ID:', level.id, ')')

hw = env['school.homework'].new({'level_id': level.id})
res_hw = hw._onchange_level_id()
print('\\n[Homework Test]')
print('  - Onchange domain returned:', res_hw)
print('  - Number of students auto-selected:', len(hw.student_ids))
for s in hw.student_ids[:3]:
    print('    * Student:', s.name, '| Class:', s.level_id.name, '| Year:', s.year_id.name)

att = env['school.attendance'].new({'level_id': level.id})
res_att = att._onchange_level_id()
print('\\n[Attendance Test]')
print('  - Onchange domain returned:', res_att)

gr = env['school.grade'].new({'level_id': level.id})
res_gr = gr._onchange_level_id()
print('\\n[Grade Test]')
print('  - Onchange domain returned:', res_gr)

tr = env['school.cahier.transmission'].new({'level_id': level.id})
res_tr = tr._onchange_level_id()
print('\\n[Transmission Test]')
print('  - Onchange domain returned:', res_tr)
print('  - Number of students auto-selected:', len(tr.student_ids))
"""

stdin, stdout, stderr = client.exec_command('su - odoo19 -s /bin/bash -c "/opt/odoo19/venv/bin/python3 /opt/odoo19/odoo/odoo-bin shell -c /etc/odoo19.conf -d alibdaealamia --no-http"')
stdin.write(shell_code)
stdin.flush()
stdin.channel.shutdown_write()

print(stdout.read().decode('utf-8'))
err = stderr.read().decode('utf-8')
if err:
    print('STDERR:', err)
client.close()
