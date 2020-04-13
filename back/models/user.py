from flask_restful_swagger_3 import Schema
from flask_restful.reqparse import RequestParser

class User(Schema):
  type = 'object'
  properties = {
    'id': {'type': 'integer', 'readOnly': True},
    'firstname': {'type': 'string', 'example': 'John'},
    'lastname': {'type': 'string', 'example': 'DOE'},
    'email': {'type': 'string', 'example': 'john.doe@gmail.com'}, # if shared
    'phone': {'type': 'string', 'example': '01.02.03.04.05'}, # if shared
    'creation_datetime': {'type': 'string', 'format': 'datetime', 'readOnly': True, 'example': '2020-04-13 16:30:04'}
  }

def get_user_parser():
  parser = RequestParser()
  parser.add_argument('firstname', type=str, required=True, location='json')
  parser.add_argument('lastname', type=str, required=True, location='json')
  parser.add_argument('email', type=str, required=True, location='json')
  parser.add_argument('password', type=str, required=True, location='json')
  parser.add_argument('phone', type=str, location='json')
  return parser
