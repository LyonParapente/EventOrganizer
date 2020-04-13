from flask import request
from flask_restful_swagger_3 import Resource, swagger
from models.message import Message, get_message_parser
from database.manager import db

class MessageAPICreate(Resource):
  post_parser = get_message_parser()

  @swagger.doc({
    'tags': ['message'],
    'description': 'Create a message',
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
    'requestBody': {
      'required': True,
      'content': {
        'application/json': {
          'schema': Message
        }
      }
    },
    'responses': {
      '201': {
        'description': 'Created message',
        'content': {
          'application/json': {
            'schema': Message
          }
        }
      }
    }
  })
  def post(self):
    """Create a message"""
    args = self.post_parser.parse_args(strict=True)

    #TODO: use connected user
    args['author_id'] = 101

    message = db.insert_message(**args)
    streamlined_user = {k: v for k, v in message.items() if v is not None}
    return Message(**streamlined_user)
