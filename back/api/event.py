from flask import request, abort
from flask_restful_swagger_3 import Resource, swagger
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.event import Event, validate_event, filter_event_response
from database.manager import db

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

    #TODO: forbid to create event in the past

    event['creator_id'] = get_jwt_identity()
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

    db_event = self.get(event_id)

    #TODO: cannot modify an event if its in the past
    #if something:
    #  abort(400, 'Cannot modify a past event')

    if db_event['creator_id'] != get_jwt_identity():
      abort(403, "You cannot update someone else event")

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

    db_event = self.get(event_id)
    if db_event['creator_id'] != get_jwt_identity():
      abort(403, "You cannot delete someone else event")

    # TODO: cannot delete if finished
    # TODO: Foreign keys (messages & registration) need cascade delete
    rowcount = db.delete_event(event_id)
    if rowcount < 1:
      abort(404, 'No event was deleted')
    return {'message': 'Event deleted'}, 200
