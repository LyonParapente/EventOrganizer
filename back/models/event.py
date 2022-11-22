from marshmallow import Schema, fields
from flask import abort

# class Event(Schema):
#   type = 'object'
#   properties = {
#     'id': {'type': 'integer', 'readOnly': True, 'example': 101},
#     'title': {'type': 'string', 'example': 'My event title'},
#     'start_date': {'type': 'string', 'format': 'date', 'example': '2020-04-16'},
#     'end_date': {'type': 'string', 'format': 'date', 'example': '2020-04-17'},
#     'time': {'type': 'string', 'example': '16h'},
#     'description': {'type': 'string', 'example': 'Welcome to this event'},
#     'location': {'type': 'string', 'example': 'Annecy'},
#     'gps': {'type': 'string', 'example': '45.721892, 4.919573'},
#     'gps_location': {'type': 'string', 'example': 'La Halle Mode & Chaussures | Bron'},
#     'category': {'type': 'string', 'example': 'conference'},
#     'color': {'type': 'string', 'example': '#662C67'},
#     'whatsapp_link': {'type': 'string', 'example': 'https://chat.whatsapp.com/D8CuyAfZilxKbCgdIK8ZX5'},
#     'creator_id': {'type': 'integer', 'readOnly': True, 'example': 101},
#     'creation_datetime': {'type': 'string', 'format': 'date-time', 'readOnly': True, 'example': '2020-04-13T16:30:04.403284Z'}
#   }
#   # required on response:
#   required = ['id', 'title', 'start_date', 'creator_id', 'creation_datetime']

class Event(Schema):
  id = fields.Integer(default=101)
  title = fields.String(default='My event title')
  start_date = fields.String(default='2020-04-16')
  end_date = fields.String(default='2020-04-17')
  time = fields.String(default='16h')
  description = fields.String(default='Welcome to this event')
  location= fields.String(default='Annecy')
  gps = fields.String(default='45.721892, 4.919573')
  gps_location = fields.String(default='La Halle Mode & Chaussures | Bron')
  category = fields.String(default='conference')
  color = fields.String(default='#662C67')
  whatsapp_link = fields.String(default='https://chat.whatsapp.com/D8CuyAfZilxKbCgdIK8ZX5')
  creator_id = fields.Integer(default= 101)
  creation_datetime = fields.DateTime(dt_format='iso8601')

#EventsList = {fields.List(fields.Nested(Event))}
EventsList = Event(many=True)


# The following classes do not appear in swagger
# class EventCreate(Event):
#   required = ['title', 'start_date']
# class EventUpdate(Event):
#   required = []

def validate_event(json, create=False, update=False):
  try:
    # if create == True:
    #   user = EventCreate(**json)
    # elif update == True:
    #   user = EventUpdate(**json)
    user = json # TODO: https://marshmallow.readthedocs.io/en/stable/quickstart.html#validation
    if json.get('whatsapp_link', '') != '' and not json['whatsapp_link'].startswith('https://chat.whatsapp.com/'):
      raise ValueError('Invalid WhatsApp link')
  except ValueError as e:
    abort(400, e.args[0])
  return user

def filter_event_response(props):
  # Always remove writeOnly fields for output
  for field in Event.properties:
    if Event.properties[field].get('writeOnly') is True:
      props[field] = None

  streamlined_event = {k: v for k, v in props.items() if v is not None}
  return streamlined_event