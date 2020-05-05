import random
import string
import locale
import datetime

def randomString(stringLength=8):
  letters = string.ascii_lowercase
  return ''.join(random.choice(letters) for i in range(stringLength))

def nice_date(date, lang):
  locale.setlocale(locale.LC_ALL, lang)
  result = '{0:%A} {1} {0:%B} {0:%Y}'.format(date, date.day)
  locale.setlocale(locale.LC_ALL, 'C') # reset
  return result


def get_date_from_str(str):
  if hasattr(datetime.date, 'fromisoformat'):
    return datetime.date.fromisoformat(str)

  parts = map(lambda x: int(x), str.split('-'))
  return datetime.date(*parts)
