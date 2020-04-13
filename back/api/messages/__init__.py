from flask_restful_swagger_3 import Resource, swagger
from models.message import Message, MessageList
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
            'schema': MessageList
          }
        }
      }
    }
  })
  def get(self, _parser):
    """Download a list of messages"""
    query = _parser.parse_args(strict=True)
    messages_list = db.get_messages_list(query["event_id"])
    if type(messages_list) is not list:
      abort(404)
    return messages_list
