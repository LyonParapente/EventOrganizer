from apiflask import Schema, fields, validators
import settings
from trads import trads

en = trads['en']

class UserBase(Schema):
  firstname = fields.String(example='John')
  lastname = fields.String(example='DOE')
  email = fields.Email(example='john.doe@gmail.com', validate=validators.Length(min=5))
  share_email = fields.Boolean(example=False, load_only=True, metadata={'description': 'Does the user allow his/her email to be public?'})
  phone = fields.String(example='01.02.03.04.05')
  share_phone = fields.Boolean(example=False, load_only=True, metadata={'description': 'Does the user allow his/her phone to be public?'})
  has_whatsapp = fields.Boolean(example=False)
  notif_new_event = fields.Boolean(example=True, load_only=True, metadata={'description': en['notif_new_event']})
  notif_event_change = fields.Boolean(example=True, load_only=True, metadata={'description': en['notif_event_change']})
  notif_tomorrow_events = fields.Boolean(example=True, load_only=True, metadata={'description': en['notif_tomorrow_events']})
  theme = fields.String(example=settings.default_theme, load_only=True)
  wing = fields.String(example='Advance Alpha 5 (violet/orange)')
  presentation = fields.String(example='I like to cross')

class UserResponse(UserBase):
  id = fields.Integer(example=101, dump_only=True, required=True)
  firstname = fields.String(example='John', required=True)
  lastname = fields.String(example='DOE', required=True)
  creation_datetime = fields.DateTime(dt_format='iso8601', dump_only=True, required=True, example='2020-04-13T16:30:04.461593')
  last_login_datetime = fields.DateTime(dt_format='iso8601', dump_only=True, required=True, example='2020-04-13T16:30:04.461593')

class UserCreate(UserBase):
  firstname = fields.String(example='John', required=True)
  lastname = fields.String(example='DOE', required=True)
  email = fields.Email(example='john.doe@gmail.com', required=True, validate=validators.Length(min=5))
  password = fields.String(example='password', required=True, load_only=True, validate=validators.Length(min=6))

class UserUpdate(UserBase):
  pass



def filter_user_response(props):
  props['has_whatsapp'] = True if props['has_whatsapp']==1 else False

  silence_user_fields(props)

  # Technical field
  del props['role']

  streamlined_user = {k: v for k, v in props.items() if v is not None}
  return streamlined_user

def silence_user_fields(user):
  if 'password_lost' in user:
    del user['password_lost']

  if user['share_email'] == 0:
    del user['email']
  if user['share_phone'] == 0:
    del user['phone']
    del user['has_whatsapp']
