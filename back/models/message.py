from flask_restful_swagger_3 import Schema
from flask_restful.reqparse import RequestParser

class Message(Schema):
  type = 'object'
  properties = {
    'id': {'type': 'integer', 'readOnly': True},
    'comment': {'type': 'string', 'example': 'This is my message'},
    'author_id': {'type': 'integer', 'example': 101, 'readOnly': True},
    'event_id': {'type': 'integer', 'example': 12345, 'readOnly': True},
    'creation_datetime': {'type': 'string', 'format': 'datetime', 'readOnly': True, 'example': '2020-04-13 16:30:04'}
  }
  required = ['comment']

def get_message_parser():
  parser = RequestParser()
  parser.add_argument('event_id', type=int, location='values')
  parser.add_argument('comment', type=str, location='json')
  return parser

class MessageList(Schema):
  type = 'array'
  items = Message
