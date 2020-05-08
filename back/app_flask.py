import os
import json
from flask import Flask, redirect, request, render_template, make_response, send_file
from flask_restful_swagger_3 import Api, swagger
from flask_jwt_extended import JWTManager, jwt_required, jwt_optional, get_jwt_identity, get_jwt_claims
from flask_jwt_extended import unset_jwt_cookies, set_access_cookies, get_raw_jwt
from flask_cors import CORS
from werkzeug.routing import BaseConverter
from werkzeug.utils import secure_filename
import urllib.parse

# ------------------------------
# Our helpers

import settings
from trads import lang
from helper import randomString

import database.manager
database.manager.init(settings.db_filepath)

from image import generate_miniature
from emails import send_register, send_approved, send_lost_password, send_tomorrow_events

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
app.config['JWT_CSRF_IN_COOKIES'] = True

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
# File uploads (avatar)

app.config['UPLOAD_FOLDER'] = settings.uploads_folder # created automatically
app.config['MAX_CONTENT_LENGTH'] = 7 * 1024 * 1024 # 7Mo

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
  header = render_template('header.html', **lang, is_connected=is_connected)
  return render_template('calendar.html', **lang, header=header,
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
  claims = get_jwt_claims()
  header = render_template('header.html', **lang, is_connected=True)
  return render_template('user.html',
    title=lang['userTitle'], lang=lang['lang'], gotohome=lang['gotohome'],
    user=user_item, theme=claims['theme'], header=header)

@app.route('/users')
@jwt_required
def users():
  """Users list"""
  claims = get_jwt_claims()
  iam_admin = claims['role'] == 'admin'
  users = database.manager.db.list_users(include_new=iam_admin)
  if iam_admin:
    # Add a border to list admins and new users
    for user in users:
      if user['role']=='admin':
        user['border'] = 'border-danger'
      elif user['role']=='new':
        user['border'] = 'border-info'

  header = render_template('header.html', **lang, is_connected=True)
  return render_template('users.html',
    title=lang['userTitle'], lang=lang['lang'], gotohome=lang['gotohome'],
    users=users, theme=claims['theme'], header=header, iam_admin=iam_admin)

@app.route('/login', methods=['GET', 'POST'])
@jwt_optional
def login():
  """Login"""
  if request.method == 'POST':
    form = request.form.to_dict()

    # Lost password management
    if form['lost_password'] == '1':
      if form.get('login') is None:
        return render_template('login.html', **lang,
          default_theme=settings.default_theme, error=lang['type_email'])
      else:
        res = LoginAPI.lost_password(form['login'])
        if res:
          params = {'token': res['token'], 'uid': res['uid']}
          temp_access = '/password?'+urllib.parse.urlencode(params)
          send_lost_password(form['login'], res['name'], temp_access)
        # Whatever the result (user found or not), show the same message
        # to avoid leaking data about registered users
        return render_template('login.html', **lang,
          default_theme=settings.default_theme, message=lang['checkemail'])

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
      return render_template('login.html', **lang, error=lang['login_error'],
        default_theme=settings.default_theme), 401
  elif get_jwt_identity() is not None:
    # Already connected
    return redirect('/planning')
  # GET
  return render_template('login.html', **lang,
    default_theme=settings.default_theme)

@app.route('/logout')
def logout():
  """Logout"""
  LogoutAPI.disconnect(get_raw_jwt())
  response = make_response(render_template('login.html', **lang,
    default_theme=settings.default_theme))
  unset_jwt_cookies(response)
  return response

@app.route('/register', methods=['GET', 'POST'])
@jwt_optional
def register():
  """Register an account"""
  if request.method == 'POST':
    code, result = UserAPICreate.from_dict(request.form.to_dict())
    if code == 200:
      f = request.form
      send_register(f['email'], f['firstname']+' '+f['lastname'], result['id'])
      return render_template('register.html', **lang, message=lang['checkemail'])
    else:
      if code == 409:
        result = lang['alreadyRegistered']
      else:
        result = lang['register_error']
      return render_template('register.html', **lang, error=result), code
  elif get_jwt_identity() is not None:
    # Already connected
    return redirect('/planning')
  # GET
  return render_template('register.html', **lang,
    default_theme=settings.default_theme)

@app.route('/approve/user:<int:id>')
@jwt_required
def approve_user(id):
  """Approve a user"""
  claims = get_jwt_claims()
  if claims['role'] == 'admin':
    nb = database.manager.db.update_user_role(id, "user", previous_role="new")
    if nb == 1:
      user = database.manager.db.get_user(user_id=id)
      send_approved(user['email'], user['firstname']+' '+user['lastname'])
      return "OK"
    return "ALREADY APPROVED"
  return "NOPE", 403

@app.route('/delete/user:<int:id>')
@jwt_required
def delete_user(id):
  """Remove a newly registered user"""
  claims = get_jwt_claims()
  if claims['role'] == 'admin':
    user_item = api_user.delete(id)
  return make_response(redirect('/users'))

def allowed_file(filename):
  return '.' in filename and \
    filename.rsplit('.', 1)[1].lower() in settings.uploads_allowed_extensions

@app.route('/settings', methods=['GET', 'POST'])
@jwt_required
def user_settings():
  """User settings"""
  id = get_jwt_identity()
  message = error = ''
  if request.method == 'POST':
    form = request.form.to_dict()

    # Avatar
    file = request.files['avatar']
    if file and file.filename != '':
      if allowed_file(file.filename):
        filename = secure_filename(file.filename)
        os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
        img_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(img_path)
        generate_miniatures(img_path, id)
        os.remove(img_path)
    if form['remove_avatar'] == '1':
      remove_miniatures(id)

    # Ensure checkbox are boolean and not 'on'
    form['share_email'] = False if form.get('share_email') is None else True
    form['share_phone'] = False if form.get('share_phone') is None else True

    # Remove extra fields that would break UserAPI.put_from_dict()
    del form['csrf_token']
    del form['remove_avatar']

    code, result = UserAPI.put_from_dict(id, form)
    if code == 200:
      message = lang['saved']

      # Regenerate new token so that new infos are stored in claims
      claims = get_jwt_claims()
      claims['id'] = id
      claims['firstname'] = form['firstname']
      claims['lastname'] = form['lastname']
      claims['theme'] = form['theme']

      # message is lost... but we have to redirect for csrf_token variable
      return regenerate_claims(claims, '/settings')
    else:
      error = lang['saved_error']

  header = render_template('header.html', **lang,
    is_connected=id is not None)

  #user_item = api_user.get(id) # can't get theme
  user_item = database.manager.db.get_user(user_id=id)

  themes = settings.themes.copy()
  if user_item['theme'] != settings.default_theme:
    themes[settings.default_theme] += ' ('+lang['default']+')'

  csrf_token = get_raw_jwt().get("csrf")
  return render_template('user_settings.html', **lang, header=header,
    user=user_item, themes=themes, csrf_token=csrf_token,
    message=message, error=error, user_id=id, random=randomString())

def regenerate_claims(claims, dest):
  # Note: this destroys remember me...
  expires = settings.web_JWT_ACCESS_TOKEN_EXPIRES
  token = LoginAPI.get_token(claims, expires)
  response = make_response(redirect(dest))
  set_access_cookies(response, token)
  return response

@app.route('/password', methods=['GET', 'POST'])
@jwt_optional
def change_password():
  """Change password"""

  id = get_jwt_identity()
  if id is not None:
    claims = get_jwt_claims()
    theme = claims['theme']
    is_connected = True
  else:
    id = request.args.get('uid')
    token = request.args.get('token')
    theme = settings.default_theme
    is_connected = False

  message = error = ''
  if request.method == 'POST':
    form = request.form.to_dict()
    if form['newPassword'] != form['newPassword2']:
      error = lang['pwdMismatch']
    else:
      if is_connected:
        msg, code = LoginAPI.change_password(
          id,
          form['oldPassword'],
          form['newPassword']
        )
      else:
        msg, code = LoginAPI.reset_password(
          id,
          token,
          form['newPassword']
        )
      if code == 200:
        message = lang['pwdChanged']
      else:
        print(msg)
        error = lang['pwdChanged_error']

  header = render_template('header.html', **lang, is_connected=is_connected)

  csrf_token = get_raw_jwt().get("csrf")
  return render_template('user_password.html', **lang, header=header,
    csrf_token=csrf_token, theme=theme,
    message=message, error=error)

@app.route('/avatars/<string:name>')
@jwt_required
def avatar(name):
  """Get avatar"""
  parts = name.split('-')
  user_id = secure_filename(parts[0])
  size = secure_filename(parts[-1])
  path = settings.avatars_folder+'/'+user_id+'-%s.png'%size
  if not os.path.exists(path):
    path = settings.avatars_folder+'/default-%s.png'%size
  return send_file(path)

miniatures_sizes = [130, 60, 40]

def generate_miniatures(path, user_id):
  user_id = str(user_id)
  for size in miniatures_sizes:
    dest_path = settings.avatars_folder+'/'+user_id+'-'+str(size)+'.png'
    generate_miniature(path, dest_path, format='png', width=size, height=size, enlarge=True)

def remove_miniatures(user_id):
  user_id = str(user_id)
  for size in miniatures_sizes:
    dest_path = settings.avatars_folder+'/'+user_id+'-'+str(size)+'.png'
    try:
      os.remove(dest_path)
    except:
      pass

@app.route('/tomorrow_events')
def tomorrow_events():
  token = request.args.get('token')
  if token == app.config['DAILY_CHECK']:
    send_tomorrow_events()
    return "OK", 200
  return "UNAUTHORIZED", 401

# ------------------------------

if __name__ == '__main__':
  # local development
  app.run(debug=True, host='0.0.0.0', port=os.environ.get("HTTP_PLATFORM_PORT"))
