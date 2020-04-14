from flask_restful_swagger_3 import Resource, swagger
from models.message import MessagesResponse, MessageCommentResponse, MessageUserResponse
from models.user import silence_user_fields
from database.manager import db

class MessagesAPI(Resource):
  @swagger.doc({
    'tags': ['messages'],
    'description': 'Download the list of messages for an event',
    'parameters': [
      {
        'name': 'event_id',
        'description': 'Event identifier',
        'in': 'query',
        'required': True,
        'schema': {
          'type': 'integer'
        }
      }
    ],
    'responses': {
      '200': {
        'description': 'List of messages',
        'content': {
          'application/json': {
            'schema': MessagesResponse
          }
        }
      }
    }
  })
  def get(self, _parser):
    """Download a list of messages"""
    query = _parser.parse_args(strict=True)
    messages_list, registrations_list = db.get_messages_list(query["event_id"])

    comments = []
    users = {}
    participants = []
    interested = []

    for registration in registrations_list:
      silence_user_fields(registration)
      user = MessageUserResponse(**{
        'name': registration['user_fullname'],
        'phone': registration.get('phone', ''),
        'email': registration.get('email', '')
      })
      # Add user to list
      user_id = registration['user_id']
      users[str(user_id)] = user

      if registration['interest'] == 1:
        interested.append(user_id)
      elif registration['interest'] == 2:
        participants.append(user_id)

    for message in messages_list:
      silence_user_fields(message)
      user = MessageUserResponse(**{
        'name': message['author_fullname'],
        'phone': message.get('phone', ''),
        'email': message.get('email', '')
      })
      # Add user to list (or overwrite)
      users[str(message['author_id'])] = user

      comments.append(MessageCommentResponse(**{
        'date': message['creation_datetime'],
        'user': message['author_id'],
        'comment': message['comment']
      }))

    # Remove empty phone or email
    for user_id in users:
      user = users[user_id]
      if user['phone'] == '':
        del user['phone']
      if user['email'] == '':
        del user['email']

    result = {
      'users': users,
      'comments': comments,
      'participants': participants,
      'interested': interested
    }
    return MessagesResponse(**result)
