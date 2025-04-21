from apiflask import Schema, fields, validators

class MessageResponse(Schema):
  id = fields.Integer(metadata={'example': 54321}, dump_only=True, required=True)
  comment = fields.String(metadata={'example': 'This is my message'}, required=True)
  author_id = fields.Integer(metadata={'example': 101}, dump_only=True, required=True)
  event_id = fields.Integer(metadata={'example': 12345}, dump_only=False, required=True)
  creation_datetime = fields.DateTime(format='iso8601', dump_only=True, required=True, metadata={'example': '2020-04-13T16:30:04.403284'})

class MessageCreate(Schema):
  comment = fields.String(metadata={'example': 'This is my message'}, required=True)
  event_id = fields.Integer(metadata={'example': 12345}, required=True)
  editLatest = fields.Boolean(metadata={'example': False}, load_only=True)

#--------------------------------------------------
# Messages:

class MessagesComment(Schema):
  date = fields.DateTime(format='iso8601', metadata={'example': '2020-04-13T16:30:04.403284'}, required=True)
  user = fields.Integer(metadata={'example': 101}, required=True)
  comment = fields.String(metadata={'example': 'This is my message'}, required=True)

class MessagesUser(Schema):
  firstname = fields.String(metadata={'example': 'John'}, required=True)
  lastname = fields.String(metadata={'example': 'DOE'}, required=True)
  phone = fields.String(metadata={'example': '01.02.03.04.05', 'description': 'present if share_phone is true'})
  has_whatsapp = fields.Boolean(metadata={'example': True})
  email = fields.String(metadata={'example': 'john.doe@gmail.com', 'description': 'present if share_email is true'})

class Messages(Schema):
  users = fields.Dict(keys=fields.String(), values=fields.Nested(MessagesUser), required=True)
  comments = fields.List(fields.Nested(MessagesComment), required=True)
  participants = fields.List(fields.Integer(), required=True, metadata={'example': [101]})
  interested = fields.List(fields.Integer(), required=True, metadata={'example': [102,103]})
