from flask import request, abort
from flask_restful_swagger_3 import Resource, swagger
from models.user import User, filter_user_response
from database.manager import db
import sqlite3

class UserAPICreate(Resource):
  @swagger.doc({
    'tags': ['user'],
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
      user = User(**request.json)
    except ValueError as e:
      return abort(400, e.args[0])

    # email is not required in order
    # to be potentially removed in silence_user_fields
    if user.get('email') is None:
      return abort(400, 'The attribute "email" is required')

    try:
      props = db.insert_user(**user)
    except sqlite3.IntegrityError as err:
      if str(err) == "UNIQUE constraint failed: users.email":
        abort(409, 'Email already registered')
      else:
        raise

    return User(**filter_user_response(props)), 201, {'Location': request.path + '/' + str(props['id'])}


class UserAPI(Resource):
  @swagger.doc({
    'tags': ['user'],
    'parameters': [
      {
        'name': 'user_id',
        'required': True,
        'description': 'User identifier',
        'in': 'path',
        'schema': {
          'type': 'integer'
        }
      }
    ],
    'responses': {
      '200': {
        'description': 'User',
        'content': {
          'application/json': {
            'schema': User
           }
        }
      },
      '404': {
        'description': 'User not found'
      }
    }
  })
  def get(self, user_id):
    """Get details of a user"""
    props = db.get_user(user_id)
    if type(props) is not dict:
      abort(404, 'User not found')
    return User(**filter_user_response(props))


  @swagger.doc({
    'tags': ['user'],
    'parameters': [
      {
        'name': 'user_id',
        'required': True,
        'description': 'User identifier',
        'in': 'path',
        'schema': {
          'type': 'integer'
        }
      }
    ],
    'requestBody': {
      'required': True,
      'content': {
        'application/json': {
          'schema': User
        }
      }
    },

    'responses': {
      '200': {
        'description': 'Updated user',
        'content': {
          'application/json': {
            'schema': User
          }
        }
      },
      '404': {
        'description': 'User not found'
      }
    }
  })
  def put(self, user_id):
    """Update a user"""

    try:
      db.update_user(user_id, **request.json)
    except TypeError as e:
      return abort(400, e.args[0])

    # Retrieve updated user with filtered properties
    return self.get(user_id)


  @swagger.doc({
    'tags': ['user'],
    'parameters': [
      {
        'name': 'user_id',
        'required': True,
        'description': 'User identifier',
        'in': 'path',
        'schema': {
          'type': 'integer'
        }
      }
    ],
    'responses': {
      '200': {
        'description': 'Confirmation message'
      },
      '404': {
        'description': 'User not found'
      }
    }
  })
  def delete(self, user_id):
    """Delete a user"""
    # TODO: Foreign keys (ex: messages): shall we delete or set CANCELLED status?
    rowcount = db.delete_user(user_id)
    if rowcount < 1:
      abort(404, 'No user was deleted')
    return {'message': 'User deleted'}, 200
