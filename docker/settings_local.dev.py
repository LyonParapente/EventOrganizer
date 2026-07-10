# Local development overrides, loaded at the end of settings.py.
# This file is copied to back/settings_local.py on first run by docker/back-entrypoint.sh.
# It is not versioned: edit it freely, delete it to get defaults back.

db_filepath = '/data/events.db'
uploads_folder = '/data/uploads'
avatars_folder = '/data/avatars'
backgrounds_folder = '/data/backgrounds'

domain = "http://localhost:8000"

# All emails are caught by Mailpit: http://localhost:8025
debug_send_emails = True
emails = {
  "use_mailjet": False,
  "server": "mailpit",
  "port": 1025,
  "username": None,
  "use_tls": False,
  "use_ssl": False,
  "from_email": "calendrier@localhost",
  "from_name": "EventOrganizer (dev)",
  "reply_to_email": "noreply@localhost",
  "reply_to_name": "EventOrganizer (dev)",
  "test_email": "test@localhost",
  "domain": domain,
  "max_recipients_per_mail": 50
}
