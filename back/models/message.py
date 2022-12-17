from apiflask import Schema, fields, validators

class MessageResponse(Schema):
  id = fields.Integer(example=54321, dump_only=True, required=True)
  comment = fields.String(example='This is my message', required=True)
  author_id = fields.Integer(example=101, dump_only=True, required=True)
  event_id = fields.Integer(example=12345, dump_only=False, required=True)
  creation_datetime = fields.DateTime(dt_format='iso8601', dump_only=True, required=True, example='2020-04-13T16:30:04.403284')

class MessageCreate(Schema):
  comment = fields.String(example='This is my message', required=True)
  event_id = fields.Integer(example=12345, required=True)
  editLatest = fields.Boolean(example=False, load_only=True)

#--------------------------------------------------
# Messages:

class MessagesComment(Schema):
  date = fields.DateTime(dt_format='iso8601', example='2020-04-13T16:30:04.403284', required=True)
  user = fields.Integer(example=101, required=True)
  comment = fields.String(example='This is my message', required=True)

class MessagesUser(Schema):
  firstname = fields.String(example='John', required=True)
  lastname = fields.String(example='DOE', required=True)
  phone = fields.String(example='01.02.03.04.05', metadata={'description': 'present if share_phone is true'})
  has_whatsapp = fields.Boolean(example=True)
  email = fields.String(example='john.doe@gmail.com', metadata={'description': 'present if share_email is true'})

class Messages(Schema):
  users = fields.Dict(keys=fields.String(), values=fields.Nested(MessagesUser), required=True)
  comments = fields.List(fields.Nested(MessagesComment), required=True)
  participants = fields.List(fields.Integer(), required=True, example=[101])
  interested = fields.List(fields.Integer(), required=True, example=[102,103])
