from flask_restful_swagger_3 import Schema

class AccessToken(Schema):
  type = 'object'
  properties = {
    'access_token': {'type': 'string', 'readOnly': True}
  }
