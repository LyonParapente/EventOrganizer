from flask import request, abort
from flask_restful_swagger_3 import Resource, swagger
from models.user import User
from models.error import ErrorModel
from database.manager import db
import sqlite3

class UserAPICreate(Resource):
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
    try:
      # Validate request body with schema model
      args = User(**request.get_json())
    except ValueError as e:
      return ErrorModel(**{'message': e.args[0]}), 400

    try:
      user = db.insert_user(**args)
    except sqlite3.IntegrityError as err:
      if str(err) == "UNIQUE constraint failed: users.email":
        abort(409, 'Email already registered')
      else:
        raise

    #silence_user_fields(user) # not necessary when creating
    for field in User.always_filtered:
      user[field] = None
    streamlined_user = {k: v for k, v in user.items() if v is not None}
    return User(**streamlined_user)
