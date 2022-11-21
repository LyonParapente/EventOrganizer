#from flask_restful_swagger_3 import Schema

class Schema():
  plop = 'plop'

class AccessToken(Schema):
  type = 'object'
  properties = {
    'access_token': {'type': 'string', 'readOnly': True}
  }
