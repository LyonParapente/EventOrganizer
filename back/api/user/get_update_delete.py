from flask import abort
from flask_restful_swagger_3 import Resource, swagger
from models.user import User, get_user_parser
from database.manager import db

class UserAPI(Resource):
  update_parser = get_user_parser()

  @swagger.doc({
    'tags': ['user'],
    'description': 'Returns a user',
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
    user = db.get_user(user_id)
    if type(user) is not dict:
      abort(404)

    if user['share_email'] == 0:
      user['email'] = ''
    if user['share_phone'] == 0:
      user['phone'] = ''
    for field in User.always_filtered:
      user[field] = None
    streamlined_user = {k: v for k, v in user.items() if v is not None}
    return User(**streamlined_user)


  @swagger.doc({
    'tags': ['user'],
    'description': 'Update a user',
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
      'description': 'Data to update a user',
      'required': True,
      'content': {
        'application/json': {
          'schema': User
        }
      }
    },

    'responses': {
      '201': {
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
    """Update a user entry"""

    args = self.update_parser.parse_args(strict=True)
    db.update_user(user_id, **args)

    # Retrieve updated user with filtered properties
    return self.get(user_id)


  @swagger.doc({
    'tags': ['user'],
    'description': 'Deletes a user',
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
          'text/plain': {
            'type': 'string'
          }
        }
      },
      '404': {
        'description': 'User not found'
      }
    }
  })
  def delete(self, user_id):
    """Delete a user entry"""
    rowcount = db.delete_user(user_id)
    if rowcount < 1:
      abort(404)
    return 'User deleted', 200
