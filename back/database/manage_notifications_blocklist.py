def set_notifications_blocklist(self, event_id, user_id):
  """Insert a notifications blocklist in the database"""

  res = self.list_notifications_blocklist(event_id, user_id)
  if res is not None:
    return 0

  insert_blocklist = """
    INSERT INTO events_notifications_blocklist(event_id,user_id)
    VALUES(?,?)
  """

  db, cursor = self._connect()
  try:
    cursor.execute(insert_blocklist, (event_id, user_id))
    db.commit()
    return cursor.rowcount
  finally:
    db.close()

def list_notifications_blocklist(self, event_id, user_id=None):
  """Fetch notifications blocklist for an event from database"""
  db, cursor = self._connect()
  try:
    get_blocklist = """SELECT user_id
      FROM events_notifications_blocklist
      WHERE event_id=?
    """
    values = (event_id,)
    if user_id is not None:
      get_blocklist += " AND user_id=?"
      values = (event_id, user_id)

    cursor.execute(get_blocklist, values)
    return cursor.fetchall() if user_id is None else cursor.fetchone()
  finally:
    db.close()

def delete_notifications_blocklist(self, event_id, user_id):
  """Delete a specific notifications blocklist from database"""
  db, cursor = self._connect()
  del_blocklist = """DELETE FROM events_notifications_blocklist
    WHERE event_id=? AND user_id=?"""
  try:
    cursor.execute(del_blocklist, (event_id, user_id))
    db.commit()
    return cursor.rowcount
  finally:
    db.close()
