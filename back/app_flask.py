from flask import Flask, abort, redirect, request
from flask_restful import reqparse, inputs
from flask_restful.reqparse import RequestParser
import argparse
import sys
import os
from flask_restful_swagger_3 import swagger, Api, Schema, Resource, swagger_type
from flask_cors import CORS
from pathlib import Path

from db_if import *

version = '1.0'

app = Flask(__name__)
CORS(app)
api = Api(app, version=version)

api_path = '/api/v'+version


users = [
  {
    'id': 1,
    'login': 'laurel',
    'pseudo': 'The Clumsy'
  },
  {
    'id': 2,
    'login': 'hardy',
    'pseudo': 'The Bully'
  }
]


class EventItem(Schema):
  type = 'object'
  properties = {
    'id': {'type': 'integer', 'readOnly': True},
    'title': {'type': 'string', 'example': 'sample title'},
    'start_date': {
      'type': 'string',
      'format': 'date'
    },
    'end_date': {
      'type': 'string',
      'format': 'date'
    },
    'time': {'type': 'string', 'example': '16h'},
    'description': {'type': 'string', 'example': 'welcome to this event'},
    'location': {'type': 'string', 'example': 'Annecy'},
    'gps': {'type': 'string', 'example': '45.721892, 4.919573'},
    'gps_location': {'type': 'string', 'example': 'La Halle Mode & Chaussures | Bron'},
    'category': {'type': 'string', 'example': 'conference'},
    'color': {'type': 'string', 'example': '#662C67'},
    'creation_datetime': {'type': 'string', 'format': 'datetime', 'readOnly': True}
  }
  required = ['title', 'start_date']

class EventItemList(Schema):
  type = 'array'
  items = EventItem

def _convert_to_datetime(text):
  try:
    date = datetime.datetime.strptime(text, "%Y-%m-%d %H:%M:%S")
  except:
    date = None
  return date


@swagger_type('string')
def convert_string_to_date_object(p):
  return inputs.date(p)


def add_event_args(parser):
  parser.add_argument('title', type=str, required=True, location='json',
                      help='Missing title')
  parser.add_argument('start_date', type=convert_string_to_date_object, required=True, location='json',
                      help='Use Date format')
  parser.add_argument('end_date', type=convert_string_to_date_object, required=False, location='json',
                      help='Use Date format') # Can be missing after parsing
  parser.add_argument('time', type=str, location='json')
  parser.add_argument('description', type=str, location='json')
  parser.add_argument('location', type=str, location='json')
  parser.add_argument('gps', type=str, location='json')
  parser.add_argument('gps_location', type=str, location='json')
  parser.add_argument('category', type=str, location='json')
  parser.add_argument('color', type=str, location='json')


class EventListAPI(Resource):
  @swagger.doc({
    'tags': ['events'],
    'description': 'Download a list of events (in a date range)',
    'parameters': [
      {
        'name': 'start',
        'description': 'Start date of the interval being fetched',
        'in': 'query',
        'required': False,
        'schema': {
          'type': 'string' # to be compatible with https://fullcalendar.io/docs/events-json-feed
        }
      },
      {
        'name': 'end',
        'description': 'Exclusive end date of the interval being fetched',
        'in': 'query',
        'required': False,
        'schema': {
          'type': 'string' # to be compatible with https://fullcalendar.io/docs/events-json-feed
        }
      }
    ],
    'responses': {
      '200': {
        'description': 'List of events',
        'content': {
          'application/json': {
            'schema': EventItemList
          }
        }
      }
    }
  })
  def get(self, _parser):
    """Download a list of events (in a date range)"""
    query = _parser.parse_args(strict=True)
    event_list = db.get_event_list(query["start"], query["end"])
    if type(event_list) is not list:
      abort(404)
    return event_list

api.add_resource(EventListAPI, api_path+'/events', endpoint='events')


class EventAPICreate(Resource):
  post_parser = RequestParser()
  add_event_args(post_parser)

  @swagger.doc({
    'tags': ['event'],
    'description': 'Create an event',
    'requestBody': {
      'required': True,
      'content': {
        'application/json': {
          'schema': EventItem
        }
      }
    },
    'responses': {
      '201': {
        'description': 'Created event',
        'content': {
          'application/json': {
            'schema': EventItem
          }
        }
      }
    }
  })
  def post(self):
    """Create an event"""
    args = self.post_parser.parse_args(strict=True)
    creating_user = None
    if request.authorization is not None:
      creating_user = request.authorization.get("username")
      for user in users:
        if user['login'] == creating_user:
          creating_user = user
          break
      # If the request is authenticated the user does exist
    # Checking the type of creating_user covers both the case of anonymous request and authorized user not find
    if type(creating_user) is not dict:
      creating_user = {'id': 101}

    event = {
      'title': args['title'],
      'start_date': args['start_date'],
      'end_date': args.get('end_date'),  # When None means = start_date (full day event)
      'time': args.get('time'),
      'description': args.get('description'),
      'location': args.get('location'),
      'gps': args.get('gps'),
      'gps_location': args.get('gps_location'),
      'category': args.get('category'),
      'color': args.get('color'),
      'creator_id': creating_user['id'],
    }
    event['id'] = db.insert_event(**event)
    del event['creator_id']
    event['start_date'] = str(event['start_date'])
    if event['end_date']:
      event['end_date'] = str(event['end_date'])
    streamlined_event = {k: v for k, v in event.items() if v is not None}
    return EventItem(**streamlined_event)

api.add_resource(EventAPICreate, api_path+'/event')


class EventAPI(Resource):
  update_parser = RequestParser()
  add_event_args(update_parser)

  @swagger.doc({
    'tags': ['event'],
    'description': 'Returns an event',
    'parameters': [
      {
        'name': 'event_id',
        'required': True,
        'description': 'Event identifier',
        'in': 'path',
        'schema': {
          'type': 'integer'
        }
      }
    ],
    'responses': {
      '200': {
        'description': 'Event',
        'content': {
          'application/json': {
            'schema': EventItem
           }
        }
      },
      '404': {
        'description': 'Event not found'
      }
    }
  })
  def get(self, event_id):
    """Get details of an event"""
    event = db.get_event(event_id)
    if type(event) is not dict:
      abort(404)
    # TODO: maybe do a conversion and back conversion to get proper format transmitted
    #event["start_date"] = _convert_to_datetime(event["start_date"])
    #event["end_date"] = _convert_to_datetime(event["end_date"])
    # Remove private keys
    del event["creator_id"]
    streamlined_event = {k: v for k, v in event.items() if v is not None}
    return EventItem(**streamlined_event)


  @swagger.doc({
    'tags': ['event'],
    'description': 'Update an event',
    'parameters': [
      {
        'name': 'event_id',
        'required': True,
        'description': 'Event identifier',
        'in': 'path',
        'schema': {
          'type': 'integer'
        }
      }
    ],
    'requestBody': {
      'description': 'Data to update an event',
      'required': True,
      'content': {
        'application/json': {
          'schema': EventItem
        }
      }
    },

    'responses': {
      '201': {
        'description': 'Updated event',
        'content': {
          'application/json': {
            'schema': EventItem
          }
        }
      },
      '404': {
        'description': 'Event not found'
      }
    }
  })
  def put(self, event_id):
    """Update an event entry"""
    # TODO: Check that the user requesting the update is the author of the event
    # Use strict for security and prevent request from overriding non writeable keys (like creator...)
    args = self.update_parser.parse_args(strict=True)
    db.update_event(event_id, **args)

    # Retrieve updated event
    updated_event = db.get_event(event_id)
    if type(updated_event) is not dict:
      abort(404)
    #updated_event["start_date"] = _convert_to_datetime(updated_event["start_date"])
    #updated_event["end_date"] = _convert_to_datetime(updated_event["end_date"])

    # Remove private keys
    del updated_event["creator_id"]
    streamlined_event = {k: v for k, v in updated_event.items() if v is not None}
    return EventItem(**streamlined_event)

  @swagger.doc({
    'tags': ['event'],
    'description': 'Deletes an event',
    'parameters': [
      {
        'name': 'event_id',
        'required': True,
        'description': 'Event identifier',
        'in': 'path',
        'schema': {
          'type': 'integer'
        }
      }
    ],
    'responses': {
      '200': {
        'description': 'Event',
        'content': {
          'text/plain': {
            'type': 'string'
          }
        }
      }
    }
  })
  def delete(self, event_id):
    """Delete an event entry"""
    # TODO: Check that the event author is the user requesting the deletion. Shall we delete or set CANCELLED status?
    db.delete_event(event_id)
    return 'Event deleted', 200


api.add_resource(EventAPI, api_path+'/event/<int:event_id>', endpoint='event')


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





# Instantiate database
db_filepath = str(Path('./events.db'))
db = EventsDb(db_filepath)

if __name__ == '__main__':
  # local development
  app.run(debug=True, port=os.environ.get("HTTP_PLATFORM_PORT"))
