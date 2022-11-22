from flask import request, abort
from flask_restful import Resource
from flask_apispec import marshal_with
from flask_apispec.views import MethodResource
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from models.event import Event, validate_event, filter_event_response
from database.manager import db
from emails import send_new_event
from helper import get_date_from_str
import datetime

class EventAPICreate(MethodResource, Resource):
  @jwt_required()
  # @swagger.doc({
  #   'tags': ['event'],
  #   'security': [
  #     {'BearerAuth': []}
  #   ],
  #   'requestBody': {
  #     'required': True,
  #     'content': {
  #       'application/json': {
  #         'schema': Event
  #       }
  #     }
  #   },
  #   'responses': {
  #     '201': {
  #       'description': 'Created event',
  #       'content': {
  #         'application/json': {
  #           'schema': Event
  #         }
  #       }
  #     },
  #     '401': {
  #       'description': 'Not authenticated'
  #     },
  #     '403': {
  #       'description': 'Creation forbidden'
  #     }
  #   }
  # })
  @marshal_with(Event)
  def post(self):
    """Create an event"""
    # Validate request body with schema model
    event = validate_event(request.json, create=True)

    end_date = event['end_date'] if event.get('end_date') else event['start_date']
    event_end = get_date_from_str(end_date)
    today = datetime.date.today()
    if event_end < today:
      abort(403, 'Cannot create an event in the past')

    creator_id = get_jwt_identity()
    event['creator_id'] = creator_id
    try:
      props = db.insert_event(**event)
    except Exception as e:
      abort(500, e.args[0])

    new_event = filter_event_response(props)

    # The creator of an event is immediately registered as participant
    try:
      db.set_registration(
        event_id=new_event['id'],
        user_id=new_event['creator_id'],
        interest=2
      )
    except Exception as e:
      #not a big deal, let's continue
      pass

    # Email
    claims = get_jwt()
    creator_name = claims['firstname'] + ' ' + claims['lastname']
    try:
      send_new_event(new_event, creator_name)
    except Exception as e:
      #skip email error in client side => event added in the calendar
      #not a big deal, let's continue
      pass

    return new_event, 201, {'Location': request.path + '/' + str(props['id'])}

class EventAPI(MethodResource, Resource):
  @jwt_required()
  # @swagger.doc({
  #   'tags': ['event'],
  #   'security': [
  #     {'BearerAuth': []}
  #   ],
  #   'parameters': [
  #     {
  #       'name': 'event_id',
  #       'required': True,
  #       'description': 'Event identifier',
  #       'in': 'path',
  #       'schema': {
  #         'type': 'integer'
  #       }
  #     }
  #   ],
  #   'responses': {
  #     '200': {
  #       'description': 'Event',
  #       'content': {
  #         'application/json': {
  #           'schema': Event
  #          }
  #       }
  #     },
  #     '401': {
  #       'description': 'Not authenticated'
  #     },
  #     '404': {
  #       'description': 'Event not found'
  #     }
  #   }
  # })
  @marshal_with(Event)
  def get(self, event_id):
    """Get details of an event"""
    props = db.get_event(event_id)
    if type(props) is not dict:
      abort(404, 'Event not found')
    return filter_event_response(props)


  @jwt_required()
  # @swagger.doc({
  #   'tags': ['event'],
  #   'security': [
  #     {'BearerAuth': []}
  #   ],
  #   'parameters': [
  #     {
  #       'name': 'event_id',
  #       'required': True,
  #       'description': 'Event identifier',
  #       'in': 'path',
  #       'schema': {
  #         'type': 'integer'
  #       }
  #     }
  #   ],
  #   'requestBody': {
  #     'required': True,
  #     'content': {
  #       'application/json': {
  #         'schema': Event
  #       }
  #     }
  #   },

  #   'responses': {
  #     '200': {
  #       'description': 'Updated event',
  #       'content': {
  #         'application/json': {
  #           'schema': Event
  #         }
  #       }
  #     },
  #     '401': {
  #       'description': 'Not authenticated'
  #     },
  #     '403': {
  #       'description': 'Update forbidden'
  #     },
  #     '404': {
  #       'description': 'Event not found'
  #     }
  #   }
  # })
  def put(self, event_id):
    """Update an event"""
    # Validate request body with schema model
    validate_event(request.json, update=True)

    db_event = self.get(event_id)

    claims = get_jwt()
    if claims['role'] != 'admin':
      if db_event['creator_id'] != get_jwt_identity():
        abort(403, "You cannot update someone else event")

    today = datetime.date.today()
    end_date = db_event['end_date'] if db_event.get('end_date') else db_event['start_date']
    event_end = get_date_from_str(end_date)
    if event_end < today:
      abort(403, 'Cannot modify a past event')

    try:
      db.update_event(event_id, **request.json)
    except Exception as e:
      abort(500, e.args[0])

    # Retrieve updated event with filtered properties
    return self.get(event_id)


  @jwt_required()
  # @swagger.doc({
  #   'tags': ['event'],
  #   'security': [
  #     {'BearerAuth': []}
  #   ],
  #   'parameters': [
  #     {
  #       'name': 'event_id',
  #       'required': True,
  #       'description': 'Event identifier',
  #       'in': 'path',
  #       'schema': {
  #         'type': 'integer'
  #       }
  #     }
  #   ],
  #   'responses': {
  #     '200': {
  #       'description': 'Confirmation message',
  #     },
  #     '401': {
  #       'description': 'Not authenticated'
  #     },
  #     '403': {
  #       'description': 'Deletion forbidden'
  #     },
  #     '404': {
  #       'description': 'Event not found'
  #     }
  #   }
  # })
  def delete(self, event_id):
    """Delete an event"""

    db_event = self.get(event_id)

    claims = get_jwt()
    if claims['role'] != 'admin':
      if db_event['creator_id'] != get_jwt_identity():
        abort(403, "You cannot delete someone else event")

    today = datetime.date.today()
    end_date = db_event['end_date'] if db_event.get('end_date') else db_event['start_date']
    event_end = get_date_from_str(end_date)
    if event_end < today:
      abort(403, 'Cannot delete a past event')

    # messages & registrations are also delete by cascade
    rowcount = db.delete_event(event_id)
    if rowcount < 1:
      abort(404, 'No event was deleted')
    return {'message': 'Event deleted'}, 200
