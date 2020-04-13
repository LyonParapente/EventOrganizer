from flask import request, abort
from flask_restful_swagger_3 import Resource, swagger
from models.user import User, get_user_parser
from database.manager import db
import sqlite3

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
      },
      '409': {
        'description': 'Email already registered'
      }
    }
  })
  def post(self):
    """Create a user"""
    args = self.post_parser.parse_args(strict=True)
    try:
      user = db.insert_user(**args)
    except sqlite3.IntegrityError as err:
      if str(err) == "UNIQUE constraint failed: users.email":
        abort(409, 'Email already registered')
      else:
        raise

    for field in User.always_filtered:
      user[field] = None
    streamlined_user = {k: v for k, v in user.items() if v is not None}
    return User(**streamlined_user)
