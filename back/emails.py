from mailjet_rest import Client # https://www.mailjet.com/
from flask_mail import Mail, Message
from database.manager import db
from trads import lang
from helper import nice_date, get_date_from_str
from flask import request
import settings
#---
import os
import secrets
import base64
import datetime
import html

from_email = "calendrier@lyonparapente.fr"
from_name = "Lyon Parapente"
domain = "https://lyonparapente.azurewebsites.net"

header = """
<div align="center">
<img src="{site}/static/logo_115.png" alt="Logo"/>
</div>
<br />
""".format(site=domain)

footer = """<br/><br/><br/>
<a href="https://lyonparapente.fr">Le blog</a> | <a href="{site}">Le calendrier</a><br/>
Pour toute question: <a href="mailto:contact@lyonparapente.fr">contact@lyonparapente.fr</a>
""".format(site=domain)


def check_domain():
  if request.environ["SERVER_NAME"] == "0.0.0.0":
    global domain
    domain = "{}://{}".format(
      request.environ['wsgi.url_scheme'],
      request.environ['HTTP_HOST'])


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
  """Emails when someones register an account"""
  check_domain()
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
""".format(name=html.escape(name), email=html.escape(email),
    user_id=str(user_id), site=domain)
    }
  ]
  send_emails(messages)

def send_approved(email, name):
  """Email when account has been approved by an admin"""
  check_domain()
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
N'oublie pas de mettre ta photo et définir <a href="{site}/settings">tes préférences</a> de partage email et téléphone !
""".format(site=domain)
    }
  ]
  send_emails(messages)

def send_lost_password(email, name, temp_access):
  """Email to regenerate a lost password"""
  check_domain()
  messages = [
    {
      "To": [
        {
          "Email": email,
          "Name": name
        }
      ],
      "Subject": "Mot de passe oublié",
      "HTMLPart": """
Pour redéfinir ton mot de passe, clic sur le lien suivant :<br/>
<br/>
<a href="{site}{temp_access}">Redéfinir mon mot de passe</a>
<br/><br/>
Si tu n'es pas à l'origine de cette demande, il suffit de ne rien faire :-)
""".format(site=domain, temp_access=html.escape(temp_access))
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
  """Emails when a new event is declared"""
  check_domain()
  all_users = db.list_users(notif_new_event=True)
  recipients = compute_recipients(all_users)

  start_date = nice_date(get_date_from_str(event['start_date']), settings.lang)

  messages = [
    {
      "To": [
        {
          "Email": from_email,
          "Name": from_name
        }
      ],
      "Bcc": recipients,
      "Subject": "{creator_name} vient d'ajouter la sortie {title} ({start_date})".format(creator_name=creator_name, title=event['title'], start_date=start_date),
      "HTMLPart": """
<a href="{site}/user:{creator_id}">{creator_name}</a> vient d'ajouter la sortie <b><a href="{site}/event:{event_id}">{title}</a></b> le {start_date} :<br/><br/>
{description}
<br/><br/><br/>
<a href="{site}/event:{event_id}">Plus d'informations sur la sortie</a>
""".format(creator_name=html.escape(creator_name), creator_id=str(event['creator_id']),
      event_id=str(event['id']), title=html.escape(event['title'].strip()),
      description=html.escape(event.get('description','')).replace('\n', '<br/>'),
      start_date=html.escape(start_date), site=domain)
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
      'email': registration['email'],
      'notif_event_change': registration['notif_event_change']
    }
    user_id = registration['user_id']
    if user_id != ignore_id and user['notif_event_change']==1:
      users[str(user_id)] = user

  # Users who commented
  for message in messages:
    user = {
      'firstname': message['firstname'],
      'lastname': message['lastname'],
      'email': message['email'],
      'notif_event_change': message['notif_event_change']
    }
    user_id = message['author_id']
    if user_id != ignore_id and user['notif_event_change']==1:
      # Add user to dict (or overwrite)
      users[str(user_id)] = user

  # Creator (in case he/she remove the registration but still want notification)
  user = {
    'firstname': creator['firstname'],
    'lastname': creator['lastname'],
    'email': creator['email'],
    'notif_event_change': creator['notif_event_change']
  }
  user_id = creator['id']
  if user_id != ignore_id and user['notif_event_change']==1:
    # Add user to dict (or overwrite)
    users[str(user_id)] = user

  return users.values()

def send_new_message(author_name, author_id, event_id, comment):
  """Emails when a new comment is made"""
  check_domain()
  event_users = get_users_to_contact(event_id, author_id)
  if len(event_users) == 0:
    return None

  # Fetch event title
  event = db.get_event(event_id)
  title = event['title'].strip()

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
""".format(author_name=html.escape(author_name), author_id=str(author_id),
      event_id=str(event_id), title=html.escape(title), site=domain,
      comment=html.escape(comment).replace('\n', '<br/>'))
    }
  ]
  send_emails(messages)

def send_new_registration(event_id, user_id, user_name, interest):
  """Emails when somebody register to an event"""
  check_domain()
  event_users = get_users_to_contact(event_id, user_id)
  if len(event_users) == 0:
    return None

  # Fetch event title
  event = db.get_event(event_id)
  title = event['title'].strip()

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
""".format(user_name=html.escape(user_name), user_id=str(user_id), verb=verb,
      event_id=str(event_id), title=html.escape(title), site=domain)
    }
  ]
  send_emails(messages)

def send_del_registration(event_id, user_id, user_name, interest):
  """Emails when somebody delete his/her registration from an event"""
  check_domain()
  event_users = get_users_to_contact(event_id, user_id)
  if len(event_users) == 0:
    return None

  # Fetch event title
  event = db.get_event(event_id)
  title = event['title'].strip()

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
""".format(user_name=html.escape(user_name), user_id=str(user_id), verb=verb,
      event_id=str(event_id), title=html.escape(title), site=domain)
    }
  ]
  send_emails(messages)


def send_tomorrow_events():
  """Emails about tomorrow events. Should be called by a scheduling system"""
  check_domain()

  tomorrow = datetime.date.today() + datetime.timedelta(days=1)
  tomorrow_str = tomorrow.strftime("%Y-%m-%d")
  tomorrow_nice = nice_date(tomorrow, settings.lang)

  events = db.get_events_list(tomorrow_str, tomorrow_str)
  nb = len(events)
  if nb == 0:
    print("No event tomorrow")
    return
  elif nb == 1:
    titre = "La sortie prévue pour demain"
    desc = "la sortie prévue"
  else:
    titre = "Les sorties prévues pour demain"
    desc = "les sorties prévues"

  events_html = ''
  for event in events:
    creator_id = event['creator_id']
    user = db.get_user(user_id=creator_id)
    creator_name = user['firstname'] + ' ' + user['lastname']
    events_html += """
<div style="margin:10px;">
<a href="{site}/user:{creator_id}">{creator_name}</a> a planifié la sortie <b><a href="{site}/event:{event_id}">{title}</a></b><br/>
{description}
</div>
""".format(site=domain, creator_id=creator_id, creator_name=html.escape(creator_name),
      event_id=event['id'], title=html.escape(event['title'].strip()),
      description=html.escape(event.get('description','')).replace('\n', '<br/>'))

  all_users = db.list_users(notif_tomorrow_events=True)
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
      "Subject": titre,
      "HTMLPart": """
Voici {desc} pour le {tomorrow_nice} :<br/>
{events_html}
""".format(desc=html.escape(desc), tomorrow_nice=html.escape(tomorrow_nice), events_html=events_html)
    }
  ]
  send_emails(messages)


def demo_smtp_provider():
  msg = Message("Hello", bcc=["user@domain.tld"])
  msg.html = "<b>testing</b>"
  mail.send(msg)

def init(app):
  app.config['MAIL_SERVER'] = 'SSL0.OVH.NET'
  app.config['MAIL_PORT'] = 465
  app.config['MAIL_USE_TLS'] = False
  app.config['MAIL_USE_SSL'] = True
  app.config['MAIL_DEBUG'] = app.debug
  app.config['MAIL_USERNAME'] = from_email
  #app.config['MAIL_PASSWORD'] = '' # set in secrets.py
  app.config['MAIL_DEFAULT_SENDER'] = from_name+" <"+from_email+">"
  global mail
  mail = Mail(app)

