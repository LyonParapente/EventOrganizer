from apiflask import Schema, fields
from marshmallow import ValidationError

def validate_whatsapp_link(n):
  if n != '' and not n.startswith('https://chat.whatsapp.com/'):
    raise ValidationError("Invalid WhatsApp link")


class EventBase(Schema):
  title = fields.String(example='My event title')
  start_date = fields.Date(example='2020-04-16')
  end_date = fields.Date(example='2020-04-17')
  time = fields.String(example='16h')
  description = fields.String(example='Welcome to this event')
  location= fields.String(example='Annecy')
  gps = fields.String(example='45.721892, 4.919573')
  gps_location = fields.String(example='La Halle Mode & Chaussures | Bron')
  category = fields.String(example='conference')
  color = fields.String(example='#662C67')
  whatsapp_link = fields.String(example='https://chat.whatsapp.com/D8CuyAfZilxKbCgdIK8ZX5', validate=validate_whatsapp_link)

class EventCreate(EventBase):
  title = fields.String(example='My event title', required=True)
  start_date = fields.Date(example='2020-04-16', required=True)

class Event(EventCreate):
  id = fields.Integer(example=101, dump_only=True, required=True)
  creator_id = fields.Integer(example=101, dump_only=True, required=True)
  creation_datetime = fields.DateTime(dump_only=True, required=True, example='2020-04-13T16:30:04.403284')

class EventUpdate(EventBase):
  pass


def filter_event_response(props):
  streamlined_event = {k: v for k, v in props.items() if v is not None}
  return streamlined_event

# ----------
# Inputs

class EventsQuery(Schema):
  start = fields.Date(metadata={'description': 'Start date of the interval being fetched'}, example='2021-01-01') # String to be compatible with https://fullcalendar.io/docs/events-json-feed
  end = fields.Date(metadata={'description': 'Exclusive end date of the interval being fetched'}, example='2020-04-16') # String to be compatible with https://fullcalendar.io/docs/events-json-feed
