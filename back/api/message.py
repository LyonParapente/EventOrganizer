from flask import request, abort
from flask_restful_swagger_3 import Resource, swagger
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt_claims
from models.message import Message, MessageCreate
from database.manager import db
from emails import send_new_message

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
    author_id = get_jwt_identity()
    args['author_id'] = author_id

    try:
      # Validate request body with schema model
      message = MessageCreate(**args)
    except ValueError as e:
      abort(400, e.args[0])

    try:
      props = db.insert_message(**message)
    except Exception as e:
      abort(500, e.args[0])

    # Email
    claims = get_jwt_claims()
    author_name = claims['firstname'] + ' ' + claims['lastname']
    send_new_message(author_name, author_id, props['event_id'], props['comment'])

    return Message(**props), 201, {'Location': request.path + '/' + str(props['id'])}
