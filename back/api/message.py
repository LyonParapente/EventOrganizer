from flask import request
from apiflask import APIBlueprint, abort
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from models.message import MessageCreate, MessageResponse
from database.manager import db
from emails import send_new_message

MessageBP = APIBlueprint('Message', __name__)

@MessageBP.post('/')
@jwt_required()
@MessageBP.input(MessageCreate)
@MessageBP.output(MessageResponse, status_code=201, description='Created message')
@MessageBP.doc(security='BearerAuth', responses={403: 'Update forbidden'})
def post(message):
  """Create a message"""
  author_id = get_jwt_identity()
  message['author_id'] = author_id

  props = None
  editLatest = False
  if 'editLatest' in message:
    editLatest = message['editLatest']
    del message['editLatest']

  if editLatest:
    last_msg = db.get_last_message(message['event_id'])
    if last_msg and last_msg['author_id'] == author_id:
      nb = db.edit_message(last_msg['id'], message['comment'], last_msg['author_id'], last_msg['event_id'])
      if nb == 1:
        last_msg['comment'] = message['comment']
        props = last_msg
      else:
        abort(500, 'Error updating comment')
    else:
      abort(403, 'Can only update the latest comment if it is yours')
  else:
    try:
      props = db.insert_message(**message)
    except Exception as e:
      abort(500, e.args[0])

  # Email
  if not editLatest:
    claims = get_jwt()
    author_name = claims['firstname'] + ' ' + claims['lastname']
    send_new_message(author_name, author_id, props['event_id'], props['comment'])

  return props, 201, {'Location': request.path + '/' + str(props['id'])}
