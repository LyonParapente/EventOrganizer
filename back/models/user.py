from flask_restful_swagger_3 import Schema
from flask import abort
import settings
from trads import trads

en = trads['en']

class User(Schema):
  type = 'object'
  properties = {
    'id': {'type': 'integer', 'readOnly': True, 'example': 101},
    'firstname': {'type': 'string', 'example': 'John'},
    'lastname': {'type': 'string', 'example': 'DOE'},
    'email': {'type': 'string', 'format': 'email',
      'example': 'john.doe@gmail.com', 'minLength': 5},
    'share_email': {'type': 'boolean', 'writeOnly': True,
      'example': False, 'default': False,
      'description': 'Does the user allow his/her email to be public?'},
    'password': {'type': 'string', 'format': 'password', 'minLength': 6,
      'writeOnly': True, 'example': 'password'},
    'phone': {'type': 'string', 'example': '01.02.03.04.05'},
    'share_phone': {'type': 'boolean', 'writeOnly': True,
      'example': False, 'default': False,
      'description': 'Does the user allow his/her phone to be public?'},
    'has_whatsapp': {'type': 'boolean', 'example': False, 'default': False},
    'notif_new_event': {'type': 'boolean', 'writeOnly': True,
      'example': True, 'default': True,
      'description': en['notif_new_event']},
    'notif_event_change': {'type': 'boolean', 'writeOnly': True,
      'example': True, 'default': True,
      'description': en['notif_event_change']},
    'notif_tomorrow_events': {'type': 'boolean', 'writeOnly': True,
      'example': True, 'default': True,
      'description': en['notif_tomorrow_events']},
    'theme': {'type': 'string', 'default': settings.default_theme, 'writeOnly': True},
    'wing': {'type': 'string', 'example': 'Advance Alpha 5 (violet/orange)'},
    'presentation': {'type': 'string', 'example': 'I like to cross'},
    'creation_datetime': {'type': 'string', 'format': 'date-time', 'readOnly': True, 'example': '2020-04-13T16:30:04.461593Z'}
  }
  # required on response:
  required = ['id', 'firstname', 'lastname', 'creation_datetime']


# The following classes do not appear in swagger
class UserCreate(User):
  required = ['firstname', 'lastname', 'lastname', 'email', 'password']
class UserUpdate(User):
  required = []

def validate_user(json, create=False, update=False):
  try:
    if create == True:
      user = UserCreate(**json)
    elif update == True:
      user = UserUpdate(**json)
  except ValueError as e:
    abort(400, e.args[0])
  return user

def filter_user_response(props):
  props['has_whatsapp'] = True if props['has_whatsapp']==1 else False

  silence_user_fields(props)

  # Always remove writeOnly fields for output
  for field in User.properties:
    if User.properties[field].get('writeOnly') is True:
      props[field] = None

  # Technical field
  del props['role']

  streamlined_user = {k: v for k, v in props.items() if v is not None}
  return streamlined_user

def silence_user_fields(user):
  if hasattr(user, 'password_lost'):
    del user['password_lost']

  if user['share_email'] == 0:
    del user['email']
  if user['share_phone'] == 0:
    del user['phone']
    del user['has_whatsapp']
