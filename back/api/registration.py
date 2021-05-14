from flask import abort
from flask_restful_swagger_3 import Resource, swagger
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from models.registration import Registration
from database.manager import db
from emails import send_new_registration, send_del_registration
import sqlite3

@swagger.tags('event')
@swagger.security(BearerAuth=[], CookieAuth=[])
class RegisterAPI(Resource):
  @jwt_required()
  @swagger.parameters([
    {
      'name': 'interest',
      'required': True,
      'description': 'Interest (1=interested, 2=participate)',
      'in': 'query',
      'schema': {
        'type': 'integer',
        'enum': [1, 2]
      }
    }
  ])
  @swagger.response(response_code=200, description="Registration saved/updated", schema=Registration)
  @swagger.response(response_code=401, description="Not authenticated")
  def put(self, event_id, _parser):
    """Save or update a registration"""
    user_id = get_jwt_identity()
    query = _parser.parse_args(strict=True)
    query['event_id'] = event_id
    query['user_id'] = user_id
    try:
      if query['interest'] not in [1,2]:
        raise ValueError('Invalid value for interest')
      registration = Registration(**query)
    except ValueError as e:
      abort(400, e.args[0])

    try:
      props = db.set_registration(**registration)
    except sqlite3.IntegrityError as err:
      if str(err) == "FOREIGN KEY constraint failed":
        abort(404, 'Event not found')
      abort(500, err.args[0])
    except Exception as e:
      abort(500, e.args[0])

    # Email
    claims = get_jwt()
    user_name = claims['firstname'] + ' ' + claims['lastname']
    send_new_registration(event_id, user_id, user_name, props['interest'])

    return Registration(**props), 200


  @jwt_required()
  @swagger.response(response_code=200, description="Confirmation message")
  @swagger.response(response_code=401, description="Not authenticated")
  @swagger.response(response_code=404, description="Registration not found")
  def delete(self, event_id):
    """Delete a registration"""
    user_id = get_jwt_identity()

    previous = db.get_registration(event_id, user_id)
    if previous is None:
      abort(404, 'No registration found')

    rowcount = db.delete_registration(event_id, user_id)
    if rowcount < 1:
      abort(404, 'No registration deleted')

    # Email
    claims = get_jwt()
    user_name = claims['firstname'] + ' ' + claims['lastname']
    send_del_registration(event_id, user_id, user_name, previous['interest'])

    return {'message': 'Registration deleted'}, 200
