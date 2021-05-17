from flask import abort
from flask_restful_swagger_3 import Resource, swagger
from flask_jwt_extended import jwt_required, get_jwt_identity
from database.manager import db
import sqlite3

class NotificationsBlocklistAPI(Resource):
  @jwt_required()
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
        'description': 'Notifications blocklist added'
      },
      '401': {
        'description': 'Not authenticated'
      }
    }
  })
  def put(self, event_id):
    """Add a notifications blocklist"""
    user_id = get_jwt_identity()
    try:
      db.set_notifications_blocklist(event_id, user_id)
    except sqlite3.IntegrityError as err:
      if str(err) == "FOREIGN KEY constraint failed":
        abort(404, 'Event not found')
      abort(500, err.args[0])
    except Exception as e:
      abort(500, e.args[0])

    return {'message': 'Ignoring notifications for this event'}, 200


  @jwt_required()
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
        'description': 'Notifications blocklist response'
      },
      '401': {
        'description': 'Not authenticated'
      }
    }
  })
  def get(self, event_id):
    """Get a notifications blocklist"""
    user_id = get_jwt_identity()
    try:
      row = db.list_notifications_blocklist(event_id, user_id)
    except Exception as e:
      abort(500, e.args[0])

    if row is None:
      res = {'message': 'Notifications blocklist not setted for this event', 'block': False }
    else:
      res = {'message': 'Ignoring notifications for this event', 'block': True}
    return res, 200


  @jwt_required()
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
        'description': 'Notifications blocklist removed'
      },
      '401': {
        'description': 'Not authenticated'
      },
      '404': {
        'description': 'Notifications blocklist not found'
      }
    }
  })
  def delete(self, event_id):
    """Delete a notifications blocklist"""
    user_id = get_jwt_identity()

    rowcount = db.delete_notifications_blocklist(event_id, user_id)
    if rowcount < 1:
      abort(404, 'Notifications blocklist was not found')

    return {'message': 'Notifications blocklist deleted'}, 200
