from apiflask import Schema, fields

class SimpleMessage(Schema):
  message = fields.String()
