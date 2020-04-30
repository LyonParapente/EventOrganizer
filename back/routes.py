import os
import json
from flask import redirect, request, render_template, make_response, send_file
from flask_jwt_extended import jwt_required, jwt_optional, get_jwt_identity, get_jwt_claims
from flask_jwt_extended import unset_jwt_cookies, set_access_cookies, get_raw_jwt
from werkzeug.routing import BaseConverter
from werkzeug.utils import secure_filename
from trads import fr, en

from api.user import UserAPICreate, UserAPI
from api.auth import LoginAPI, LogoutAPI
from avatar_helper import generate_miniatures,remove_miniatures,randomString
import settings
import database.manager
from __main__ import app

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
    code, result = UserAPICreate.from_dict(request.form.to_dict())
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
      message = fr['saved']

      # Regenerate new token so that new infos are stored in claims
      claims = get_jwt_claims()
      claims['id'] = id
      claims['firstname'] = form['firstname']
      claims['lastname'] = form['lastname']
      claims['theme'] = form['theme']

      # message is lost... but we have to redirect for csrf_token variable
      return regenerate_claims(claims, '/settings')
    else:
      error = fr['saved_error']

  #user_item = api_user.get(id) # can't get theme
  user_item = database.manager.db.get_user(user_id=id)
  csrf_token = get_raw_jwt().get("csrf")
  return render_template('user_settings.html', **fr,
    user=user_item, themes=settings.themes, csrf_token=csrf_token,
    message=message, error=error, user_id=id, random=randomString())

def regenerate_claims(claims, dest):
  # Note: this destroys remember me...
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

@app.route('/avatars/<string:name>')
@jwt_required
def avatar(name):
  """Get avatar"""
  parts = name.split('-')
  user_id = secure_filename(parts[0])
  suffix = secure_filename(parts[-1])
  path = settings.avatars_folder+'/'+user_id+'-%s.jpg'%suffix
  if not os.path.exists(path):
    path = settings.avatars_folder+'/default-%s.png'%suffix
  return send_file(path)

