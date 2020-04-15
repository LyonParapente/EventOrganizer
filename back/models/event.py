from flask_restful_swagger_3 import Schema

class Event(Schema):
  type = 'object'
  properties = {
    'id': {'type': 'integer', 'readOnly': True, 'example': 101},
    'title': {'type': 'string', 'example': 'My event title'},
    'start_date': {'type': 'string', 'format': 'date', 'example': '2020-04-16'},
    'end_date': {'type': 'string', 'format': 'date', 'example': '2020-04-17'},
    'time': {'type': 'string', 'example': '16h'},
    'description': {'type': 'string', 'example': 'Welcome to this event'},
    'location': {'type': 'string', 'example': 'Annecy'},
    'gps': {'type': 'string', 'example': '45.721892, 4.919573'},
    'gps_location': {'type': 'string', 'example': 'La Halle Mode & Chaussures | Bron'},
    'category': {'type': 'string', 'example': 'conference'},
    'color': {'type': 'string', 'example': '#662C67'},
    'creator_id': {'type': 'integer', 'example': 101, 'readOnly': True},
    'creation_datetime': {'type': 'string', 'format': 'date-time', 'readOnly': True, 'example': '2020-04-13 16:30:04'}
  }
  required = ['title', 'start_date']
  always_filtered = []

def filter_event_response(props):
  # Always remove writeOnly fields for output
  for field in Event.properties:
    if Event.properties[field].get('writeOnly') is True:
      props[field] = None

  streamlined_event = {k: v for k, v in props.items() if v is not None}
  return streamlined_event