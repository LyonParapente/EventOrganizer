from apiflask import APIBlueprint, abort
from flask_jwt_extended import create_access_token, jwt_required, get_jwt
from flask_bcrypt import Bcrypt
from models.auth import AccessToken, LoginData
from models.simple import SimpleMessage
from database.manager import db
import settings
import datetime

bcrypt = Bcrypt()

AuthBP = APIBlueprint('Auth', __name__)

@AuthBP.post('/login')
@AuthBP.input(LoginData)
@AuthBP.output(AccessToken, description='Successfully logged in')
@AuthBP.doc(responses={401: 'Authentication failed'})
def login(json):
  """Login"""
  access_token = LoginAPI.authenticate(
    json['login'],
    json['password'],
    settings.api_JWT_ACCESS_TOKEN_EXPIRES
  )
  if access_token is None:
    abort(401, 'Authentication failed')
  return {'access_token': access_token}, 200

class LoginAPI():
  @staticmethod
  def authenticate(email, password, expires_delta):
    user = db.get_user(email=email.lower())
    res = None
    if user is None:
      print('Email not found: %s' % email)
    else:
      if bcrypt.check_password_hash(user['password'], password):
        if LoginAPI.test_user_expiration(user):
          res = 'expired'

        if user['role'] in ['user', 'temporary', 'admin']:
          db.update_last_login_datetime(user['id'])
          res = LoginAPI.get_token(user, expires_delta)
          print('Successful login of %s' % email)
        else:
          print('%s is not approved to log-in' % email)
      else:
        print('Password hash does not match')
    return res

  @staticmethod
  def get_expiration_datetime(user):
    expiration_datetime = user['creation_datetime'] + settings.temporary_user_duration
    return expiration_datetime

  @staticmethod
  def check_user_expired(user):
    return LoginAPI.get_expiration_datetime(user) < datetime.datetime.now(datetime.timezone.utc)

  @staticmethod
  def test_user_expiration(user):
    if user['role'] == 'temporary' and LoginAPI.check_user_expired(user):
      print('%s temporary account has expired' % user['email'])
      db.update_user_role(user['id'], 'expired')
      user['role'] = 'expired'
    return user['role'] == 'expired'

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
    user = db.get_user(email=user_email.lower())
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
@jwt_required(optional=True)
@AuthBP.output(SimpleMessage, description='Successfully logged out')
@AuthBP.doc(security='BearerAuth')
def logout():
  """Logout"""
  LogoutAPI.disconnect(get_jwt())
  return {'message': 'Logged out'}, 200

class LogoutAPI():
  @staticmethod
  def disconnect(token_dict):
    if (len(token_dict) > 0):
      #TODO: blocklist for instance
      print("disconnect: "+str(token_dict))
