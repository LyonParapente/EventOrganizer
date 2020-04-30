import os
from flask import Flask, redirect, request, make_response
from flask_restful_swagger_3 import Api
from flask_jwt_extended import JWTManager
from flask_cors import CORS

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

import routes

# ------------------------------

if __name__ == '__main__':
  # local development
  app.run(debug=True, host='0.0.0.0', port=os.environ.get("HTTP_PLATFORM_PORT"))
