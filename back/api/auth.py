from flask.views import MethodView
from apiflask import APIBlueprint
from flask_jwt_extended import create_access_token, get_jwt
from flask_bcrypt import Bcrypt
from models.auth import AccessToken, LoginData
from models.simple import SimpleMessage
from database.manager import db
from helper import get_datetime_from_str
import settings
import datetime

bcrypt = Bcrypt()

AuthBP = APIBlueprint('Auth', __name__)

class LoginAPI(MethodView):
  @AuthBP.post('/login')
  @AuthBP.input(LoginData, location='query')
  @AuthBP.output(AccessToken, description='Successfully logged in')
  @AuthBP.doc(responses={401: 'Authentication failed'})
  def login(self, data):
    """Login"""
    access_token = self.authenticate(
      data['login'],
      data['password'],
      settings.api_JWT_ACCESS_TOKEN_EXPIRES
    )
    if access_token is None:
      # do not use abort() for website
      return {'message': 'Authentication failed'}, 401
    return {'access_token': access_token}, 200

  @staticmethod
  def authenticate(email, password, expires_delta):
    user = db.get_user(email=email)
    if user is None:
      print('Email not found: %s' % email)
    else:
      LoginAPI.test_user_expiration(user)

      if user['role'] in ['user', 'temporary', 'admin']:
        if bcrypt.check_password_hash(user['password'], password):
          return LoginAPI.get_token(user, expires_delta)
        else:
          print('Password hash does not match')
      else:
        print('%s is not approved to log-in' % email)
    return None

  @staticmethod
  def get_expiration_datetime(user):
    datetimeWithoutZ = user['creation_datetime'][:-1]
    creation_datetime = get_datetime_from_str(datetimeWithoutZ)
    expiration_datetime = creation_datetime + settings.temporary_user_duration
    return expiration_datetime

  @staticmethod
  def check_user_expired(user):
    return LoginAPI.get_expiration_datetime(user) < datetime.datetime.utcnow()

  @staticmethod
  def test_user_expiration(user):
    if user['role'] == 'temporary' and LoginAPI.check_user_expired(user):
      print('%s temporary account has expired' % user['email'])
      db.update_user_role(user['id'], 'expired')
      user['role'] = 'expired'

  @staticmethod
  def get_token(user, expires_delta):
    claims = {
      'role': user['role'],
      'firstname': user['firstname'],
      'lastname': user['lastname'],
      'theme': user['theme'],
      'notif_event_change': user['notif_event_change']
    }
    return create_access_token(identity=user['id'], additional_claims=claims, expires_delta=expires_delta)

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



  @AuthBP.get('/logout')
  @AuthBP.output(SimpleMessage, description='Successfully logged out')
  @AuthBP.doc(security='BearerAuth')
  def logout(self):
    """Logout"""
    self.disconnect(get_jwt())
    return {'message': 'Logged out'}, 200

  @staticmethod
  def disconnect(token):
    #TODO: blocklist for instance
    print("disconnect: "+token)
