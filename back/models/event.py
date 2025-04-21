from apiflask import Schema, fields
from marshmallow import ValidationError

def validate_whatsapp_link(n):
  if n != '' and not n.startswith('https://chat.whatsapp.com/'):
    raise ValidationError("Invalid WhatsApp link")


class EventBase(Schema):
  title = fields.String(metadata={'example': 'My event title'})
  start_date = fields.Date(metadata={'example': '2020-04-16'})
  end_date = fields.Date(metadata={'example': '2020-04-17'})
  time = fields.String(metadata={'example': '16h'})
  description = fields.String(metadata={'example': 'Welcome to this event'})
  location= fields.String(metadata={'example': 'Annecy'})
  gps = fields.String(metadata={'example': '45.721892, 4.919573'})
  gps_location = fields.String(metadata={'example': 'La Halle Mode & Chaussures | Bron'})
  category = fields.String(metadata={'example': 'conference'})
  color = fields.String(metadata={'example': '#662C67'})
  whatsapp_link = fields.String(metadata={'example': 'https://chat.whatsapp.com/D8CuyAfZilxKbCgdIK8ZX5'}, validate=validate_whatsapp_link)

class EventCreate(EventBase):
  title = fields.String(metadata={'example': 'My event title'}, required=True)
  start_date = fields.Date(metadata={'example': '2020-04-16'}, required=True)

class EventServerInfos(Schema):
  id = fields.Integer(metadata={'example': 101}, dump_only=True, required=True)
  creator_id = fields.Integer(metadata={'example': 101}, dump_only=True, required=True)
  creation_datetime = fields.DateTime(dump_only=True, required=True, metadata={'example': '2020-04-13T16:30:04.403284'})

class Event(EventCreate,EventServerInfos):
  pass

class EventUpdate(EventBase):
  pass


def filter_event_response(props):
  streamlined_event = {k: v for k, v in props.items() if v is not None}
  return streamlined_event

# ----------
# Inputs

class EventsQuery(Schema):
  # Cannot use fields.Date because fullcalendar automatically adds time
  # start=2019-02-01T00%3A00%3A00%2B01%3A00&end=2019-03-01T00%3A00%3A00%2B01%3A00
  start = fields.String(metadata={'description': 'Start date of the interval being fetched', 'example': '2021-01-01'}) # String to be compatible with https://fullcalendar.io/docs/events-json-feed
  end = fields.String(metadata={'description': 'Exclusive end date of the interval being fetched', 'example': '2020-04-16'}) # String to be compatible with https://fullcalendar.io/docs/events-json-feed
