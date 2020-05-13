api_path = '/api'
db_filepath = './events.db'
lang = 'fr'
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
uploads_allowed_extensions = {'png', 'jpg', 'jpeg', 'gif'}
international_prefix = '+33'