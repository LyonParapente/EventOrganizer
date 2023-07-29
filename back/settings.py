api_path = '/api'
db_filepath = './events.db'
lang = 'fr'  # key from trads.ts
lang_locale = 'fr_FR'  # Make sure locale is available! (ex: apt-get install language-pack-<id>)
default_theme = 'united'
themes = {
  "cerulean": "Cerulean",
  "cosmo": "Cosmo",
  #"cyborg": "Cyborg",
  "darkly": "Darkly",
  "flatly": "Flatly",
  "journal": "Journal",
  "litera": "Litera",
  "lumen": "Lumen",
  "lux": "Lux",
  #"materia": "Materia",
  "minty": "Minty",
  #"pulse": "Pulse",
  "sandstone": "Sandstone",
  "simplex": "Simplex",
  "sketchy": "Sketchy",
  "slate": "Slate",
  "solar": "Solar",
  "spacelab": "Spacelab",
  "superhero": "Superhero",
  "united": "United",
  "yeti": "Yeti"
}
#---
import datetime
api_JWT_ACCESS_TOKEN_EXPIRES = datetime.timedelta(minutes=15)
web_JWT_ACCESS_TOKEN_EXPIRES = datetime.timedelta(hours=1)
web_remember_JWT_ACCESS_TOKEN_EXPIRES = datetime.timedelta(days=30)
#---
uploads_folder = 'uploads'
avatars_folder = 'avatars'
backgrounds_folder = 'backgrounds'
uploads_allowed_extensions = {'png', 'jpg', 'jpeg', 'gif'}
international_prefix = '+33'
temporary_user_duration = datetime.timedelta(days=60) # +web_remember_JWT_ACCESS_TOKEN_EXPIRES if user checked remember credentials
domain = "https://calendrier.lyonparapente.fr"
emails = {
  "use_mailjet": False,
  "server": "SSL0.OVH.NET",
  "port": 465,
  "username": "calendrier@lyonparapente.fr",  # password in app_secrets.py
  "use_tls": False,
  "use_ssl": True,
  "from_email": "calendrier@lyonparapente.fr",
  "from_name": "Lyon Parapente",
  "reply_to_email": "noreply@lyonparapente.fr",
  "reply_to_name": "Lyon Parapente",
  "test_email": "lyonparapente@gmail.com",
  "domain": domain,
  "max_recipients_per_mail": 50
}
mail_quota_exceeded_timeout = 3600 # in seconds
