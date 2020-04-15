from flask import request, abort
from flask_restful_swagger_3 import Resource, swagger
from models.event import Event, filter_event_response
from database.manager import db

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
