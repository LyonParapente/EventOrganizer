from flask_restful_swagger_3 import Resource, swagger
from models.event import Event, EventList
from database import db

class EventsAPI(Resource):
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
            'schema': EventList
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
