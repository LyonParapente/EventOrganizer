api_path = '/api'
db_filepath = './events.db'
default_theme = 'flatly'
themes = {
  "cerulean": "Cerulean",
  "cosmo": "Cosmo",
  "cyborg": "Cyborg",
  "darkly": "Darkly",
  "flatly": "Flatly",
  "journal": "Journal",
  "litera": "Litera",
  "lumen": "Lumen",
  "lux": "Lux",
  "materia": "Materia",
  "minty": "Minty",
  "pulse": "Pulse",
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
import datetime
api_JWT_ACCESS_TOKEN_EXPIRES = datetime.timedelta(minutes=15)
web_JWT_ACCESS_TOKEN_EXPIRES = datetime.timedelta(hours=2)
web_remember_JWT_ACCESS_TOKEN_EXPIRES = datetime.timedelta(days=30)
