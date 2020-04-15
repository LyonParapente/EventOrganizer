from flask_restful_swagger_3 import Schema
from flask_restful.reqparse import RequestParser

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
    'creation_datetime': {'type': 'string', 'format': 'date-time', 'readOnly': True, 'example': '2020-04-13 16:30:04'}
  }
  # - email is required, but managed in create to
  # be able to silence it if share_email is false, like phone
  required = ['firstname', 'lastname']


def filter_user_response(props):
  silence_user_fields(props)

  # Always remove writeOnly fields for output
  for field in User.properties:
    if User.properties[field].get('writeOnly') is True:
      props[field] = None

  streamlined_user = {k: v for k, v in props.items() if v is not None}
  return streamlined_user

def silence_user_fields(user):
  if user['share_email'] == 0:
    del user['email']
  if user['share_phone'] == 0:
    del user['phone']
