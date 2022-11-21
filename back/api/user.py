from flask import request, abort
from flask_restful import Resource
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from models.user import User, validate_user, filter_user_response
from database.manager import db
import sqlite3

class UserAPICreate(Resource):
  # @swagger.doc({
  #   'tags': ['user'],
  #   'requestBody': {
  #     'required': True,
  #     'content': {
  #       'application/json': {
  #         'schema': User
  #       }
  #     }
  #   },
  #   'responses': {
  #     '201': {
  #       'description': 'Created user',
  #       'content': {
  #         'application/json': {
  #           'schema': User
  #         }
  #       }
  #     },
  #     '409': {
  #       'description': 'Email already registered'
  #     }
  #   }
  # })
  def post(self):
    """Create a user"""
    # Validate request body with schema model
    user = validate_user(request.json, create=True)
    code, result = self.from_dict(user)
    if code != 200:
      abort(code, result)
    return User(**filter_user_response(result)), 201, {'Location': request.path + '/' + str(result['id'])}

  @staticmethod
  def from_dict(dict):
    try:
      props = db.insert_user(**dict)
    except sqlite3.IntegrityError as err:
      if str(err) == "UNIQUE constraint failed: users.email":
        return (409, 'Email already registered')
      return (500, err.args[0])
    except Exception as e:
      return (500, e.args[0])
    return 200,props


class UserAPI(Resource):
  @jwt_required()
  # @swagger.doc({
  #   'tags': ['user'],
  #   'security': [
  #     {'BearerAuth': []}
  #   ],
  #   'parameters': [
  #     {
  #       'name': 'user_id',
  #       'required': True,
  #       'description': 'User identifier',
  #       'in': 'path',
  #       'schema': {
  #         'type': 'integer'
  #       }
  #     }
  #   ],
  #   'responses': {
  #     '200': {
  #       'description': 'User',
  #       'content': {
  #         'application/json': {
  #           'schema': User
  #          }
  #       }
  #     },
  #     '401': {
  #       'description': 'Not authenticated'
  #     },
  #     '404': {
  #       'description': 'User not found'
  #     }
  #   }
  # })
  def get(self, user_id):
    """Get details of a user"""
    props = db.get_user(user_id=user_id)
    if type(props) is not dict:
      abort(404, 'User not found')
    return User(**filter_user_response(props))


  @jwt_required()
  # @swagger.doc({
  #   'tags': ['user'],
  #   'security': [
  #     {'BearerAuth': []}
  #   ],
  #   'parameters': [
  #     {
  #       'name': 'user_id',
  #       'required': True,
  #       'description': 'User identifier',
  #       'in': 'path',
  #       'schema': {
  #         'type': 'integer'
  #       }
  #     }
  #   ],
  #   'requestBody': {
  #     'required': True,
  #     'content': {
  #       'application/json': {
  #         'schema': User
  #       }
  #     }
  #   },

  #   'responses': {
  #     '200': {
  #       'description': 'Updated user',
  #       'content': {
  #         'application/json': {
  #           'schema': User
  #         }
  #       }
  #     },
  #     '401': {
  #       'description': 'Not authenticated'
  #     },
  #     '403': {
  #       'description': 'Update forbidden'
  #     },
  #     '404': {
  #       'description': 'User not found'
  #     }
  #   }
  # })
  def put(self, user_id):
    """Update a user"""
    # Validate request body with schema model
    user = validate_user(request.json, update=True)
    code, result = self.put_from_dict(user_id, user)
    if code != 200:
      abort(code, result)
    # Retrieve updated user with all public properties
    return self.get(user_id)

  @staticmethod
  def put_from_dict(user_id, dict):
    if user_id != get_jwt_identity():
      return (403, "You cannot update someone else")
    try:
      updated_props = db.update_user(user_id, **dict)
    except Exception as e:
      return (500, e.args[0])
    return 200,updated_props


  @jwt_required()
  # @swagger.doc({
  #   'tags': ['user'],
  #   'security': [
  #     {'BearerAuth': []}
  #   ],
  #   'parameters': [
  #     {
  #       'name': 'user_id',
  #       'required': True,
  #       'description': 'User identifier',
  #       'in': 'path',
  #       'schema': {
  #         'type': 'integer'
  #       }
  #     }
  #   ],
  #   'responses': {
  #     '200': {
  #       'description': 'Confirmation message'
  #     },
  #     '401': {
  #       'description': 'Not authenticated'
  #     },
  #     '403': {
  #       'description': 'Deletion forbidden'
  #     },
  #     '404': {
  #       'description': 'User not found'
  #     }
  #   }
  # })
  def delete(self, user_id):
    """Delete a user"""

    user = db.get_user(user_id=user_id)

    claims = get_jwt()
    if claims['role'] == 'admin' and user['role']=='new':
      rowcount = db.delete_user(user_id)
      if rowcount < 1:
        abort(404, 'No user was deleted')
      else:
        return {'message': 'User really deleted'}, 200

    if user_id != get_jwt_identity() and claims['role'] != 'admin':
      abort(403, "You cannot delete someone else")

    # We want to keep user messages (foreign keys)
    db.update_user_role(user_id, "deleted")

    # Note: a real delete would delete all user's messages and registration and events by CASCADE

    return {'message': 'User deleted'}, 200
