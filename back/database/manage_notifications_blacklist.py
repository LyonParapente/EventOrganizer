import datetime

def set_notifications_blacklist(self, event_id, user_id):
  """Insert a notifications blacklist in the database"""

  # Use or replace to fail silently in case it's already setted
  insert_blacklist = """
    INSERT OR REPLACE INTO events_notifications_blacklist(event_id,user_id)
    VALUES(?,?)
  """

  db, cursor = self._connect()
  try:
    cursor.execute(insert_blacklist, (event_id, user_id))
    db.commit()
    return cursor.rowcount
  finally:
    db.close()

def list_notifications_blacklist(self, event_id, user_id=None):
  """Fetch notifications blacklist for an event from database"""
  db, cursor = self._connect()
  try:
    get_blacklist = """SELECT user_id
      FROM events_notifications_blacklist
      WHERE event_id=?
    """
    values = (event_id,)
    if user_id is not None:
      get_blacklist += " AND user_id=?"
      values = (event_id, user_id)

    cursor.execute(get_blacklist, values)
    return cursor.fetchall() if user_id is None else cursor.fetchone()
  finally:
    db.close()

def delete_notifications_blacklist(self, event_id, user_id):
  """Delete a specific notifications blacklist from database"""
  db, cursor = self._connect()
  del_blacklist = """DELETE FROM events_notifications_blacklist
    WHERE event_id=? AND user_id=?"""
  try:
    cursor.execute(del_blacklist, (event_id, user_id))
    db.commit()
    return cursor.rowcount
  finally:
    db.close()
