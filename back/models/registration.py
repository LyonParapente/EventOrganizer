from apiflask import Schema, fields, validators

class Registration(Schema):
  id = fields.Integer(metadata={'example': 17}, dump_only=True)
  interest = fields.Integer(metadata={'example': 2}, validate=validators.OneOf([1, 2]), required=True)
  event_id = fields.Integer(metadata={'example': 12345}, dump_only=True, required=True)
  user_id = fields.Integer(metadata={'example': 101}, dump_only=True, required=True)
  lastupdate_datetime = fields.DateTime(format='iso', dump_only=True, metadata={'example': '2020-04-13T16:30:04.461593'})
