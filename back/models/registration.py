from marshmallow import Schema, fields

# class Registration(Schema):
#   type = 'object'
#   properties = {
#     'id': {'type': 'integer', 'readOnly': True, 'example': 17},
#     'interest': {'type': 'integer', 'enum': [1,2], 'example': 2},
#     'event_id': {'type': 'integer', 'readOnly': True, 'example': 12345},
#     'user_id': {'type': 'integer', 'readOnly': True, 'example': 101},
#     'lastupdate_datetime': {'type': 'string', 'format': 'date-time', 'readOnly': True, 'example': '2020-04-13T16:30:04.461593Z'}
#   }
#   required = ['interest', 'event_id', 'user_id']

class Registration(Schema):
  id = fields.Integer(default=17)
  interest = fields.Integer(default=2)
  event_id = fields.Integer(default=12345)
  user_id = fields.Integer(default=101)
  lastupdate_datetime = fields.DateTime(dt_format='iso8601')
