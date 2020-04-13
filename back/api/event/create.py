from flask import request
from flask_restful_swagger_3 import Resource, swagger
from models.event import Event, get_event_parser
from database.manager import db

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
  post_parser = get_event_parser()

  @swagger.doc({
    'tags': ['event'],
    'description': 'Create an event',
    'requestBody': {
      'required': True,
      'content': {
        'application/json': {
          'schema': Event
        }
      }
    },
    'responses': {
      '201': {
        'description': 'Created event',
        'content': {
          'application/json': {
            'schema': Event
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

    args['creator_id'] = creating_user['id']
    event = db.insert_event(**args)
    del event['creator_id']

    event['start_date'] = str(event['start_date'])
    if event['end_date']:
      event['end_date'] = str(event['end_date'])

    streamlined_event = {k: v for k, v in event.items() if v is not None}
    return Event(**streamlined_event)
