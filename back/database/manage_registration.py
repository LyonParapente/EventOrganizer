import datetime
from helper import get_datetime_from_str

def set_registration(self, *,
    event_id=None, user_id=None, interest=None):
  """Insert or update a registration in the database
  Force use of keyworded arguments to prevent from field mismatch and interface incompatibility"""

  registration = {
    'event_id': event_id,
    'user_id': user_id,
    'interest': interest,
    'lastupdate_datetime': datetime.datetime.utcnow().isoformat()+'Z'
  }

  # We have to get the existing id if any, so that REPLACE works
  # Otherwise autoincrement updates the id...
  r = self.get_registration(event_id, user_id)
  if r is not None:
    registration['id'] = r['id']

  columns = ','.join(tuple(registration))
  questions = ','.join(['?' for x in registration])
  registration_order = """
    INSERT OR REPLACE INTO events_registrations(%s)
    VALUES(%s)""" % (columns,questions)

  db, cursor = self._connect()
  try:
    cursor.execute(registration_order, tuple(registration.values()))
    db.commit()
    registration['id'] = cursor.lastrowid
  finally:
    db.close()

  registration['lastupdate_datetime'] = get_datetime_from_str(registration['lastupdate_datetime'].replace('Z', '+00:00'))
  return registration

def get_registration(self, event_id, user_id):
  """Fetch a specific registration from database"""
  db, cursor = self._connect()
  try:
    get_registration = """SELECT *
      FROM events_registrations
      WHERE event_id=? AND user_id=?
    """
    cursor.execute(get_registration, (event_id, user_id))
    res = cursor.fetchone()
  finally:
    db.close()

  if res is not None:
    res['lastupdate_datetime'] = get_datetime_from_str(res['lastupdate_datetime'].replace('Z', '+00:00'))
  return res

def delete_registration(self, event_id, user_id):
  """Delete a specific registration from database"""
  db, cursor = self._connect()
  del_registration = """DELETE FROM events_registrations
    WHERE event_id=? AND user_id=?"""
  try:
    cursor.execute(del_registration, (event_id, user_id))
    db.commit()
    return cursor.rowcount
  finally:
    db.close()
