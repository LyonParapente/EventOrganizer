import os
import json
from flask import Flask, redirect, request, render_template, make_response
from flask_restful_swagger_3 import Api, swagger
from flask_jwt_extended import JWTManager, jwt_required, jwt_optional, get_jwt_identity, get_jwt_claims
from flask_jwt_extended import unset_jwt_cookies, set_access_cookies, get_raw_jwt
from flask_cors import CORS
from werkzeug.routing import BaseConverter
from trads import fr, en
import datetime

# ------------------------------
# Database initialization

import settings
import database.manager
database.manager.init(settings.db_filepath)

# ------------------------------
# Authent part 1: Swagger description

components = {
  'securitySchemes': {
    'BearerAuth': {
      'type': 'http',
      'scheme': 'bearer',
      'bearerFormat': 'JWT'
    }
  }
}

# Apply the security globally to all operations
api_security = [
  # We don't JWT on all API, but just on some
  # See 'security' on @swagger.doc
  #{'BearerAuth': []}
]

# ------------------------------
# Flask initialization

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})
api = Api(app, components=components, security=api_security)

# ------------------------------
# Authent part 2: JWT config

app.config['JWT_TOKEN_LOCATION'] = ['cookies', 'headers']
app.config['JWT_COOKIE_SAMESITE'] = 'Strict'

app.config['JWT_COOKIE_CSRF_PROTECT'] = True
app.config['JWT_CSRF_CHECK_FORM'] = True
app.config['JWT_CSRF_IN_COOKIES'] = False

app.config.from_pyfile('secrets.py')

jwt = JWTManager(app)

def should_be_connected(message):
  if not request:
    return
  if request.path.startswith('/api'):
    return {'message': 'Authentication failed: '+message}, 401

  response = make_response(redirect('/login'))
  unset_jwt_cookies(response)
  return response

@jwt.expired_token_loader
def expired_token_callback(expired_token):
  return should_be_connected('token expired')

@jwt.invalid_token_loader(callback=should_be_connected)

@jwt.unauthorized_loader
def no_token_callback(err):
  print(err)
  return should_be_connected('missing token')

# ------------------------------
# API

from api.auth import LoginAPI, LogoutAPI
api.add_resource(LoginAPI,         settings.api_path+'/auth/login')
api.add_resource(LogoutAPI,        settings.api_path+'/auth/logout')

from api.event import EventAPICreate, EventAPI
api.add_resource(EventAPICreate,   settings.api_path+'/event')
api.add_resource(EventAPI,         settings.api_path+'/event/<int:event_id>')

from api.registration import RegisterAPI
api.add_resource(RegisterAPI,      settings.api_path+'/event/<int:event_id>/registration')

from api.events import EventsAPI
api.add_resource(EventsAPI,        settings.api_path+'/events')

from api.user import UserAPICreate, UserAPI
api.add_resource(UserAPICreate,    settings.api_path+'/user')
api.add_resource(UserAPI,          settings.api_path+'/user/<int:user_id>')

from api.message import MessageAPICreate
api.add_resource(MessageAPICreate, settings.api_path+'/message')

from api.messages import MessagesAPI
api.add_resource(MessagesAPI,      settings.api_path+'/messages')

# ------------------------------
# Routes

class RegexConverter(BaseConverter):
  def __init__(self, url_map, *items):
    super(RegexConverter, self).__init__(url_map)
    self.regex = items[0]

app.url_map.converters['regex'] = RegexConverter

@app.route('/')
@app.route('/planning')
@app.route('/<regex("[0-9]{4}-[0-9]{2}"):id>')
@jwt_optional
def index(id=None):
  """Calendar"""
  return calendar()

@app.route('/event:new')
@app.route('/event:<int:id>')
@jwt_required
def event(id=None):
  """Event details"""
  return calendar()

def calendar():
  user_id = get_jwt_identity()
  is_connected = user_id is not None
  theme = settings.default_theme
  infos = {}
  if is_connected:
    infos = get_jwt_claims()
    theme = infos['theme']
    infos['id'] = user_id
    del infos['role']
  return render_template('calendar.html', **fr,
    is_connected=is_connected, userinfos=json.dumps(infos), theme=theme)


@app.route('/swagger')
def swag():
  """Redirect to Swagger UI"""
  hostname = request.environ["SERVER_NAME"]
  if hostname == "0.0.0.0":
    hostname = 'localhost'
  port = request.environ["SERVER_PORT"]
  protocol = request.environ["wsgi.url_scheme"]
  url = "http://petstore.swagger.io/?url={}://{}:{}/api/swagger.json".format(protocol, hostname, port)
  return redirect(url)

#@app.route("/environ")
#def environ():
#  return "{} <br/><br/><br/> {}".format(request.environ, os.environ)

api_user = UserAPI()

@app.route('/user:<int:id>')
@jwt_required
def user(id):
  """User details"""
  user_item = api_user.get(id)
  return render_template('user.html',
    title=fr['userTitle'], lang=fr['lang'],
    user=user_item)


@app.route('/login', methods=['GET', 'POST'])
@jwt_optional
def login():
  """Login"""
  if request.method == 'POST':
    form = request.form.to_dict()
    expires = settings.web_JWT_ACCESS_TOKEN_EXPIRES
    app.config['JWT_SESSION_COOKIE'] = True
    if form.get('rememberMe') is not None:
      expires = settings.web_remember_JWT_ACCESS_TOKEN_EXPIRES
      # for remember me feature, we have to set expires to
      # something other than 'session'
      # this sets 1 year in the future, but jwt expiration prevails
      app.config['JWT_SESSION_COOKIE'] = False
    token = LoginAPI.authenticate(
      form['login'],
      form['password'],
      expires
    )
    if token is not None:
      response = make_response(redirect('/planning'))
      set_access_cookies(response, token)
      return response
    else:
      return render_template('login.html', **fr, error=fr['login_error']), 401
  elif get_jwt_identity() is not None:
    # Already connected
    return redirect('/planning')
  # GET
  return render_template('login.html', **fr)

@app.route('/logout')
def logout():
  """Logout"""
  LogoutAPI.disconnect(get_raw_jwt())
  response = make_response(render_template('login.html', **fr))
  unset_jwt_cookies(response)
  return response

@app.route('/register', methods=['GET', 'POST'])
@jwt_optional
def register():
  """Register an account"""
  if request.method == 'POST':
    code, result = UserAPICreate.from_dict(request.form)
    if code == 200:
      return render_template('register.html', **fr, message=fr['checkemail'])
    else:
      if code == 409:
        result = fr['alreadyRegistered']
      else:
        result = fr['register_error']
      return render_template('register.html', **fr, error=result), code
  elif get_jwt_identity() is not None:
    # Already connected
    return redirect('/planning')
  # GET
  return render_template('register.html', **fr)

@app.route('/approve/user:<int:id>')
@jwt_required
def approve(id):
  """Approve a user"""
  claims = get_jwt_claims()
  if claims['role'] == 'admin':
    nb = database.manager.db.update_user_role(id, "user")
    return "OK" if nb == 1 else "ERROR"
  return "NOPE", 403

@app.route('/settings', methods=['GET', 'POST'])
@jwt_required
def user_settings():
  """User settings"""
  id = get_jwt_identity()
  message = error = ''
  if request.method == 'POST':
    form = request.form.to_dict()
    # ensure checkbox are boolean and not 'on'
    form['share_email'] = False if form.get('share_email') is None else True
    form['share_phone'] = False if form.get('share_phone') is None else True
    del form['csrf_token']
    code, result = UserAPI.put_from_dict(id, form)
    if code == 200:
      message = fr['saved']
      # regenerate new token so that new infos are stored in claims
      claims = get_jwt_claims()
      claims['id'] = id
      claims['firstname'] = form['firstname']
      claims['lastname'] = form['lastname']
      claims['theme'] = form['theme']
      return regenerate_claims(claims, '/settings')
    else:
      error = fr['saved_error']

  #user_item = api_user.get(id) # can't get theme
  user_item = database.manager.db.get_user(user_id=id)
  csrf_token = get_raw_jwt().get("csrf")
  return render_template('user_settings.html', **fr,
    user=user_item, themes=settings.themes, csrf_token=csrf_token,
    message=message, error=error)

def regenerate_claims(claims, dest):
  now = datetime.datetime.utcnow()
  # this destroys remember me...
  expires = settings.web_JWT_ACCESS_TOKEN_EXPIRES
  token = LoginAPI.get_token(claims, expires)
  response = make_response(redirect(dest))
  set_access_cookies(response, token)
  return response

@app.route('/password', methods=['GET', 'POST'])
@jwt_required
def change_password():
  """Change password"""
  id = get_jwt_identity()
  claims = get_jwt_claims()
  message = error = ''
  if request.method == 'POST':
    form = request.form.to_dict()
    if form['newPassword'] != form['newPassword2']:
      error = fr['pwdMismatch']
    else:
      msg, code = LoginAPI.change_password(
        id,
        form['oldPassword'],
        form['newPassword']
      )
      if code == 200:
        message = fr['pwdChanged']
      else:
        print(msg)
        error = fr['pwdChanged_error']

  csrf_token = get_raw_jwt().get("csrf")
  return render_template('user_password.html', **fr,
    csrf_token=csrf_token, theme=claims['theme'],
    message=message, error=error)

# ------------------------------

if __name__ == '__main__':
  # local development
  app.run(debug=True, host='0.0.0.0', port=os.environ.get("HTTP_PLATFORM_PORT"))
