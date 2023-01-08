from apiflask import Schema, fields

class AccessToken(Schema):
  access_token = fields.String(dump_only=True)

class LoginData(Schema):
  login = fields.String(required=True, metadata={'description': 'User email'})
  password = fields.String(required=True, metadata={'description': 'User password'})
