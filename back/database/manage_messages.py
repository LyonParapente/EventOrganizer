import datetime
from helper import get_datetime_from_str

def insert_message(self, *,
    comment=None, author_id=None, event_id=None):
  """Insert a message in the database
  Force use of keyworded arguments to prevent from field mismatch and interface incompatibility"""

  new_message = {
    'comment': comment,
    'author_id': author_id,
    'event_id': event_id,
    'creation_datetime': datetime.datetime.utcnow().isoformat()+'Z'
  }
  columns = ','.join(tuple(new_message))
  questions = ','.join(['?' for x in new_message])
  insert_message = """
    INSERT INTO messages(%s)
    VALUES(%s)""" % (columns,questions)

  db, cursor = self._connect()
  try:
    cursor.execute(insert_message, tuple(new_message.values()))
    db.commit()
    new_message['id'] = cursor.lastrowid
  finally:
    db.close()

  new_message['creation_datetime'] = get_datetime_from_str(new_message['creation_datetime'].replace('Z', '+00:00')
  return new_message

def get_last_message(self, event_id):
  """Fetch the latest message for an event from database"""
  db, cursor = self._connect()
  get_message = """SELECT *
    FROM messages
    WHERE event_id=?
    ORDER BY datetime(creation_datetime) DESC
  """
  try:
    cursor.execute(get_message, (event_id,))
    message = cursor.fetchone()
  finally:
    db.close()

  if message is not None:
    message['creation_datetime'] = get_datetime_from_str(message['creation_datetime'].replace('Z', '+00:00')
  return message

def edit_message(self, id, comment, author_id, event_id):
  """Edit a message"""
  db, cursor = self._connect()
  update_message = """
    UPDATE messages
    SET comment=?
    WHERE id=? AND event_id=? AND author_id=?
  """
  try:
    cursor.execute(update_message, (comment, id, event_id, author_id))
    db.commit()
    return cursor.rowcount
  finally:
    db.close()

def get_messages_list(self, event_id):
  """Fetch the list of messages for an event from database"""
  db, cursor = self._connect()
  get_messages = """SELECT
      m.comment,m.creation_datetime,m.author_id,
      u.phone,u.share_phone,u.has_whatsapp,u.email,u.share_email,
      u.firstname,u.lastname,u.notif_event_change
    FROM messages AS m, users AS u
    WHERE m.author_id=u.id
    AND m.event_id=?
    ORDER BY datetime(m.creation_datetime) ASC
  """
  get_registrations = """SELECT
      r.user_id,r.interest,
      u.phone,u.share_phone,u.has_whatsapp,u.email,u.share_email,
      u.firstname,u.lastname,u.notif_event_change
    FROM events_registrations r, users u
    WHERE r.user_id=u.id
    AND r.event_id=?
  """
  get_creator = """SELECT
      u.id,u.firstname,u.lastname,u.notif_event_change,
      u.phone,u.share_phone,u.has_whatsapp,u.email,u.share_email
    FROM users AS u, events AS e
    WHERE u.id=e.creator_id
    AND e.id=?
  """
  try:
    cursor.execute(get_messages, (event_id,))
    messages_list = cursor.fetchall()
    for msg in messages_list:
      msg['creation_datetime'] = get_datetime_from_str(msg['creation_datetime'].replace('Z', '+00:00'))

    cursor.execute(get_registrations, (event_id,))
    registrations_list = cursor.fetchall()

    cursor.execute(get_creator, (event_id,))
    creator = cursor.fetchone()
  finally:
    db.close()
  return messages_list, registrations_list, creator
