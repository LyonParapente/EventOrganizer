from flask import request
from flask_restful_swagger_3 import Resource, swagger
from models.user import User, get_user_parser
from database.manager import db

class UserAPICreate(Resource):
  post_parser = get_user_parser()

  @swagger.doc({
    'tags': ['user'],
    'description': 'Create a user',
    'requestBody': {
      'required': True,
      'content': {
        'application/json': {
          'schema': User
        }
      }
    },
    'responses': {
      '201': {
        'description': 'Created user',
        'content': {
          'application/json': {
            'schema': User
          }
        }
      }
    }
  })
  def post(self):
    """Create a user"""
    args = self.post_parser.parse_args(strict=True)
    user = db.insert_user(**args)
    streamlined_user = {k: v for k, v in user.items() if v is not None}
    return User(**streamlined_user)
