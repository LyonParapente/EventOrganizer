from flask_restful_swagger_3 import Schema

class ErrorModel(Schema):
  type = 'object'
  properties = {
    'message': {
      'type': 'string'
    }
  }
