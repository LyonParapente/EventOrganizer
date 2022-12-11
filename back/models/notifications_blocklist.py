from models.simple import SimpleMessage
from apiflask import fields

class NotificationsBlocklistResponseMessageWithBlock(SimpleMessage):
  block = fields.Boolean()
