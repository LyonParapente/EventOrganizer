#from flask_restful_swagger_3 import Schema

class Schema():
  plop = 'plop'

class Registration(Schema):
  type = 'object'
  properties = {
    'id': {'type': 'integer', 'readOnly': True, 'example': 17},
    'interest': {'type': 'integer', 'enum': [1,2], 'example': 2},
    'event_id': {'type': 'integer', 'readOnly': True, 'example': 12345},
    'user_id': {'type': 'integer', 'readOnly': True, 'example': 101},
    'lastupdate_datetime': {'type': 'string', 'format': 'date-time', 'readOnly': True, 'example': '2020-04-13T16:30:04.461593Z'}
  }
  required = ['interest', 'event_id', 'user_id']

