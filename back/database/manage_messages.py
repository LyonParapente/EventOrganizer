import datetime

def insert_message(self, *,
    comment=None, author_id=None, event_id=None):
  """Insert a message in the database
  Force use of keyworded arguments to prevent from field mismatch and interface incompatibility"""

  new_message = {
    'comment': comment,
    'author_id': author_id,
    'event_id': event_id,
    'creation_datetime': datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
  }
  columns = ','.join(tuple(new_message))
  questions = ','.join(['?' for x in new_message])
  insert_message = """INSERT INTO messages(%s)
                  VALUES(%s)"""%(columns,questions)

  db, cursor = self._connect()
  try:
    cursor.execute(insert_message, tuple(new_message.values()))
    db.commit()
    new_message['id'] = cursor.lastrowid
  finally:
    db.close()
  return new_message


def get_messages_list(self, event_id):
  """Fetch the list of messages for an event from database"""
  db, cursor = self._connect()
  get_messages = """SELECT
      m.comment,m.creation_datetime,m.author_id,
      u.phone,u.share_phone,u.email,u.share_email,
      u.firstname, u.lastname
    FROM messages AS m, users AS u
    WHERE m.author_id=u.id
    AND m.event_id=?
    ORDER BY datetime(m.creation_datetime) ASC
  """
  get_registrations = """SELECT r.user_id,r.interest,
      u.phone,u.share_phone,u.email,u.share_email,
      u.firstname, u.lastname
    FROM events_registrations r, users u
    WHERE r.user_id=u.id
    AND r.event_id=?
  """
  try:
    cursor.execute(get_messages, (event_id,))
    messages_list = cursor.fetchall()

    cursor.execute(get_registrations, (event_id,))
    registrations_list = cursor.fetchall()
  finally:
    db.close()
  return messages_list, registrations_list
