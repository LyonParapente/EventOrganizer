import os
from flask import Flask, redirect, request, render_template, make_response, jsonify
from flask_restful_swagger_3 import Api, swagger
from flask_jwt_extended import JWTManager, jwt_required, jwt_optional, get_jwt_identity
from flask_jwt_extended import unset_jwt_cookies, set_access_cookies, get_raw_jwt
from flask_cors import CORS
from werkzeug.routing import BaseConverter
from trads import fr, en

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
app.config.from_pyfile('secrets.py')

jwt = JWTManager(app)

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
  is_connected = get_jwt_identity() is not None
  return render_template('calendar.html',
    title='Calendrier', lang='fr', is_connected=is_connected)


@app.route('/event:new')
@app.route('/event:<int:id>')
@jwt_required
def event(id=None):
  """Event details"""
  return render_template('calendar.html',
    title='Calendrier', lang='fr')

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
    title='Utilisateur', lang='fr',
    user=user_item)


@app.route('/login', methods=['GET', 'POST'])
@jwt_optional
def login():
  """Login"""
  if request.method == 'POST':
    form = request.form.to_dict()
    token = LoginAPI.authenticate(form['login'], form['password'])
    if token is not None:
      response = make_response(redirect('/planning'))
      set_access_cookies(response, token)
      return response
    else:
      error = fr['login_error']
      return render_template('login.html', **fr, error=error), 401
  elif get_jwt_identity() is not None:
    # Already connected
    return redirect('/planning')
  return render_template('login.html', **fr)

@app.route('/logout')
def logout():
  """Logout"""
  LogoutAPI.disconnect(get_raw_jwt())
  response = make_response(render_template('login.html', **fr))
  unset_jwt_cookies(response)
  return response

@app.route('/register')
def register():
  """Register an account"""
  #print(bcrypt.generate_password_hash(form['password']).decode())
  return render_template('register.html',
    title='Register')

# ------------------------------

if __name__ == '__main__':
  # local development
  app.run(debug=True, host='0.0.0.0', port=os.environ.get("HTTP_PLATFORM_PORT"))
