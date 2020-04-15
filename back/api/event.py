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


class EventAPI(Resource):
  @swagger.doc({
    'tags': ['event'],
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
            'schema': Event
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
    props = db.get_event(event_id)
    if type(props) is not dict:
      abort(404, 'Event not found')
    return Event(**filter_event_response(props))


  @swagger.doc({
    'tags': ['event'],
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
      'required': True,
      'content': {
        'application/json': {
          'schema': Event
        }
      }
    },

    'responses': {
      '200': {
        'description': 'Updated event',
        'content': {
          'application/json': {
            'schema': Event
          }
        }
      },
      '404': {
        'description': 'Event not found'
      }
    }
  })
  def put(self, event_id):
    """Update an event"""

    if request.json.get('creator_id'):
      abort(400, 'Cannot change the creator of an event')

    #TODO: cannot modify an event if its in the past

    try:
      db.update_event(event_id, **request.json)
    except TypeError as e:
      return abort(400, e.args[0])

    # Retrieve updated event with filtered properties
    return self.get(event_id)


  @swagger.doc({
    'tags': ['event'],
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
        'description': 'Confirmation message',
      },
      '404': {
        'description': 'Event not found'
      }
    }
  })
  def delete(self, event_id):
    """Delete an event"""
    # TODO: Foreign keys: shall we delete or set CANCELLED status?
    rowcount = db.delete_event(event_id)
    if rowcount < 1:
      abort(404, 'No event was deleted')
    return {'message': 'Event deleted'}, 200
