from apiflask import APIBlueprint
from flask_jwt_extended import get_jwt_identity, jwt_required
from models.event import EventsQuery, Event
from database.manager import db

EventsBP = APIBlueprint('Events', __name__)

@EventsBP.get('/events')
@jwt_required(optional=True)
@EventsBP.input(EventsQuery, location='query')
@EventsBP.output(Event(many=True), description='List of events')
def getEvents(query_data):
  """Download a list of events (in a date range)"""
  start = query_data.get('start')
  end = query_data.get('end')
  events_list = db.get_events_list(start, end)

  is_connected = get_jwt_identity() is not None

  for i in range(len(events_list)):
    event = events_list[i]
    streamlined_event = {k: v for k, v in event.items() if v is not None}

    if not is_connected:
      if streamlined_event.get('whatsapp_link'):
        del streamlined_event['whatsapp_link']
      if streamlined_event.get('description'):
        del streamlined_event['description']

    events_list[i] = streamlined_event

  return events_list
