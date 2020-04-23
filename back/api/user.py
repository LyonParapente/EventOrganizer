from flask import request, abort
from flask_restful_swagger_3 import Resource, swagger
from flask_jwt_extended import jwt_required
from models.user import User, validate_user, filter_user_response
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
    # Validate request body with schema model
    user = validate_user(request.json, create=True)

    try:
      props = db.insert_user(**user)
    except sqlite3.IntegrityError as err:
      if str(err) == "UNIQUE constraint failed: users.email":
        abort(409, 'Email already registered')
      abort(500, err.args[0])
    except Exception as e:
      abort(500, e.args[0])

    return User(**filter_user_response(props)), 201, {'Location': request.path + '/' + str(props['id'])}


class UserAPI(Resource):
  @jwt_required
  @swagger.doc({
    'tags': ['user'],
    'security': [
      {'BearerAuth': []}
    ],
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
      '401': {
        'description': 'Not authenticated'
      },
      '404': {
        'description': 'User not found'
      }
    }
  })
  def get(self, user_id):
    """Get details of a user"""
    props = db.get_user(user_id=user_id)
    if type(props) is not dict:
      abort(404, 'User not found')
    return User(**filter_user_response(props))


  @jwt_required
  @swagger.doc({
    'tags': ['user'],
    'security': [
      {'BearerAuth': []}
    ],
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
      '401': {
        'description': 'Not authenticated'
      },
      '404': {
        'description': 'User not found'
      }
    }
  })
  def put(self, user_id):
    """Update a user"""
    # Validate request body with schema model
    user = validate_user(request.json, update=True)

    #TODO: only the user can update him/herself

    try:
      db.update_user(user_id, **user)
    except Exception as e:
      abort(500, e.args[0])

    # Retrieve updated user with all public properties
    return self.get(user_id)


  @jwt_required
  @swagger.doc({
    'tags': ['user'],
    'security': [
      {'BearerAuth': []}
    ],
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
      '401': {
        'description': 'Not authenticated'
      },
      '404': {
        'description': 'User not found'
      }
    }
  })
  def delete(self, user_id):
    """Delete a user"""
    #TODO: only the user can delete him/herself
    # TODO: Foreign keys (ex: messages): shall we delete or set CANCELLED status?
    rowcount = db.delete_user(user_id)
    if rowcount < 1:
      abort(404, 'No user was deleted')
    return {'message': 'User deleted'}, 200
