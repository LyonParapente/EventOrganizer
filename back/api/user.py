from flask import request
from flask.views import MethodView
from apiflask import APIBlueprint, abort
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from models.user import UserCreate, UserUpdate, UserResponse, filter_user_response
from models.simple import SimpleMessage
from database.manager import db
import sqlite3

UserBP = APIBlueprint('User', __name__)

@UserBP.post('/user')
@UserBP.input(UserCreate)
@UserBP.output(UserResponse, status_code=201, description='Created user')
@UserBP.doc(responses={409: 'Email already registered'})
def createUser(json):
  """Create a user"""
  httpcode, res, opts = post(json)
  if httpcode != 201:
    abort(httpcode, res)
  return (res, httpcode, opts)

def post(json):
  try:
    props = db.insert_user(**json)
  except sqlite3.IntegrityError as err:
    if str(err) == "UNIQUE constraint failed: users.email":
      return (409, 'Email already registered', None) # OWASP Account Enumeration; but form is public and login is email...
    return (500, err.args[0], None)
  except Exception as e:
    return (500, e.args[0], None)

  return (201, filter_user_response(props), {'Location': request.path + '/' + str(props['id'])})

class UserAPI(MethodView):

  decorators = [jwt_required(), UserBP.doc(security='BearerAuth')]

  @UserBP.output(UserResponse, description='User')
  def get(self, user_id):
    """Get details of a user"""
    return self.get_internal(user_id)

  @staticmethod
  def get_internal(user_id):
    props = db.get_user(user_id=user_id)
    if type(props) is not dict:
      abort(404, 'User not found')
    return filter_user_response(props), 200

  @UserBP.input(UserUpdate)
  @UserBP.output(UserResponse, description='Updated user')
  @UserBP.doc(responses={403: 'Update forbidden'})
  def put(self, user_id, json):  # TODO: use PATCH
    """Update a user"""
    return self.put_internal(user_id, json)

  def put_internal(self, user_id, json):
    if user_id != get_jwt_identity():
      abort(403, "You cannot update someone else")
    try:
      updated_props = db.update_user(user_id, **json)
    except Exception as e:
      abort(500, e.args[0])

    # Retrieve updated user with all public properties
    return self.get_internal(user_id)


  @UserBP.output(SimpleMessage, description='Confirmation message')
  @UserBP.doc(responses={403: 'Deletion forbidden'})
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


UserAPI_view = UserAPI.as_view('UserAPI')
UserBP.add_url_rule('/user/<int:user_id>', view_func=UserAPI_view)
