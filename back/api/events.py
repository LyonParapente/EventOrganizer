from apiflask import APIBlueprint
from flask_jwt_extended import get_jwt_identity, jwt_required
from models.event import EventsQuery, Event
from database.manager import db

EventsBP = APIBlueprint('Events', __name__)

@EventsBP.get('/events')
@jwt_required(optional=True)
@EventsBP.input(EventsQuery, location='query')
@EventsBP.output(Event(many=True), description='List of events')
def getEvents(query):
  """Download a list of events (in a date range)"""
  start = query.get('start')
  end = query.get('end')
  events_list = db.get_events_list(start, end)

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

    events_list[i] = streamlined_event

  return events_list
