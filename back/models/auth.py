from marshmallow import Schema, fields

# class AccessToken(Schema):
#   type = 'object'
#   properties = {
#     'access_token': {'type': 'string', 'readOnly': True}
#   }

class AccessToken(Schema):
  access_token = fields.String(dump_only=True)
