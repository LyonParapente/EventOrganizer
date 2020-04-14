from flask import request, abort
from flask_restful_swagger_3 import Resource, swagger
from models.user import User, filter_user_response
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
      user = User(**request.get_json())
    except ValueError as e:
      return ErrorModel(**{'message': e.args[0]}), 400

    # email is not required in order
    # to be removed in silence_user_fields
    if user.get('email') is None:
      return ErrorModel(**{'message': 'The attribute "email" is required'}), 400

    try:
      props = db.insert_user(**user)
    except sqlite3.IntegrityError as err:
      if str(err) == "UNIQUE constraint failed: users.email":
        abort(409, 'Email already registered')
      else:
        raise

    return User(**filter_user_response(props))
