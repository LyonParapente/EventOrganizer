from mailjet_rest import Client # https://www.mailjet.com/
from database.manager import db
from trads import fr, en
import os
import secrets
import base64

from_email = "calendrier@lyonparapente.fr"
from_name = "LyonParapente"
domain = "https://lyonparapente.azurewebsites.net"

header = """
<div align="center">
<img src="{site}/static/logo_115.png" alt="Logo"/>
</div>
<br />
""".format(site=domain)

footer = """<br/><br/><br/>
<a href="https://lyonparapente.fr">Le blog</a> | <a href="{site}">Le calendrier</a><br/>
Pour toute question: <a href="mailto:lyonparapente@gmail.com">lyonparapente@gmail.com</a>
""".format(site=domain)

def send_emails(messages):
  """Send one or more emails through mailjet api"""
  for i in range(len(messages)):
    messages[i]['From'] = {
      "Email": from_email,
      "Name": from_name
    }
    messages[i]['HTMLPart'] = header + messages[i]['HTMLPart'] + footer

  data = {
  'Messages': messages
  }
  auth = (secrets.mailjet_api_key, secrets.mailjet_api_secret)
  mailjet = Client(auth=auth, version='v3.1')
  result = mailjet.send.create(data=data)
  if result.status_code != 200:
    with open("mailjet_errors.txt", "a") as myfile:
      myfile.write(str(result.json()))
      myfile.write('\n')


def send_register(email, name, user_id):
  admins = compute_recipients(db.list_users(only_admins=True))
  messages = [
    {
      "To": [
        {
          "Email": email,
          "Name": name
        }
      ],
      "Subject": "Inscription LyonParapente",
      "HTMLPart": """
Ton inscription a bien été enregistrée !<br/>
Merci de bien vouloir attendre l'approbation par un administrateur.
"""
    },
    {
      "To": admins,
      "Subject": "Nouvelle inscription LyonParapente",
      "HTMLPart": """
<b><a href="mailto:{email}">{name}</a></b> ({email}) vient de s'enregistrer !<br/>
<br/>
<a href="{site}/approve/user:{user_id}">Clic ici pour l'approuver en temps que membre LyonParapente</a>
""".format(name=name, email=email, user_id=user_id, site=domain)
    }
  ]
  send_emails(messages)

def send_approved(email, name):
  messages = [
    {
      "To": [
        {
          "Email": email,
          "Name": name
        }
      ],
      "Subject": "Inscription LyonParapente approuvée",
      "HTMLPart": """
Ton inscription vient d'être approuvée !<br/>
<br/>
Tu peux désormais te connecter: <a href="{site}/login">Connexion</a>
<br/><br/>
Tu peux ainsi consulter les sorties, et en ajouter.<br/>
N'oublie pas de mettre ta photo et définir tes préférences de partage email et téléphone !
""".format(site=domain)
    }
  ]
  send_emails(messages)

def compute_recipients(users):
  recipients = []
  for user in users:
    obj = {
      "Email": user['email'],
      "Name": user['firstname']+' '+user['lastname']
    }
    recipients.append(obj)
  return recipients

def send_new_event(event, creator_name):
  all_users = db.list_users()
  recipients = compute_recipients(all_users)
  messages = [
    {
      "To": [
        {
          "Email": from_email,
          "Name": from_name
        }
      ],
      "Bcc": recipients,
      "Subject": "{creator_name} vient d'ajouter la sortie {title} ({start_date})".format(creator_name=creator_name, title=event['title'], start_date=event['start_date']),
      "HTMLPart": """
<a href="{site}/user:{creator_id}">{creator_name}</a> vient d'ajouter la sortie <b><a href="{site}/event:{event_id}">{title}</a></b> le {start_date} :<br/><br/>
{description}
<br/><br/><br/>
<a href="{site}/event:{event_id}">Plus d'informations sur la sortie</a>
""".format(creator_name=creator_name, creator_id=str(event['creator_id']),
      event_id=str(event['id']), title=event['title'],
      description=event.get('description','').replace('\n', '<br/>'),
      start_date=event['start_date'], site=domain)
    }
  ]
  send_emails(messages)


def get_users_to_contact(event_id, ignore_id):
  messages, registrations, creator = db.get_messages_list(event_id)
  users = {}

  # Registered users
  for registration in registrations:
    user = {
      'firstname': registration['firstname'],
      'lastname': registration['lastname'],
      'email': registration['email']
    }
    user_id = registration['user_id']
    if user_id != ignore_id:
      users[str(user_id)] = user

  # Users who commented
  for message in messages:
    user = {
      'firstname': message['firstname'],
      'lastname': message['lastname'],
      'email': message['email']
    }
    user_id = message['author_id']
    if user_id != ignore_id:
      # Add user to dict (or overwrite)
      users[str(user_id)] = user

  return users.values()

def send_new_message(author_name, author_id, event_id, comment):
  event_users = get_users_to_contact(event_id, author_id)
  if len(event_users) == 0:
    return None

  # Fetch event title
  event = db.get_event(event_id)
  title = event['title']

  recipients = compute_recipients(event_users)
  messages = [
    {
      "To": [
        {
          "Email": from_email,
          "Name": from_name
        }
      ],
      "Bcc": recipients,
      "Subject": "{author_name} a posté un commentaire pour la sortie {title}".format(author_name=author_name, title=title),
      "HTMLPart": """
<a href="{site}/user:{author_id}">{author_name}</a> a posté un commentaire pour la sortie <a href="{site}/event:{event_id}">{title}</a> :<br/><br/>
{comment}
<br/><br/><br/>
<a href="{site}/event:{event_id}">Plus d'informations sur la sortie</a>
""".format(author_name=author_name, author_id=str(author_id),
      event_id=str(event_id), title=title, site=domain,
      comment=comment.replace('\n', '<br/>'))
    }
  ]
  send_emails(messages)

def send_new_registration(event_id, user_id, user_name, interest):
  event_users = get_users_to_contact(event_id, user_id)
  if len(event_users) == 0:
    return None

  # Fetch event title
  event = db.get_event(event_id)
  title = event['title']

  verb = "participe" if interest==2 else "s'intéresse"

  recipients = compute_recipients(event_users)
  messages = [
    {
      "To": [
        {
          "Email": from_email,
          "Name": from_name
        }
      ],
      "Bcc": recipients,
      "Subject": "{user_name} {verb} à la sortie {title}".format(user_name=user_name, verb=verb, title=title),
      "HTMLPart": """
<a href="{site}/user:{user_id}">{user_name}</a> {verb} à la sortie <a href="{site}/event:{event_id}">{title}</a>
<br/><br/><br/>
<a href="{site}/event:{event_id}">Plus d'informations sur la sortie</a>
""".format(user_name=user_name, user_id=str(user_id), verb=verb,
      event_id=str(event_id), title=title, site=domain)
    }
  ]
  send_emails(messages)

def send_del_registration(event_id, user_id, user_name, interest):
  event_users = get_users_to_contact(event_id, user_id)
  if len(event_users) == 0:
    return None

  # Fetch event title
  event = db.get_event(event_id)
  title = event['title']

  verb = "sa participation" if interest==2 else "son intérêt"

  recipients = compute_recipients(event_users)
  messages = [
    {
      "To": [
        {
          "Email": from_email,
          "Name": from_name
        }
      ],
      "Bcc": recipients,
      "Subject": "{user_name} annule {verb} à la sortie {title}".format(user_name=user_name, verb=verb, title=title),
      "HTMLPart": """
<a href="{site}/user:{user_id}">{user_name}</a> annule {verb} à la sortie <a href="{site}/event:{event_id}">{title}</a>
<br/><br/><br/>
<a href="{site}/event:{event_id}">Plus d'informations sur la sortie</a>
""".format(user_name=user_name, user_id=str(user_id), verb=verb,
      event_id=str(event_id), title=title, site=domain)
    }
  ]
  send_emails(messages)




#TODO:
# - lost password
# - tomorrow events
