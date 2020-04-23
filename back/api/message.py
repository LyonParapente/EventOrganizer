from flask import request, abort
from flask_restful_swagger_3 import Resource, swagger
from flask_jwt_extended import jwt_required
from models.message import Message, MessageCreate
from database.manager import db

class MessageAPICreate(Resource):
  @jwt_required
  @swagger.doc({
    'tags': ['message'],
    'security': [
      {'BearerAuth': []}
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
      },
      '401': {
        'description': 'Not authenticated'
      }
    }
  })
  def post(self):
    """Create a message"""
    args = request.json
    args['author_id'] = 101 #TODO: use connected user

    try:
      # Validate request body with schema model
      message = MessageCreate(**args)
    except ValueError as e:
      abort(400, e.args[0])

    try:
      props = db.insert_message(**message)
    except Exception as e:
      abort(500, e.args[0])

    return Message(**props), 201, {'Location': request.path + '/' + str(props['id'])}
