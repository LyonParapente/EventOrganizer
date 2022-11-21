from flask_restful import Resource
from flask_jwt_extended import get_jwt_identity, jwt_required
from models.event import Event
from database.manager import db

class EventsAPI(Resource):
  @jwt_required(optional=True)
  # @swagger.doc({
  #   'tags': ['events'],
  #   # auth. optional, get more info though (description, whatsapp_link)
  #   #'security': [
  #   #  {'BearerAuth': []}
  #   #],
  #   'parameters': [
  #     {
  #       'name': 'start',
  #       'description': 'Start date of the interval being fetched',
  #       'in': 'query',
  #       'required': False,
  #       'schema': {
  #         'type': 'string' # to be compatible with https://fullcalendar.io/docs/events-json-feed
  #       }
  #     },
  #     {
  #       'name': 'end',
  #       'description': 'Exclusive end date of the interval being fetched',
  #       'in': 'query',
  #       'required': False,
  #       'schema': {
  #         'type': 'string' # to be compatible with https://fullcalendar.io/docs/events-json-feed
  #       }
  #     }
  #   ],
  #   'responses': {
  #     '200': {
  #       'description': 'List of events',
  #       'content': {
  #         'application/json': {
  #           'schema': Event.array()
  #         }
  #       }
  #     }
  #   }
  # })
  def get(self, _parser):
    """Download a list of events (in a date range)"""
    query = _parser.parse_args(strict=True)
    events_list = db.get_events_list(query["start"], query["end"])

    user_id = get_jwt_identity()
    is_connected = user_id is not None

    for i in range(len(events_list)):
      event = events_list[i]
      streamlined_event = {k: v for k, v in event.items() if v is not None}
      if not is_connected:
        if streamlined_event.get('whatsapp_link'):
          del streamlined_event['whatsapp_link']
        if streamlined_event.get('description'):
          del streamlined_event['description']
      events_list[i] = Event(**streamlined_event)

    return events_list
