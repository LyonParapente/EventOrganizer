from mailjet_rest import Client # https://www.mailjet.com/
from flask_mail import Mail, Message
from database.manager import db
from trads import lang
from helper import nice_date, get_date_from_str
from flask import request
import markdown
import settings
#---
import app_secrets
import datetime
import time
import html
import sys
import traceback
from threading import Thread
import copy

flask_app = None

domain = settings.emails['domain']

email_header = """
<div align="center">
<img src="{site}/static/img/logo_115.png" alt="Logo"/>
</div>
<br />
""".format(site=domain)

email_footer = """<br/><br/>
<a href="https://lyonparapente.fr">Le blog</a> | <a href="{site}">Le calendrier</a><br/>
Pour toute question: <a href="mailto:contact@lyonparapente.fr">contact@lyonparapente.fr</a>
""".format(site=domain)

# https://github.com/mattupstate/flask-mail/issues/128
from email import header
header.MAXLINELEN = 32

mail_quota_exceeded = False

def check_domain():
  if flask_app.debug:
    global domain
    domain = "{}://{}".format(
      request.environ['wsgi.url_scheme'],
      request.environ['HTTP_HOST'])

def chunks(l, n):
  n = max(1, n)
  return [l[i:i+n] for i in range(0, len(l), n)]

def send_emails(messages):
  """Send one or more emails"""
  if settings.emails['use_mailjet']:
    send_emails_mailjet(messages)
  else:
    send_emails_smtp_async(messages)

def send_emails_mailjet(messages):
  """Send one or more emails through mailjet api"""
  for message in messages:
    message['From'] = {
      "Email": settings.emails['from_email'],
      "Name": settings.emails['from_name']
    }
    message['ReplyTo'] = {
      "Email": settings.emails['reply_to_email'],
      "Name": settings.emails['reply_to_name']
    }
    message['HTMLPart'] = email_header + message['HTMLPart'] + email_footer

    if message.get('Bcc'):
      bcc = chunks(message['Bcc'], settings.emails['max_recipients_per_mail'])
      message["Bcc"] = bcc[0]
      for remaining in bcc[1:]:
        extra = copy.deepcopy(message)
        extra["Bcc"] = remaining
        messages.append(extra)

  data = {
    'Messages': messages
  }
  #print(data)
  auth = (app_secrets.mailjet_api_key, app_secrets.mailjet_api_secret)
  mailjet = Client(auth=auth, version='v3.1')
  result = mailjet.send.create(data=data)
  if result.status_code != 200:
    with open("mailjet_errors.txt", "a") as myfile:
      myfile.write(str(result.json()))
      myfile.write('\n')

def compute_recipients_inline(contacts):
  recipients = []
  for contact in contacts:
    recipients.append(contact['Name']+' <'+contact['Email']+'>')
  return recipients

def send_email_with_quota_retry(mail, msg):

  # when quota is already reached by another thread
  while mail_quota_exceeded:
    time.sleep(10)

  while True:
    try:
      mail.send(msg)

      # email was successful
      mail_quota_exceeded = False # unlock other threads
      break # get out of loop
    except:
      tracebackmsg = traceback.format_exc()
      if "Mail quota exceeded" in tracebackmsg: # You have exceeded the limit of X messages per hour and per account
        mail_quota_exceeded = True # block all other threads sending emails
        time.sleep(settings.mail_quota_exceeded_timeout + 1)
        # let's try again in the next loop iteration
      else:
        raise


def send_emails_smtp(app, messages):
  if app.debug:
    print(messages)
    return # do not send real email when developing

  start = datetime.datetime.now()
  with app.app_context():
    for message in messages:
      message['HTMLPart'] = email_header + message['HTMLPart'] + email_footer
      try:
        if message.get('Bcc'):
          dests = compute_recipients_inline(message['Bcc'])
        else:
          dests = compute_recipients_inline(message['To'])

        for chunk in chunks(dests, settings.emails['max_recipients_per_mail']):
          bcc = None
          recipients = None
          if message.get('Bcc'):
            bcc = chunk
          else:
            recipients = chunk
          reply_to = settings.emails['reply_to_name']+" <"+settings.emails['reply_to_email']+">"
          msg = Message(message['Subject'], recipients=recipients, bcc=bcc, reply_to=reply_to)
          msg.html = message['HTMLPart']
          send_email_with_quota_retry(mail, msg)
      except:
        with open("smtp_errors.txt", "a") as myfile:
          myfile.write(str(start)+'\n')
          myfile.write(str(sys.exc_info()[0])) # type of exception
          myfile.write('\n')
          myfile.write(traceback.format_exc())
          myfile.write('\n')
  end = datetime.datetime.now()
  # print("send_emails_smtp took: " + str(end - start))

def send_emails_smtp_async(messages):
  Thread(target=send_emails_smtp, args=(flask_app, messages)).start()

def send_application_exception(exception_infos):
  with open("exceptions.txt", "a") as myfile:
    myfile.write(exception_infos)
    myfile.write('\n')

  message = [
    {
      "To": [
        {
          "Email": "lyonparapente@gmail.com",
          "Name": "Lyon Parapente Dev"
        }
      ],
      "Subject": "Application exception",
      "HTMLPart": exception_infos
    }
  ]
  send_emails(message)

#--------------------------------------------------

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
Merci de bien vouloir attendre l'approbation par un administrateur.<br/>
Tu reçevras un email quand ca sera effectué.
"""
    },
    {
      "Bcc": admins,
      "Subject": "Nouvelle inscription calendrier LyonParapente : %s" % name,
      "HTMLPart": """
<b><a href="{site}/user:{id}">{name}</a></b> ({email}) vient de s'enregistrer !<br/>
<br/>
<a href="{site}/users">Clic ici pour accèder au trombinoscope</a> et approuver ou refuser son inscription.<br /><br />
<a href="https://intranet.ffvl.fr/structure/377/licences/">Liste des licenciés FFVL LyonParapente.</a>
""".format(name=html.escape(name), email=html.escape(email), site=domain, id=user_id)
    }
  ]
  send_emails(messages)

def send_approved(email, name, role):
  """Email when account has been approved by an admin"""
  check_domain()
  temporary_msg = ''
  if role == 'temporary':
    temporary_msg = 'Pour le moment, tu as un <b>compte temporaire valable '+str(settings.temporary_user_duration.days)+' jours</b><br/>'

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
{temporary_msg}
<br/>
Tu peux désormais te connecter: <a href="{site}/login">Connexion</a>
<br/><br/>
Tu peux ainsi consulter les sorties, et en ajouter.<br/>
N'oublie pas de mettre ta photo et définir <a href="{site}/settings">tes préférences</a> de partage email et téléphone !
""".format(site=domain, temporary_msg=temporary_msg)
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
  all_users = db.list_users(notif_new_event=True, include_new_and_expired=True)
  recipients = compute_recipients(all_users)

  start_date = nice_date(event['start_date'], settings.lang_locale)
  date_infos = start_date
  if event['end_date'] and str(event['start_date']) != str(event['end_date']):
    end_date_obj = event['end_date']
    end_date_obj -= datetime.timedelta(days=1)
    end_date = nice_date(end_date_obj, settings.lang_locale)
    date_infos += " -> " + end_date

  loc = event.get('location')
  location = ""
  if loc:
    location = "à <b>{location}</b>".format(location=loc)

  messages = [
    {
      "Bcc": recipients,
      "Subject": "{creator_name} vient d'ajouter la sortie {title} ({date_infos})".format(creator_name=creator_name, title=event['title'], date_infos=date_infos),
      "HTMLPart": """
<a href="{site}/user:{creator_id}">{creator_name}</a> vient d'ajouter la sortie <b><a href="{site}/event:{event_id}">{title}</a></b> le {date_infos} {location} :<br/><br/>
{description}
<br/><br/><br/>
<a href="{site}/event:{event_id}">Plus d'informations sur la sortie</a>
""".format(creator_name=html.escape(creator_name), creator_id=str(event['creator_id']),
      event_id=str(event['id']), title=html.escape(event['title'].strip()),
      description=markdown.markdown(event.get('description', '') or ''),
      date_infos=html.escape(date_infos), site=domain, location=location)
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

  # Filter out users who don't want to be notified
  blocklist_raw = db.list_notifications_blocklist(event_id)
  blocklist = [r['user_id'] for r in blocklist_raw]
  for id in list(users.keys()):
    if int(id) in blocklist:
      del users[id]

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
      "Bcc": recipients,
      "Subject": "{author_name} a posté un commentaire pour la sortie {title}".format(author_name=author_name, title=title),
      "HTMLPart": """
{comment}
<br/>
---<br/>
Commentaire de <a href="{site}/user:{author_id}">{author_name}</a> pour la sortie <a href="{site}/event:{event_id}">{title}</a>
""".format(author_name=html.escape(author_name), author_id=str(author_id),
      event_id=str(event_id), title=html.escape(title), site=domain,
      comment=markdown.markdown(comment))
    }
  ]
  send_emails(messages)

def send_new_registration(event_id, user_id, user_name, interest):
  """Emails when somebody register to an event"""
  check_domain()

  if interest!=2:
    return

  event_users = get_users_to_contact(event_id, user_id)
  if len(event_users) == 0:
    return None

  # Fetch event title
  event = db.get_event(event_id)
  title = event['title'].strip()

  recipients = compute_recipients(event_users)
  messages = [
    {
      "Bcc": recipients,
      "Subject": "{user_name} participe à la sortie {title}".format(user_name=user_name, title=title),
      "HTMLPart": """
<a href="{site}/user:{user_id}">{user_name}</a> participe à la sortie <a href="{site}/event:{event_id}">{title}</a>
<br/><br/><br/>
<a href="{site}/event:{event_id}">Plus d'informations sur la sortie</a>
""".format(user_name=html.escape(user_name), user_id=str(user_id),
      event_id=str(event_id), title=html.escape(title), site=domain)
    }
  ]
  send_emails(messages)

def send_del_registration(event_id, user_id, user_name, interest):
  """Emails when somebody delete his/her registration from an event"""
  check_domain()

  if interest!=2:
    return

  event_users = get_users_to_contact(event_id, user_id)
  if len(event_users) == 0:
    return None

  # Fetch event title
  event = db.get_event(event_id)
  title = event['title'].strip()

  recipients = compute_recipients(event_users)
  messages = [
    {
      "Bcc": recipients,
      "Subject": "{user_name} annule sa participation à la sortie {title}".format(user_name=user_name, title=title),
      "HTMLPart": """
<a href="{site}/user:{user_id}">{user_name}</a> annule sa participation à la sortie <a href="{site}/event:{event_id}">{title}</a>
<br/><br/><br/>
<a href="{site}/event:{event_id}">Plus d'informations sur la sortie</a>
""".format(user_name=html.escape(user_name), user_id=str(user_id),
      event_id=str(event_id), title=html.escape(title), site=domain)
    }
  ]
  send_emails(messages)


def send_tomorrow_events():
  """Emails about tomorrow events. Should be called by a scheduling system"""
  check_domain()

  tomorrow = datetime.date.today() + datetime.timedelta(days=1)
  tomorrow_str = tomorrow.strftime("%Y-%m-%d")
  tomorrow_nice = nice_date(tomorrow, settings.lang_locale)

  events = db.get_events_list(tomorrow_str, tomorrow_str, fetch_start_before=False)

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
  for i, event in enumerate(events):
    creator_id = event['creator_id']
    user = db.get_user(user_id=creator_id)
    creator_name = user['firstname'] + ' ' + user['lastname']
    if i > 0:
      events_html += "<hr />"
    events_html += """
<div style="margin:20px 10px;">
<a href="{site}/user:{creator_id}">{creator_name}</a> a planifié la sortie <b><a href="{site}/event:{event_id}">{title}</a></b><br/>
{description}
</div>
""".format(site=domain, creator_id=creator_id, creator_name=html.escape(creator_name),
      event_id=event['id'], title=html.escape(event['title'].strip()),
      description=markdown.markdown(event.get('description', '') or ''))

  all_users = db.list_users(notif_tomorrow_events=True)
  recipients = compute_recipients(all_users)

  messages = [
    {
      "Bcc": recipients,
      "Subject": titre,
      "HTMLPart": """
Voici {desc} pour le {tomorrow_nice} :<br/>
{events_html}
""".format(desc=html.escape(desc), tomorrow_nice=html.escape(tomorrow_nice), events_html=events_html)
    }
  ]
  send_emails(messages)

def test_email():
  print("test_email")
  messages = [
    {
      "To": [
        {
          "Email": settings.emails['test_email'],
          "Name": settings.emails['from_name']
        }
      ],
      "Subject": "Test email " + str(datetime.datetime.now()),
      "HTMLPart": """
Hello world!<br />
<b>gras</b>
"""
    }
  ]
  # send_emails(messages)
  send_emails_smtp(flask_app, messages)

def init(app):
  app.config['MAIL_SERVER'] = settings.emails['server']
  app.config['MAIL_PORT'] = settings.emails['port']
  app.config['MAIL_USE_TLS'] = settings.emails['use_tls']
  app.config['MAIL_USE_SSL'] = settings.emails['use_ssl']
  app.config['MAIL_DEBUG'] = app.debug
  app.config['MAIL_USERNAME'] = settings.emails['username']
  #app.config['MAIL_PASSWORD'] = '' # set in app_secrets.py
  app.config['MAIL_DEFAULT_SENDER'] = settings.emails['from_name']+" <"+settings.emails['from_email']+">"
  global mail
  mail = Mail(app)
  global flask_app
  flask_app = app

