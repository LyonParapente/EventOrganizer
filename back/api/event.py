from flask import request, abort
from flask_restful_swagger_3 import Resource, swagger
from flask_jwt_extended import jwt_required
from models.event import Event, validate_event, filter_event_response
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
  @jwt_required
  @swagger.doc({
    'tags': ['event'],
    'security': [
      {'BearerAuth': []}
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
      '201': {
        'description': 'Created event',
        'content': {
          'application/json': {
            'schema': Event
          }
        }
      },
      '401': {
        'description': 'Not authenticated'
      }
    }
  })
  def post(self):
    """Create an event"""
    # Validate request body with schema model
    event = validate_event(request.json, create=True)

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

    #TODO: forbid to create event in the past

    event['creator_id'] = creating_user['id']
    try:
      props = db.insert_event(**event)
    except Exception as e:
      abort(500, e.args[0])

    props['start_date'] = str(props['start_date'])
    if props['end_date']:
      props['end_date'] = str(props['end_date'])

    new_event = Event(**filter_event_response(props))

    # The creator of an event is immediately registered as participant
    try:
      db.set_registration(
        event_id=new_event['id'],
        user_id=new_event['creator_id'],
        interest=2
      )
    except Exception as e:
      #not a big deal, let's continue
      pass

    return new_event, 201, {'Location': request.path + '/' + str(props['id'])}

class EventAPI(Resource):
  @jwt_required
  @swagger.doc({
    'tags': ['event'],
    'security': [
      {'BearerAuth': []}
    ],
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
      '401': {
        'description': 'Not authenticated'
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


  @jwt_required
  @swagger.doc({
    'tags': ['event'],
    'security': [
      {'BearerAuth': []}
    ],
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
      '401': {
        'description': 'Not authenticated'
      },
      '404': {
        'description': 'Event not found'
      }
    }
  })
  def put(self, event_id):
    """Update an event"""
    # Validate request body with schema model
    event = validate_event(request.json, update=True)

    #TODO: cannot modify an event if its in the past
    #db_event = self.get(event_id)
    #if something:
    #  abort(400, 'Cannot modify a past event')

    #TODO: only creator of an event can edit it

    try:
      db.update_event(event_id, **request.json)
    except Exception as e:
      abort(500, e.args[0])

    # Retrieve updated event with filtered properties
    return self.get(event_id)


  @jwt_required
  @swagger.doc({
    'tags': ['event'],
    'security': [
      {'BearerAuth': []}
    ],
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
      '401': {
        'description': 'Not authenticated'
      },
      '404': {
        'description': 'Event not found'
      }
    }
  })
  def delete(self, event_id):
    """Delete an event"""
    # TODO: only author of an event can delete it, and only if not yet finished
    # TODO: Foreign keys: shall we delete or set CANCELLED status?
    rowcount = db.delete_event(event_id)
    if rowcount < 1:
      abort(404, 'No event was deleted')
    return {'message': 'Event deleted'}, 200
