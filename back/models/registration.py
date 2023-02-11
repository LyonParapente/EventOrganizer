from apiflask import Schema, fields, validators

class Registration(Schema):
  id = fields.Integer(example=17, dump_only=True)
  interest = fields.Integer(example=2, validate=validators.OneOf([1, 2]), required=True)
  event_id = fields.Integer(example=12345, dump_only=True, required=True)
  user_id = fields.Integer(example=101, dump_only=True, required=True)
  lastupdate_datetime = fields.DateTime(format='iso8601', dump_only=True, example='2020-04-13T16:30:04.461593')
