from flask import abort
from flask_restful_swagger_3 import Resource, swagger
from flask_jwt_extended import jwt_required
from models.message import Messages, MessagesComment, MessagesUser
from models.user import silence_user_fields
from database.manager import db

def create_basic_user_infos(props):
  user_infos = {
    'firstname': props['firstname'],
    'lastname': props['lastname'],
    'phone': props.get('phone', '') or '',
    'email': props.get('email', '') or '',
  }
  if bool(props.get('has_whatsapp', 0)) == True and props['phone']:
    user_infos['has_whatsapp'] = True
  return user_infos

class MessagesAPI(Resource):
  @jwt_required()
  @swagger.doc({
    'tags': ['messages'],
    'security': [
      {'BearerAuth': []}
    ],
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
            'schema': Messages
          }
        }
      },
      '401': {
        'description': 'Not authenticated'
      },
      '404': {
        'description': 'Event not found'
      }
    }
  })
  def get(self, _parser):
    """Download the list of messages for an event"""
    query = _parser.parse_args(strict=True)
    messages, registrations, creator = db.get_messages_list(query["event_id"])

    if creator is None:
      abort(404, 'Event not found')

    comments = []
    users = {}
    participants = []
    interested = []

    for registration in registrations:
      silence_user_fields(registration)
      user = MessagesUser(**create_basic_user_infos(registration))
      # Add user to list
      user_id = registration['user_id']
      users[str(user_id)] = user

      if registration['interest'] == 1:
        interested.append(user_id)
      elif registration['interest'] == 2:
        participants.append(user_id)

    for message in messages:
      silence_user_fields(message)
      user = MessagesUser(**create_basic_user_infos(message))
      # Add user to dict (or overwrite)
      users[str(message['author_id'])] = user

      comments.append(MessagesComment(**{
        'date': message['creation_datetime'],
        'user': message['author_id'],
        'comment': message['comment']
      }))

    # Add creator to dict (or overwrite)
    silence_user_fields(creator)
    user = MessagesUser(**create_basic_user_infos(creator))
    users[str(creator['id'])] = user

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
    return Messages(**result)
