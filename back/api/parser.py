from flask_restful_swagger_3 import swagger_type
from flask_restful import inputs

def _convert_to_datetime(text):
  try:
    date = datetime.datetime.strptime(text, "%Y-%m-%d %H:%M:%S")
  except:
    date = None
  return date


@swagger_type('string')
def convert_string_to_date_object(p):
  return inputs.date(p)


def add_event_args(parser):
  parser.add_argument('title', type=str, required=True, location='json',
                      help='Missing title')
  parser.add_argument('start_date', type=convert_string_to_date_object, required=True, location='json',
                      help='Use Date format')
  parser.add_argument('end_date', type=convert_string_to_date_object, required=False, location='json',
                      help='Use Date format') # Can be missing after parsing
  parser.add_argument('time', type=str, location='json')
  parser.add_argument('description', type=str, location='json')
  parser.add_argument('location', type=str, location='json')
  parser.add_argument('gps', type=str, location='json')
  parser.add_argument('gps_location', type=str, location='json')
  parser.add_argument('category', type=str, location='json')
  parser.add_argument('color', type=str, location='json')
