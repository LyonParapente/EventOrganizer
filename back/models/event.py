from flask_restful_swagger_3 import Schema

class Event(Schema):
  type = 'object'
  properties = {
    'id': {'type': 'integer', 'readOnly': True},
    'title': {'type': 'string', 'example': 'sample title'},
    'start_date': {
      'type': 'string',
      'format': 'date'
    },
    'end_date': {
      'type': 'string',
      'format': 'date'
    },
    'time': {'type': 'string', 'example': '16h'},
    'description': {'type': 'string', 'example': 'welcome to this event'},
    'location': {'type': 'string', 'example': 'Annecy'},
    'gps': {'type': 'string', 'example': '45.721892, 4.919573'},
    'gps_location': {'type': 'string', 'example': 'La Halle Mode & Chaussures | Bron'},
    'category': {'type': 'string', 'example': 'conference'},
    'color': {'type': 'string', 'example': '#662C67'},
    'creation_datetime': {'type': 'string', 'format': 'datetime', 'readOnly': True}
  }
  required = ['title', 'start_date']

class EventList(Schema):
  type = 'array'
  items = Event
