from flask_restful.reqparse import RequestParser
from flask_restful_swagger_3 import swagger_type
from flask_restful import inputs

@swagger_type('string')
def convert_string_to_date_object(p):
  return inputs.date(p)

def add_event_args(parser):
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

def get():
  event_parser = RequestParser()
  add_event_args(event_parser)
  return event_parser
