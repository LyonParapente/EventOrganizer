from flask import request
from flask_restful_swagger_3 import Resource, swagger
from flask_restful.reqparse import RequestParser
from api.parser import add_event_args
from api.EventItem import EventItem
from database import db

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

def declare_create_event(api, api_path):
  api.add_resource(EventAPICreate, api_path+'/event')
