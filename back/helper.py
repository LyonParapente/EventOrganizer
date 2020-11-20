import random
import string
import locale
import datetime
import re
import settings

def randomString(stringLength=8):
  letters = string.ascii_lowercase
  return ''.join(random.choice(letters) for i in range(stringLength))

def nice_date(date, lang):
  lang_full = locale.normalize(lang)
  locale.setlocale(locale.LC_ALL, lang_full)
  result = '{0:%A} {1} {0:%B} {0:%Y}'.format(date, date.day)
  locale.setlocale(locale.LC_ALL, 'C') # reset
  return result

def get_date_from_str(str):
  if hasattr(datetime.date, 'fromisoformat'):
    return datetime.date.fromisoformat(str)

  parts = map(lambda x: int(x), str.split('-'))
  return datetime.date(*parts)

def get_datetime_from_str(str):
  if hasattr(datetime.datetime, 'fromisoformat'):
    return datetime.datetime.fromisoformat(str)
  return datetime.datetime.strptime(str, '%Y-%m-%dT%H:%M:%S.%f')

def raw_phone(phone):
  return re.sub('[^\d+]', '', phone)

def nice_phone(phone):
  p = raw_phone(phone)
  if len(p) == 10:
    return p[0]+p[1]+'.'+p[2]+p[3]+'.'+p[4]+p[5]+'.'+p[6]+p[7]+'.'+p[8]+p[9]
  return phone

def whatsapp_phone(phone):
  p = raw_phone(phone)
  if len(p) == 10 and p[0] == '0':
    return settings.international_prefix + p[1:]
  return p
