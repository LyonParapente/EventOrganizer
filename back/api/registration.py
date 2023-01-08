from apiflask.views import MethodView
from apiflask import APIBlueprint, fields, validators, abort
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from models.registration import Registration
from models.simple import SimpleMessage
from database.manager import db
from emails import send_new_registration, send_del_registration
import sqlite3

RegisterBP = APIBlueprint('Registration', __name__, tag='Event')

class RegisterAPI(MethodView):

  decorators = [jwt_required(), RegisterBP.doc(security='BearerAuth', responses={404: 'Event not found'})]

  @RegisterBP.input({'interest': fields.Integer(required=True, validate=validators.OneOf([1, 2]), metadata={'description': 'Interest (1=interested, 2=participate)'})}, location='query')
  @RegisterBP.output(Registration, description='Registration saved/updated')
  def put(self, event_id, query):
    """Save or update a registration"""
    user_id = get_jwt_identity()
    try:
      props = db.set_registration(event_id=event_id, user_id=user_id, interest=query["interest"])
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

    return props, 200


  @RegisterBP.output(SimpleMessage, description='Confirmation message')
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


RegistrationAPI_view = RegisterAPI.as_view('RegisterAPI')
RegisterBP.add_url_rule('/event/<int:event_id>/registration', view_func=RegistrationAPI_view)
