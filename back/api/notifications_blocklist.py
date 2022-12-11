from flask.views import MethodView
from apiflask import APIBlueprint, abort
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.simple import SimpleMessage
from models.notifications_blocklist import NotificationsBlocklistResponseMessageWithBlock
from database.manager import db
import sqlite3

NotificationsBlocklistBP = APIBlueprint('NotificationsBlocklist', __name__, tag='Event')

class NotificationsBlocklistAPI(MethodView):

  decorators = [jwt_required(), NotificationsBlocklistBP.doc(security='BearerAuth')]

  @NotificationsBlocklistBP.output(SimpleMessage, description='Notifications blocklist added')
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


  @NotificationsBlocklistBP.output(NotificationsBlocklistResponseMessageWithBlock, description='Notifications blocklist response')
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


  @NotificationsBlocklistBP.output(SimpleMessage, description='Notifications blocklist removed')
  @NotificationsBlocklistBP.doc(responses={404: 'Notifications blocklist not found'})
  def delete(self, event_id):
    """Delete a notifications blocklist"""
    user_id = get_jwt_identity()

    rowcount = db.delete_notifications_blocklist(event_id, user_id)
    if rowcount < 1:
      abort(404, 'Notifications blocklist was not found')

    return {'message': 'Notifications blocklist deleted'}, 200


NotificationsBlocklistPI_view = NotificationsBlocklistAPI.as_view('NotificationsBlocklistAPI')
NotificationsBlocklistBP.add_url_rule('/event/<int:event_id>/notifications_blocklist', view_func=NotificationsBlocklistPI_view)
