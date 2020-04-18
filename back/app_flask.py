import os
from flask import Flask, redirect, request
from flask_restful_swagger_3 import Api
from flask_cors import CORS

# ------------------------------
# Database initialization

import settings
import database.manager
database.manager.init(settings.db_filepath)

# ------------------------------
# Flask initialization

app = Flask(__name__)
CORS(app)
api = Api(app, version=settings.version)

# ------------------------------
# API

from api.event import EventAPICreate, EventAPI
api.add_resource(EventAPICreate, settings.api_path+'/event')
api.add_resource(EventAPI,       settings.api_path+'/event/<int:event_id>')

from api.events import EventsAPI
api.add_resource(EventsAPI,      settings.api_path+'/events')

from api.user import UserAPICreate, UserAPI
api.add_resource(UserAPICreate, settings.api_path+'/user')
api.add_resource(UserAPI,       settings.api_path+'/user/<int:user_id>')

from api.message import MessageAPICreate
api.add_resource(MessageAPICreate, settings.api_path+'/message')

from api.messages import MessagesAPI
api.add_resource(MessagesAPI,      settings.api_path+'/messages')

# ------------------------------
# Routes

@app.route('/')
def index():
  return 'Hello!<br/><a href="/swagger">Swagger</a><br/><a href="/static/calendar.html">Calendar</a>'

@app.route('/swagger')
def swag():
  hostname = request.environ["SERVER_NAME"]
  port = request.environ["SERVER_PORT"]
  protocol = request.environ["wsgi.url_scheme"]
  url = "http://petstore.swagger.io/?url={}://{}:{}/api/swagger.json".format(protocol, hostname, port)
  return redirect(url)

#@app.route("/environ")
#def environ():
#  return "{} <br/><br/><br/> {}".format(request.environ, os.environ)

# ------------------------------

if __name__ == '__main__':
  # local development
  app.run(debug=True, host='0.0.0.0', port=os.environ.get("HTTP_PLATFORM_PORT"))
