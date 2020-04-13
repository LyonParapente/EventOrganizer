from flask import abort
from flask_restful_swagger_3 import Resource, swagger
from models.event import Event, get_event_parser
from database.manager import db

def _convert_to_datetime(text):
  try:
    date = datetime.datetime.strptime(text, "%Y-%m-%d %H:%M:%S")
  except:
    date = None
  return date

class EventAPI(Resource):
  update_parser = get_event_parser()

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
    event = db.get_event(event_id)
    if type(event) is not dict:
      abort(404)
    # TODO: maybe do a conversion and back conversion to get proper format transmitted
    #event["start_date"] = _convert_to_datetime(event["start_date"])
    #event["end_date"] = _convert_to_datetime(event["end_date"])
    # Remove private keys
    del event["creator_id"]
    streamlined_event = {k: v for k, v in event.items() if v is not None}
    return Event(**streamlined_event)


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
          'schema': Event
        }
      }
    },

    'responses': {
      '201': {
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
    return Event(**streamlined_event)

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
      },
      '404': {
        'description': 'Event not found'
      }
    }
  })
  def delete(self, event_id):
    """Delete an event entry"""
    # TODO: Check that the event author is the user requesting the deletion. Shall we delete or set CANCELLED status?
    rowcount = db.delete_event(event_id)
    if rowcount < 1:
      abort(404)
    return 'Event deleted', 200
