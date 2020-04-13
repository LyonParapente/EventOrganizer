from flask_restful_swagger_3 import Schema
from flask_restful.reqparse import RequestParser

class User(Schema):
  type = 'object'
  properties = {
    'id': {'type': 'integer', 'readOnly': True},
    'firstname': {'type': 'string', 'example': 'John'},
    'lastname': {'type': 'string', 'example': 'DOE'},
    'email': {'type': 'string', 'format': 'email', 'example': 'john.doe@gmail.com'},
    'phone': {'type': 'string', 'example': '01.02.03.04.05'},
    'creation_datetime': {'type': 'string', 'format': 'datetime', 'readOnly': True, 'example': '2020-04-13 16:30:04'}
  }
  required = ['firstname', 'lastname', 'email']
  always_filtered = ['password','share_email','share_phone']

def get_user_parser():
  parser = RequestParser()
  parser.add_argument('firstname', type=str, location='json')
  parser.add_argument('lastname', type=str, location='json')
  parser.add_argument('email', type=str, location='json')
  parser.add_argument('password', type=str, location='json')
  parser.add_argument('share_email', type=bool, location='json')
  parser.add_argument('phone', type=str, location='json')
  parser.add_argument('share_phone', type=bool, location='json')
  return parser

def silence_user_fields(user):
  if user['share_email'] == 0:
    user['email'] = ''
  if user['share_phone'] == 0:
    user['phone'] = ''
