from flask import request, abort
from flask_restful_swagger_3 import Resource, swagger
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.registration import Registration
from database.manager import db
import sqlite3

class RegisterAPI(Resource):
  @jwt_required
  @swagger.doc({
    'tags': ['event'],
    'security': [
      {'BearerAuth': []}
    ],
    'parameters': [
      {
        'name': 'event_id',
        'required': True,
        'description': 'Event identifier',
        'in': 'path',
        'schema': {
          'type': 'integer'
        }
      },
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
    ],
    'responses': {
      '200': {
        'description': 'Registration saved/updated',
        'content': {
          'application/json': {
            'schema': Registration
          }
        }
      },
      '401': {
        'description': 'Not authenticated'
      }
    }
  })
  def put(self, event_id, _parser):
    """Save or update a registration"""
    query = _parser.parse_args(strict=True)
    query['event_id'] = event_id
    query['user_id'] = get_jwt_identity()
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

    return Registration(**props), 200


  @jwt_required
  @swagger.doc({
    'tags': ['event'],
    'security': [
      {'BearerAuth': []}
    ],
    'parameters': [
      {
        'name': 'event_id',
        'required': True,
        'description': 'Event identifier',
        'in': 'path',
        'schema': {
          'type': 'integer'
        }
      }
    ],
    'responses': {
      '200': {
        'description': 'Confirmation message'
      },
      '401': {
        'description': 'Not authenticated'
      },
      '404': {
        'description': 'Registration not found'
      }
    }
  })
  def delete(self, event_id):
    """Delete a registration"""
    user_id = get_jwt_identity()
    rowcount = db.delete_registration(event_id, user_id)
    if rowcount < 1:
      abort(404, 'No registration deleted')
    return {'message': 'Registration deleted'}, 200
