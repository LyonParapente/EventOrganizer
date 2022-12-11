from flask import request
from flask.views import MethodView
from apiflask import APIBlueprint, abort
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from models.event import EventCreate, EventUpdate, Event, filter_event_response
from models.simple import SimpleMessage
from database.manager import db
from emails import send_new_event
from helper import get_date_from_str
import datetime

EventBP = APIBlueprint('Event', __name__)

class EventAPI(MethodView):

  decorators = [jwt_required(), EventBP.doc(security='BearerAuth')]

  @EventBP.input(EventCreate)
  @EventBP.output(Event, status_code=201, description='Created event')
  @EventBP.doc(responses={403: 'Creation forbidden'})
  def post(self, event):
    """Create an event"""

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


  @EventBP.output(Event, status_code=200, description='Event')
  def get(self, event_id):
    """Get details of an event"""
    props = db.get_event(event_id)
    if type(props) is not dict:
      abort(404, 'Event not found')
    return filter_event_response(props)


  @EventBP.input(EventUpdate)
  @EventBP.output(Event, status_code=200, description='Updated event')
  @EventBP.doc(responses={403: 'Update forbidden'})
  def put(self, event_id, event):
    """Update an event"""
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
      db.update_event(event_id, **event)
    except Exception as e:
      abort(500, e.args[0])

    # Retrieve updated event with filtered properties
    return self.get(event_id)


  @EventBP.output(SimpleMessage, description='Confirmation message')
  @EventBP.doc(responses={403: 'Deletion forbidden'})
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


EventAPI_view = EventAPI.as_view('EventAPI')
EventBP.add_url_rule('/event', view_func=EventAPI_view, methods=['POST'])
EventBP.add_url_rule('/event/<int:event_id>', view_func=EventAPI_view, methods=['GET', 'PUT', 'DELETE'])
