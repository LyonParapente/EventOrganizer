from flask import request, abort
from flask_restful_swagger_3 import Resource, Schema, swagger
from flask_jwt_extended import create_access_token, get_raw_jwt
from flask_bcrypt import Bcrypt
from models.auth import AccessToken
from database.manager import db
import settings

bcrypt = Bcrypt()

class LoginAPI(Resource):
  @swagger.doc({
    'tags': ['auth'],
    'parameters': [
      {
        'name': 'login',
        'required': True,
        'description': 'User email',
        'in': 'query',
        'schema': {
          'type': 'string'
        }
      },
      {
        'name': 'password',
        'required': True,
        'description': 'User password',
        'in': 'query',
        'schema': {
          'type': 'string'
        }
      }
    ],
    'responses': {
      '200': {
        'description': 'Successfully logged in',
        'content': {
          'application/json': {
            'schema': AccessToken
          }
        }
      },
      '401': {
        'description': 'Authentication failed'
      }
    }
  })
  def post(self):
    """Login"""
    infos = request.args.to_dict()
    access_token = LoginAPI.authenticate(
      infos['login'],
      infos['password'],
      settings.api_JWT_ACCESS_TOKEN_EXPIRES
    )
    if access_token is None:
      # do not use abort() for website
      return {'message': 'Authentication failed'}, 401
    return AccessToken(**{'access_token': access_token}), 200

  @staticmethod
  def authenticate(email, password, expires_delta):
    user = db.get_user(email=email)
    if user is None:
      print('Email not found: %s' % email)
    else:
      if user['role'] == 'user' or user['role'] == 'admin':
        if bcrypt.check_password_hash(user['password'], password):
          return LoginAPI.get_token(user, expires_delta)
        else:
          print('Password hash does not match')
      else:
        print('%s is not approved to log-in' % email)
    return None

  @staticmethod
  def get_token(user, expires_delta):
    claims = {
      'role': user['role'],
      'firstname': user['firstname'],
      'lastname': user['lastname'],
      'theme': user['theme'],
      'notif_event_change': user['notif_event_change']
    }
    return create_access_token(identity=user['id'],
    user_claims=claims, expires_delta=expires_delta)

  @staticmethod
  def change_password(user_id, old_password, new_password):
    user = db.get_user(user_id=user_id)
    if user is None:
      return "User not found",404
    if bcrypt.check_password_hash(user['password'], old_password):
      db.update_user(user_id, password=new_password)
      db.set_password_lost(user_id, empty=True)
      return "Password changed",200
    else:
      return "Invalid old password",401
  
  @staticmethod
  def lost_password(user_email):
    user = db.get_user(email=user_email)
    if user:
      user_id = user['id']
      token = db.set_password_lost(user_id)
      if token is not None:
        res = {
          'token': token,
          'uid': user_id,
          'name': user['firstname']+' '+user['lastname']
        }
        return res
    return None

  @staticmethod
  def reset_password(user_id, token, new_password):
    user = db.get_user(user_id=user_id)
    if user is None:
      return "User not found",404
    if user['password_lost'] == token:
      db.update_user(user_id, password=new_password)
      db.set_password_lost(user_id, empty=True)
      return "Password changed",200
    else:
      return "Invalid token",401


class LogoutAPI(Resource):
  @swagger.doc({
    'tags': ['auth'],
    'security': [
      {'BearerAuth': []}
    ],
    'responses': {
      '200': {
        'description': 'Successfully logged out'
      },
      '401': {
        'description': 'Not authenticated'
      }
    }
  })
  def get(self):
    """Logout"""
    self.disconnect(get_raw_jwt())
    return {'message': 'Logged out'}, 200

  @staticmethod
  def disconnect(token):
    #TODO: blacklist for instance
    print(token)
