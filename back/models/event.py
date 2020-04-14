from flask_restful.reqparse import RequestParser
from flask_restful_swagger_3 import Schema, swagger_type
from flask_restful import inputs

@swagger_type('string')
def convert_string_to_date_object(p):
  return inputs.date(p)

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
    'creator_id': {'type': 'integer', 'example': 101},
    'creation_datetime': {'type': 'string', 'format': 'datetime', 'readOnly': True, 'example': '2020-04-13 16:30:04'}
  }
  required = ['title', 'start_date']
  always_filtered = []

def get_event_parser():
  parser = RequestParser()
  parser.add_argument('title', type=str, required=True, location='json',
                      help='Missing title')
  parser.add_argument('start_date', type=convert_string_to_date_object, required=True, location='json',
                      help='Use Date format')
  parser.add_argument('end_date', type=convert_string_to_date_object, required=False, location='json',
                      help='Use Date format')
  parser.add_argument('time', type=str, location='json')
  parser.add_argument('description', type=str, location='json')
  parser.add_argument('location', type=str, location='json')
  parser.add_argument('gps', type=str, location='json')
  parser.add_argument('gps_location', type=str, location='json')
  parser.add_argument('category', type=str, location='json')
  parser.add_argument('color', type=str, location='json')
  # creator_id declared to avoid error when "Create an event" with suggested json
  # we overwrite the value in create anyway, and it's not used in update
  parser.add_argument('creator_id', type=str, location='json')
  return parser
