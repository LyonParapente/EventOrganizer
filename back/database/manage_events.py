import datetime
from helper import get_datetime_from_str, get_date_from_str

def insert_event(self, *,
    title=None, start_date=None, end_date=None, time=None, description=None,
    location=None, gps=None, gps_location=None, category=None, color=None,
    whatsapp_link=None, creator_id=None):
  """Insert an event in the database
  Force use of keyworded arguments to prevent from field mismatch and interface incompatibility"""

  # Note: the keys insertion order in the dictionary is important and allow the use of
  # new_event.values() whose element order shall match the sqlite insertion command
  new_event = {
    'title': title,
    'start_date': start_date,
    'end_date': end_date, # When None means = start_date (full day event)
    'time': time,
    'description': description,
    'location': location,
    'gps': gps,
    'gps_location': gps_location,
    'category': category,
    'color': color,
    'whatsapp_link': whatsapp_link,
    'creator_id': creator_id,
    'creation_datetime': datetime.datetime.utcnow().isoformat()+'Z'
  }
  columns = ','.join(tuple(new_event))
  questions = ','.join(['?' for x in new_event])
  insert_event = """
    INSERT INTO events(%s)
    VALUES(%s)""" % (columns,questions)

  db, cursor = self._connect()
  try:
    cursor.execute(insert_event, tuple(new_event.values()))
    db.commit()
    new_event['id'] = cursor.lastrowid
  finally:
    db.close()

  new_event['creation_datetime'] = get_datetime_from_str(new_event['creation_datetime'].replace('Z', '+00:00'))
  return new_event

def get_event(self, event_id):
  """Fetch a specific event from database"""
  db, cursor = self._connect()
  try:
    get_event = """SELECT * FROM events WHERE id=?"""
    cursor.execute(get_event, (event_id,))
    res = cursor.fetchone()
  finally:
    db.close()

  if res is not None:
    res['creation_datetime'] = get_datetime_from_str(res['creation_datetime'].replace('Z', '+00:00'))
    res['start_date'] = get_date_from_str(res['start_date'])
    if res['end_date'] is not None:
      res['end_date'] = get_date_from_str(res['end_date'])

  return res

def update_event(self, event_id, *,
    title=None, start_date=None, end_date=None, time=None, description=None,
    location=None, gps=None, gps_location=None, category=None, color=None,
    whatsapp_link=None):
  """Update an event in the database
  Force use of keyworded arguments to prevent from field mismatch and interface incompatibility"""

  # Note: forbids update of creator_id
  fields_to_update = {
    'title': title,
    'start_date': start_date,
    'end_date': end_date, # When None means = start_date (full day event)
    'time': time,
    'description': description,
    'location': location,
    'gps': gps,
    'gps_location': gps_location,
    'category': category,
    'color': color,
    'whatsapp_link': whatsapp_link,
  }
  # Delete keys whose value is None
  fields_to_update = {k: v for k, v in fields_to_update.items() if v is not None}

  if not len(fields_to_update) == 0:
    # Build the update sql command
    update_event = "UPDATE events SET "
    for k in fields_to_update.keys():
        update_event += k + "=?,"
    # Remove trailing column
    update_event = update_event.rstrip(',')
    update_event += " WHERE id=?"

    # Add id to the fields dictionary. Note that the insertion order is important
    fields_to_update['id'] = event_id

    db, cursor = self._connect()
    try:
      cursor.execute(update_event, tuple(fields_to_update.values()))
      db.commit()
    finally:
      db.close()
  return fields_to_update

def delete_event(self, event_id):
  """Delete a specific event from database"""
  db, cursor = self._connect()
  del_event = "DELETE FROM events WHERE id=?"
  try:
    cursor.execute(del_event, (event_id,))
    db.commit()
    return cursor.rowcount
  finally:
    db.close()

def get_events_list(self, start, end, fetch_start_before=True):
  """Fetch a list of events (in a date range) from database"""
  db, cursor = self._connect()

  parameters = []
  where_start = where_end = ''
  if start is not None:
    where_start = " AND (datetime(start_date) >= datetime(?) "
    parameters.append(str(start))

    if fetch_start_before:
      start_before_range = "OR (datetime(start_date) < datetime(?) AND datetime(end_date_bis) > datetime(?))"
      where_start += start_before_range
      parameters.append(str(start))
      parameters.append(str(start))

    where_start += ")"

  if end is not None:
    where_start += " AND datetime(start_date) <= datetime(?)"
    parameters.append(str(end))

    end_after_range = "OR (datetime(end_date_bis) > datetime(?) AND datetime(start_date) <= datetime(?))"
    where_end = " AND (datetime(end_date_bis) <= datetime(?) "+end_after_range+")"
    parameters.append(str(end))
    parameters.append(str(end))
    parameters.append(str(end))

  get_events = """SELECT
      e.id,e.title,e.start_date,e.end_date,e.time,e.description,
      e.location,e.gps,e.gps_location,e.category,e.color,
      e.creator_id,e.creation_datetime,e.whatsapp_link,
      CASE 
        WHEN e.end_date IS NULL THEN e.start_date
        ELSE e.end_date
      END end_date_bis
    FROM events AS e, users AS u
    WHERE e.creator_id=u.id
    """ + where_start + where_end + """
    ORDER BY datetime(start_date) ASC
  """
  #print(get_events)
  try:
    cursor.execute(get_events, parameters)
    events_list = cursor.fetchall()
  finally:
    db.close()

  for event in events_list:
    del event["end_date_bis"]
    event['creation_datetime'] = get_datetime_from_str(event['creation_datetime'].replace('Z', '+00:00'))

    event['start_date'] = get_date_from_str(event['start_date'])
    if event['end_date']:
      event['end_date'] = get_date_from_str(event['end_date'])
  return events_list
