import paramiko
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('68.183.19.16', username='root', password='lOnohi_1989$tm', timeout=20)

shell_code = """
holidays_model = env['school.holiday']
curr_count = holidays_model.search_count([])
print('Existing holidays count:', curr_count)

if curr_count == 0:
    year = env['school.year'].search([('state', '=', 'open')], limit=1)
    if not year:
        year = env['school.year'].search([], limit=1)

    items = [
        {'name': "Aïd Al Mawlid Annabawi", 'type': 'holiday', 'date_start': '2026-09-16', 'date_end': '2026-09-17', 'description': "Fête sacrée du Mawlid Annabawi Asharif", 'color': 1},
        {'name': "1ère Période Intermédiaire (Automne)", 'type': 'vacation', 'date_start': '2026-10-20', 'date_end': '2026-10-27', 'description': "Première période de repos scolaire", 'color': 2},
        {'name': "Fête de la Marche Verte", 'type': 'holiday', 'date_start': '2026-11-06', 'date_end': '2026-11-06', 'description': "Anniversaire de la glorieuse Marche Verte", 'color': 3},
        {'name': "Fête de l'Indépendance", 'type': 'holiday', 'date_start': '2026-11-18', 'date_end': '2026-11-18', 'description': "Fête Nationale de l'Indépendance", 'color': 4},
        {'name': "2ème Période Intermédiaire (Hiver)", 'type': 'vacation', 'date_start': '2026-12-08', 'date_end': '2026-12-15', 'description': "Vacances scolaires d'hiver", 'color': 5},
        {'name': "Manifeste de l'Indépendance", 'type': 'holiday', 'date_start': '2027-01-11', 'date_end': '2027-01-11', 'description': "Anniversaire de la présentation du Manifeste de l'Indépendance", 'color': 6},
        {'name': "Nouvel An Amazigh", 'type': 'holiday', 'date_start': '2027-01-14', 'date_end': '2027-01-14', 'description': "Fête officielle du Nouvel An Amazigh (Yennayer)", 'color': 7},
        {'name': "Vacances de Mi-Année Scolaire", 'type': 'vacation', 'date_start': '2027-01-26', 'date_end': '2027-02-02', 'description': "Fin du premier semestre scolaire", 'color': 8},
        {'name': "3ème Période Intermédiaire (Printemps)", 'type': 'vacation', 'date_start': '2027-03-16', 'date_end': '2027-03-23', 'description': "Vacances scolaires du printemps", 'color': 9},
        {'name': "Aïd Al Fitr", 'type': 'holiday', 'date_start': '2027-03-30', 'date_end': '2027-04-02', 'description': "Fête bénie de la rupture du jeûne", 'color': 10},
        {'name': "Fête du Travail", 'type': 'holiday', 'date_start': '2027-05-01', 'date_end': '2027-05-01', 'description': "Journée Internationale des Travailleurs", 'color': 11},
        {'name': "4ème Période Intermédiaire", 'type': 'vacation', 'date_start': '2027-05-04', 'date_end': '2027-05-11', 'description': "Dernière période de repos avant les examens finaux", 'color': 2},
        {'name': "Aïd Al Adha", 'type': 'holiday', 'date_start': '2027-06-06', 'date_end': '2027-06-09', 'description': "Fête bénie du Grand Sacrifice", 'color': 1}
    ]

    for it in items:
        if year:
            it['year_id'] = year.id
        holidays_model.create(it)

    env.cr.commit()
    print('Seeded', len(items), 'official holidays and vacations!')
else:
    print('Holidays already exist.')
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
