from flask_restful_swagger_3 import Schema

class Message(Schema):
  type = 'object'
  properties = {
    'id': {'type': 'integer', 'readOnly': True, 'example': 54321},
    'comment': {'type': 'string', 'example': 'This is my message', 'minLength': 1},
    'author_id': {'type': 'integer', 'example': 101, 'readOnly': True},
    'event_id': {'type': 'integer', 'example': 12345, 'readOnly': False},
    'creation_datetime': {'type': 'string', 'format': 'date-time',
      'readOnly': True, 'example': '2020-04-13 16:30:04'}
  }
  required = ['id', 'comment', 'author_id', 'event_id', 'creation_datetime']

class MessageCreate(Message):
  required = ['comment', 'author_id', 'event_id']

#--------------------------------------------------

class MessagesComment(Schema):
  type = 'object'
  properties = {
    'date': {'type': 'string', 'format': 'date-time', 'example': '2020-04-13 16:30:04'},
    'user': {'type': 'integer', 'example': 101},
    'comment': {'type': 'string', 'example': 'This is my message'}
  }
  required = ['date', 'user', 'comment']

class MessagesUser(Schema):
  type = 'object'
  properties = {
    'firstname': {'type': 'string', 'example': 'John'},
    'lastname': {'type': 'string', 'example': 'DOE'},
    'phone': {'type': 'string', 'example': '01.02.03.04.05',
      'description': 'present if share_phone is true'},
    'email': {'type': 'string', 'format': 'email',
      'example': 'john.doe@gmail.com', 'minLength': 5,
      'description': 'present if share_email is true'}
  }
  required = ['firstname', 'lastname']

class Messages(Schema):
  type = 'object'
  properties = {
    'users': {
      'type': 'object',
      'additionalProperties': MessagesUser
    },
    'comments': {
      'type': 'array',
      'items': MessagesComment
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
  required = ['users', 'comments', 'participants', 'interested']
