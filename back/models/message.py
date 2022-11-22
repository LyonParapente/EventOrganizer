from marshmallow import Schema, fields

# class Message(Schema):
#   type = 'object'
#   properties = {
#     'id': {'type': 'integer', 'readOnly': True, 'example': 54321},
#     'comment': {'type': 'string', 'example': 'This is my message', 'minLength': 1},
#     'author_id': {'type': 'integer', 'readOnly': True, 'example': 101},
#     'event_id': {'type': 'integer', 'readOnly': False, 'example': 12345},
#     'editLatest': {'type': 'boolean', 'writeOnly': True, 'example': False},
#     'creation_datetime': {'type': 'string', 'format': 'date-time',
#       'readOnly': True, 'example': '2020-04-13T16:30:04.403284Z'}
#   }
#   # required on response:
#   required = ['id', 'comment', 'author_id', 'event_id', 'creation_datetime']

class Message(Schema):
  id = fields.Integer(default=54321)
  comment = fields.String(default='This is my message')
  author_id = fields.Integer(default=101)
  event_id = fields.Integer(default=12345)
  editLatest = fields.Boolean(default=False)
  creation_datetime = fields.DateTime(dt_format='iso8601')

# class MessageCreate(Message):
#   required = ['comment', 'author_id', 'event_id']

#--------------------------------------------------

# class MessagesComment(Schema):
#   type = 'object'
#   properties = {
#     'date': {'type': 'string', 'format': 'date-time', 'example': '2020-04-13T16:30:04.461593Z'},
#     'user': {'type': 'integer', 'example': 101},
#     'comment': {'type': 'string', 'example': 'This is my message'}
#   }
#   required = ['date', 'user', 'comment']

class MessagesComment(Schema):
  date = fields.DateTime(dt_format='iso8601')
  user = fields.Integer(default=101)
  comment = fields.String(default='This is my message')

# class MessagesUser(Schema):
#   type = 'object'
#   properties = {
#     'firstname': {'type': 'string', 'example': 'John'},
#     'lastname': {'type': 'string', 'example': 'DOE'},
#     'phone': {'type': 'string', 'example': '01.02.03.04.05',
#       'description': 'present if share_phone is true'},
#     'has_whatsapp': {'type': 'boolean', 'example': True},
#     'email': {'type': 'string', 'format': 'email',
#       'example': 'john.doe@gmail.com', 'minLength': 5,
#       'description': 'present if share_email is true'}
#   }
#   required = ['firstname', 'lastname']

class MessagesUser(Schema):
  firstname = fields.String(default='John')
  lastname = fields.String(default='DOE')
  phone = fields.String(default='01.02.03.04.05') # present if share_phone is true
  has_whatsapp = fields.Boolean(default=True)
  email = fields.String(default='john.doe@gmail.com') # present if share_email is true

# class Messages(Schema):
#   type = 'object'
#   properties = {
#     'users': {
#       'type': 'object',
#       'additionalProperties': MessagesUser
#     },
#     'comments': {
#       'type': 'array',
#       'items': MessagesComment
#     },
#     'participants': {
#       'type': 'array',
#       'items': {'type': 'integer', 'example': 101}
#     },
#     'interested': {
#       'type': 'array',
#       'items': {'type': 'integer', 'example': [102,103]}
#     }
#   }
#   required = ['users', 'comments', 'participants', 'interested']

class Messages(Schema):
  users = {'user1': fields.Nested(MessagesUser), 'user2': fields.Nested(MessagesUser)}
  comments = MessagesComment(many=True)
  participants = fields.Integer(default=101, many=True)
  interested = fields.Integer(default=102, many=True)
