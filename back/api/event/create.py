from flask import request, abort
from flask_restful_swagger_3 import Resource, swagger
from models.event import Event, filter_event_response
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
  @swagger.doc({
    'tags': ['event'],
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
    try:
      # Validate request body with schema model
      event = Event(**request.json)
    except ValueError as e:
      return abort(400, e.args[0])

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

    event['creator_id'] = creating_user['id']
    props = db.insert_event(**event)

    props['start_date'] = str(props['start_date'])
    if props['end_date']:
      props['end_date'] = str(props['end_date'])

    return Event(**filter_event_response(props)), 201, {'Location': request.path + '/' + str(props['id'])}
