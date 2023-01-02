import os
import json
from apiflask import APIFlask, APIBlueprint
from flask import redirect, request, render_template, make_response, send_file
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity, get_jwt
from flask_jwt_extended import unset_jwt_cookies, set_access_cookies, get_jwt
from flask_cors import CORS
from werkzeug.routing import BaseConverter
from werkzeug.utils import secure_filename
from werkzeug.exceptions import HTTPException
from helper import raw_phone, nice_phone, whatsapp_phone
import urllib.parse
import html
import sys, traceback
import random
import ics
import markdown
import datetime

# ------------------------------
# Our helpers

import settings
from trads import lang
from helper import randomString

import database.manager
database.manager.init(settings.db_filepath)

from image import resize_image
import emails

# ------------------------------
# Flask initialization

app = APIFlask(__name__, title='EventOrganizer API', docs_path='/swagger', spec_path='/openapi.yaml', version='1.1')
CORS(app, resources={r"/api/*": {"origins": "*"}, r"/openapi.yaml": {"origins": "*"}})

# openapi swagger in yaml
app.config['SPEC_FORMAT'] = 'yaml'

app.security_schemes = {
  'BearerAuth': {
    'type': 'http',
    'scheme': 'bearer',
    'bearerFormat': 'JWT'
  }
}

bpapp = APIBlueprint('website', __name__, enable_openapi=False)

# ------------------------------
# Secrets

app.config.from_pyfile('app_secrets.py')
emails.init(app)

# ------------------------------
# Generic error handlers

@app.errorhandler(404)
def page_not_found(e):
  return error_page(str(e)), 404

@app.errorhandler(Exception)
def handle_exception(e):
  # pass through HTTP exceptions
  if isinstance(e, HTTPException):
    return e
  exc_type, exc_value, exc_traceback = sys.exc_info()
  infos = "<br/>".join(traceback.format_exception(exc_type, exc_value, exc_traceback))

  try:
    id = get_jwt_identity()
    if id is not None:
      claims = get_jwt()
      infos = "user_id: {}<br/>claims: {}<br/><br/>{}".format(id, json.dumps(claims), infos)
  except:
    pass

  try:
    user_agent = request.headers.get('User-Agent')
    infos = "{}<br/><br/>UA: {}".format(infos, user_agent)
  except:
    pass

  if not app.debug:
    # Send detailled infos to dev.
    emails.send_application_exception(infos)
    error = str(e)
  else:
    error = infos
  return error_page(error), 500

def error_page(infos):
  header = render_template('header.html', **lang, is_connected=True)
  return render_template('error.html', rescue_title=lang['rescue_title'],
    infos=infos, theme=settings.default_theme, header=header)

# ------------------------------
# Authent part 2: JWT config

app.config['JWT_TOKEN_LOCATION'] = ['cookies', 'headers']
app.config['JWT_COOKIE_SAMESITE'] = 'Lax'
app.config['JWT_COOKIE_SECURE'] = settings.domain.startswith("https") and not app.debug

app.config['JWT_COOKIE_CSRF_PROTECT'] = True
app.config['JWT_CSRF_CHECK_FORM'] = True
app.config['JWT_CSRF_IN_COOKIES'] = True

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
def expired_token_callback(jwt_header, jwt_payload):
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

from api.auth import AuthBP, LoginAPI, LogoutAPI
app.register_blueprint(AuthBP, url_prefix=settings.api_path+'/auth')

from api.event import EventBP
app.register_blueprint(EventBP, url_prefix=settings.api_path)

from api.registration import RegisterBP
app.register_blueprint(RegisterBP, url_prefix=settings.api_path)

from api.notifications_blocklist import NotificationsBlocklistBP
app.register_blueprint(NotificationsBlocklistBP, url_prefix=settings.api_path)

from api.events import EventsBP
app.register_blueprint(EventsBP, url_prefix=settings.api_path)

from api.user import UserBP
app.register_blueprint(UserBP, url_prefix=settings.api_path)

from api.message import MessageBP
app.register_blueprint(MessageBP, url_prefix=settings.api_path)

from api.messages import MessagesBP
app.register_blueprint(MessagesBP, url_prefix=settings.api_path)

# ------------------------------
# Routes

class RegexConverter(BaseConverter):
  def __init__(self, url_map, *items):
    super(RegexConverter, self).__init__(url_map)
    self.regex = items[0]

app.url_map.converters['regex'] = RegexConverter

# avoid werkzeug extra slash and 308 redirection
app.url_map.strict_slashes = False

@bpapp.route('/')
@bpapp.route('/<regex("[0-9]{4}-[0-9]{2}"):id>')
@jwt_required(optional=True)
def index(id=None):
  """Calendar"""
  return calendar()

@bpapp.route('/event:new')
@bpapp.route('/event:<int:id>')
@bpapp.route('/event:<int:id>:edit')
@jwt_required()
def event(id=None):
  """Event details"""
  return calendar()

def calendar():
  user_id = get_jwt_identity()
  is_connected = user_id is not None
  theme = settings.default_theme
  infos = {}
  if is_connected:
    infos = get_jwt()
    theme = infos['theme']
    infos['id'] = user_id
  header = render_template('header.html', **lang, is_connected=is_connected)
  return render_template('calendar.html', **lang, header=header,
    is_connected=is_connected, userinfos=json.dumps(infos), theme=theme)


@bpapp.route('/swagger-online')
def swag():
  """Redirect to Swagger UI"""
  hostname = request.environ["SERVER_NAME"]
  if app.debug:
    hostname = 'localhost'
  port = request.environ["SERVER_PORT"]
  protocol = request.environ["wsgi.url_scheme"]
  url = "http://petstore.swagger.io/?url={}://{}:{}/openapi.yaml".format(protocol, hostname, port)
  return redirect(url)

#@bpapp.route("/environ")
#def environ():
#  return "{} <br/><br/><br/> {}".format(request.environ, os.environ)

from api.user import UserAPI, post as createUser
api_user = UserAPI()

@bpapp.route('/user:<int:id>')
@jwt_required()
def user(id):
  """User details"""
  res, http_code = api_user.get(id)
  user_item = res.json
  claims = get_jwt()

  phone = user_item.get('phone', '')
  user_item['raw_phone'] = raw_phone(phone)
  user_item['phone_nice'] = nice_phone(phone)
  user_item['phone_whatsapp'] = whatsapp_phone(phone)

  presentation = html.escape(user_item.get('presentation', '')).replace('\n', '<br/>')

  header = render_template('header.html', **lang, is_connected=True)
  return render_template('user.html',
    title=lang['userTitle'], lang=lang['lang'], gotohome=lang['gotohome'],
    user=user_item, theme=claims['theme'], header=header,
    TheWing=lang['TheWing'], presentation=presentation)

@bpapp.route('/users')
@jwt_required()
def users():
  """Users list"""
  claims = get_jwt()
  is_admin = claims['role'] == 'admin'
  users = database.manager.db.list_users_by_score(include_new_and_expired=is_admin)
  if is_admin:
    # Add a border to list admins and new users
    for user in users:
      if user['role']=='admin':
        user['border'] = 'border-danger'
      elif user['role']=='new':
        user['border'] = 'border-info'

  for user in users:
    LoginAPI.test_user_expiration(user)
    if user['role']=='temporary':
      user['expiration_date'] = LoginAPI.get_expiration_datetime(user)

  header = render_template('header.html', **lang, is_connected=True)
  return render_template('users.html',
    title=lang['usersTitle'], lang=lang['lang'], gotohome=lang['gotohome'], usersDescription=lang['usersDescription'],
    users=users, theme=claims['theme'], header=header, is_admin=is_admin,
    approve=lang['APPROVE'], temporary=lang['TEMPORARY_USER'], delete=lang['DELETE'])

@bpapp.route('/login', methods=['GET', 'POST'])
@jwt_required(optional=True)
def login():
  """Login"""
  if request.method == 'POST':
    form = request.form.to_dict()

    if form.get('login') is None or form['login']=='':
      return render_template('login.html', **lang,
        default_theme=settings.default_theme, error=lang['type_email'])

    # Lost password management
    if form.get('lost_password') == '1':
      res = LoginAPI.lost_password(form['login'])
      if res:
        params = {'token': res['token'], 'uid': res['uid']}
        temp_access = '/password?'+urllib.parse.urlencode(params)
        emails.send_lost_password(form['login'], res['name'], temp_access)
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
      response = make_response(redirect('/'))
      set_access_cookies(response, token)
      return response
    else:
      return render_template('login.html', **lang, error=lang['login_error'],
        default_theme=settings.default_theme), 401
  elif get_jwt_identity() is not None:
    # Already connected
    return redirect('/')
  # GET
  return render_template('login.html', **lang,
    default_theme=settings.default_theme)

@bpapp.route('/logout')
@jwt_required(optional=True)
def logout():
  """Logout"""
  LogoutAPI.disconnect(get_jwt())
  response = make_response(render_template('login.html', **lang,
    default_theme=settings.default_theme))
  unset_jwt_cookies(response)
  return response

@bpapp.route('/register', methods=['GET', 'POST'])
@jwt_required(optional=True)
def register():
  """Register an account"""
  if request.method == 'POST':
    httpcode, result, opts = createUser(request.form)
    if httpcode == 201:
      f = request.form
      emails.send_register(f['email'], f['firstname']+' '+f['lastname'], result['id'])
      return render_template('register.html', **lang, message=lang['checkemail'])
    else:
      if httpcode == 409:
        result = lang['alreadyRegistered']
      else:
        result = lang['register_error']
      return render_template('register.html', **lang,
        default_theme=settings.default_theme, error=result), httpcode
  elif get_jwt_identity() is not None:
    # Already connected
    return redirect('/')
  # GET
  return render_template('register.html', **lang,
    default_theme=settings.default_theme)

@bpapp.route('/approve/user:<int:id>', defaults={'role': 'user'})
@bpapp.route('/approve/user:<int:id>/<string:role>')
@jwt_required()
def approve_user(id, role):
  """Approve a user"""
  claims = get_jwt()
  if claims['role'] == 'admin':
    ret = '<br/><a href="/users">{}</a>'.format(lang['usersTitle'])
    desired_role = 'temporary' if role == 'temporary' else 'user'
    user = database.manager.db.get_user(user_id=id)
    previous_role = user['role']
    nb = database.manager.db.update_user_role(id, desired_role, previous_role=previous_role)
    if nb == 1:
      emails.send_approved(user['email'], user['firstname']+' '+user['lastname'], desired_role)
      return "OK"+ret
    return "ALREADY APPROVED"+ret
  return "NOPE", 403

@bpapp.route('/delete/user:<int:id>')
@jwt_required()
def delete_user(id):
  """Remove a registered user"""
  claims = get_jwt()
  if claims['role'] == 'admin':
    res, http_code = api_user.delete(id)
  return redirect('/users')

def allowed_file(filename):
  return '.' in filename and \
    filename.rsplit('.', 1)[1].lower() in settings.uploads_allowed_extensions

@bpapp.route('/settings', methods=['GET', 'POST'])
@jwt_required()
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
    form['has_whatsapp'] = False if form.get('has_whatsapp') is None else True
    form['notif_new_event'] = False if form.get('notif_new_event') is None else True
    form['notif_event_change'] = False if form.get('notif_event_change') is None else True
    form['notif_tomorrow_events'] = False if form.get('notif_tomorrow_events') is None else True

    # Remove extra fields that would break .put()
    del form['csrf_token']
    del form['remove_avatar']

    res, httpcode = api_user.put_internal(id, form)
    if httpcode == 200:
      message = lang['saved']

      # Regenerate new token so that new infos are stored in claims
      claims = get_jwt()
      claims['id'] = id
      claims['firstname'] = form['firstname']
      claims['lastname'] = form['lastname']
      claims['theme'] = form['theme']
      claims['notif_event_change'] = int(form['notif_event_change'])

      # message is lost... but we have to redirect for csrf_token variable
      return regenerate_claims(claims, '/settings')
    else:
      #print(res)
      error = lang['saved_error']

  header = render_template('header.html', **lang,
    is_connected=id is not None)

  #user_item = api_user.get(id) # can't get theme
  user_item = database.manager.db.get_user(user_id=id)

  themes = settings.themes.copy()
  if user_item['theme'] != settings.default_theme:
    themes[settings.default_theme] += ' ('+lang['default']+')'

  csrf_token = get_jwt().get("csrf")
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

@bpapp.route('/password', methods=['GET', 'POST'])
@jwt_required(optional=True)
def change_password():
  """Change password"""

  id = get_jwt_identity()
  if id is not None:
    claims = get_jwt()
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

  csrf_token = get_jwt().get("csrf")
  return render_template('user_password.html', **lang, header=header,
    csrf_token=csrf_token, theme=theme,
    message=message, error=error, is_connected=is_connected)

@bpapp.route('/avatars/<string:name>')
@jwt_required()
def avatar(name):
  """Get avatar"""
  parts = name.split('-')
  user_id = secure_filename(parts[0])
  size = secure_filename(parts[-1])
  path = settings.avatars_folder+'/'+user_id+'-%s.png'%size
  if not os.path.exists(path):
    path = settings.avatars_folder+'/default-%s.png'%size
    return redirect('../static/img/default-%s.png'%size)
  return send_file(path)

miniatures_sizes = [130, 60, 40]

def generate_miniatures(path, user_id):
  user_id = str(user_id)
  for size in miniatures_sizes:
    dest_path = settings.avatars_folder+'/'+user_id+'-'+str(size)+'.png'
    resize_image(path, dest_path, format='png', width=size, height=size, enlarge=True)

def remove_miniatures(user_id):
  user_id = str(user_id)
  for size in miniatures_sizes:
    dest_path = settings.avatars_folder+'/'+user_id+'-'+str(size)+'.png'
    try:
      os.remove(dest_path)
    except:
      pass

# Ensure folders we are writting into exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(settings.avatars_folder, exist_ok=True)
os.makedirs(settings.backgrounds_folder, exist_ok=True)

# List known backgrounds
available_backgrounds = []
for filename in os.listdir('uploads/backgrounds'):
  filenameL = filename.lower()
  if filenameL.endswith(".jpg") or filenameL.endswith(".jpeg"):
    filepath = 'uploads/backgrounds/' + filename
    available_backgrounds.append(filepath)

@bpapp.route('/background/<int:width>x<int:height>')
def background(width, height):
  """Get proper size background"""
  rand = random.randint(0, len(available_backgrounds) - 1)
  background = available_backgrounds[rand]
  return get_image_resized(background, width, height)

@bpapp.route('/background/rescue/<int:width>x<int:height>')
def rescue_background(width, height):
  background = 'static/img/rescue.jpg'
  return get_image_resized(background, width, height)

def get_image_resized(background, width, height):
  # Simple protection
  if width > 5000 or height > 5000:
    return "TOO BIG", 403

  if width == 0 or height == 0:
    return "INVALID DIMENSIONS", 400

  filename = os.path.basename(background)
  filename_without_extension, extension = os.path.splitext(filename)

  target = filename_without_extension+'-'+str(width)+'x'+str(height)+extension
  dest_path = settings.backgrounds_folder+'/'+target

  if not os.path.exists(dest_path):
    resize_image(background, dest_path, format='jpg', quality=75,
      width=width, height=height, enlarge=True, mode='crop')

  return send_file(dest_path)

@bpapp.route('/tomorrow_events')
def tomorrow_events():
  token = request.args.get('token')
  if token == app.config['DAILY_CHECK']:
    emails.send_tomorrow_events()
    return "OK", 200
  return "UNAUTHORIZED", 401

# @app.route('/test_email')
# @jwt_required()
# def test_email():
#   emails.test_email()
#   return "OK", 200

# @app.route('/exception')
# def test_exception():
#   #raise Exception('fake exception')
#   resize_image("test.jpg", settings.backgrounds_folder+'/test.jpg', format='jpg', quality=75,
#       width=1400, height=800, enlarge=True, mode='crop')
#   return "OK", 200

@bpapp.route('/ics')
@jwt_required()
def generate_ics():
  event_id = request.args.get('event')
  event = database.manager.db.get_event(event_id=event_id)
  if event is None:
    return "Invalid event", 404

  c = ics.Calendar()
  e = ics.Event()

  e.name = event['title']
  e.begin = str(event['start_date'])
  url = settings.domain+'/event:'+str(event['id'])
  e.url = url
  e.description = markdown.markdown(url+"\n\n"+(event['description'] or ''))

  if str(event['end_date']) == str(event['start_date']):
    e.make_all_day()
  else:
    e.end = str(event['end_date'])

  if event['gps_location']:
    e.location = event['gps_location']
  elif event['gps']:
    e.location = event['gps']
  elif event['location']:
    e.location = event['location']

  e.created = datetime.datetime.now()  # field required for Android!!
  c.events.add(e)

  response = make_response(str(c), 200)
  response.headers['Content-Type'] = 'text/calendar'
  response.headers['Content-Disposition'] = f'attachment; filename="event_{event_id}.ics"'
  return response, 200


# ------------------------------
app.register_blueprint(bpapp)

if __name__ == '__main__':
  # local development
  app.run(debug=True, host='0.0.0.0', port=os.environ.get("HTTP_PLATFORM_PORT"))
