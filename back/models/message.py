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

#--------------------------------------------------

class CommentResponse(Schema):
  type = 'object'
  properties = {
    'date': {'type': 'datetime', 'example': '2020-04-13 16:30:04'},
    'user': {'type': 'integer', 'example': 101},
    'comment': {'type': 'string', 'example': 'This is my message'}
  }

class UserResponse(Schema):
  type = 'object'
  properties = {
    'name': {'type': 'string', 'example': 'John DOE'},
    'phone': {'type': 'string', 'example': '01.02.03.04.05'}, # if shared
    'email': {'type': 'string', 'example': 'john.doe@gmail.com'} # if shared
  }

class MessagesResponse(Schema):
  type = 'object'
  properties = {
    'users': {
      'type': 'object',
      'additionalProperties': UserResponse
    },
    'comments': {
      'type': 'array',
      'items': CommentResponse
    },
    'participants': {
      'type': 'array',
      'items': {'type': 'integer', 'example': 101}
    },
    'interested': {
      'type': 'array',
      'items': {'type': 'integer', 'example': [102,103]}
    }
  }