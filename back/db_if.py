import sqlite3
import datetime

def _dict_factory(cursor, row):
  d = {}
  for idx, col in enumerate(cursor.description):
    d[col[0]] = row[idx]
  return d

class EventsDb(object):
  def __init__(self, db_file):
    self.db_file = db_file

    db, cursor = self._connect()
    with open('./create_db.sql', 'r') as sql_file:
      cursor.executescript(sql_file.read())

    # Default sequences values
    cursor.execute('SELECT * FROM sqlite_sequence')
    if cursor.fetchone() is None:
      cursor.execute("INSERT INTO sqlite_sequence VALUES('events', 10000)")
      cursor.execute("INSERT INTO sqlite_sequence VALUES('users', 100)")
      cursor.execute("INSERT INTO sqlite_sequence VALUES('events_registration', 0)")
      cursor.execute("INSERT INTO sqlite_sequence VALUES('messages', 0)")

    # Default user to test API
    cursor.execute('SELECT * FROM users')
    if cursor.fetchone() is None:
      cursor.execute("INSERT INTO users(email,password) VALUES('admin','')")
      print("Default user id: %d" % cursor.lastrowid)

    db.commit()

  def _connect(self):
    db = sqlite3.connect(self.db_file)
    if db is None:
      raise Exception("Can not connect to database")

    db.row_factory = _dict_factory
    cursor = db.cursor()
    # Foreign keys constraint enforcement shall be enabled upon every connection to DB
    cursor.execute("PRAGMA foreign_keys = ON")
    return db, cursor

  # Insert a user in the database
  # Force use of keyworded arguments to prevent from field mismatch and interface incompatibility
  def insert_user(self, *, firstname=None, lastname=None, email=None, password=None, phone=None, licence=None):

    # Note that the keys insertion order in the dictionary is important and allow the use of
    # new_user.values() whose element order shall match the sqlite insertion command
    new_user = {
        'firstname': firstname,
        'lastname': lastname,
        'email': email,
        'password': password,
        'phone': phone,
        'licence': licence
    }

    insert_user = """INSERT INTO users(firstname,lastname,email,password,phone,licence)
                    VALUES(?,?,?,?,?,?)"""

    db, cursor = self._connect()
    cursor.execute(insert_user, tuple(new_user.values()))
    db.commit()

    return cursor.lastrowid

  # Insert an event in the database
  # Force use of keyworded arguments to prevent from field mismatch and interface incompatibility
  def insert_event(self, *,
      title=None, start_date=None, end_date=None, time=None, description=None,
      location=None, gps=None, gps_location=None, category=None, color=None, creator_id=None):

    # Note 1: the keys insertion order in the dictionary is important and allow the use of
    # new_event.values() whose element order shall match the sqlite insertion command
    # Note 2: there is no check in sqlite the the foreign key reference (i.e. creator_id) exists unless a specific
    # pragma is set upon each connection to the db.
    new_event = {
        'title': title,
        'start_date': start_date,
        'end_date': end_date,  # When None means = start_date (full day event)
        'time': time,
        'description': description,
        'location': location,
        'gps': gps,
        'gps_location': gps_location,
        'category': category,
        'color': color,
        'creator_id': creator_id
    }

    insert_event = """INSERT INTO events(title,start_date,end_date,time,description,location,gps,gps_location,category,color,creator_id)
                    VALUES(?,?,?,?,?,?,?,?,?,?,?)"""

    db, cursor = self._connect()
    cursor.execute(insert_event, tuple(new_event.values()))
    db.commit()

    return cursor.lastrowid

  def get_event(self, event_id):
    db, cursor = self._connect()
    get_event = """SELECT * FROM events WHERE id=?"""
    cursor.execute(get_event, (event_id,))
    return cursor.fetchone()

  # Update an event in the database
  # Force use of keyworded arguments to prevent from field mismatch and interface incompatibility
  def update_event(self, event_id, *,
      title=None, start_date=None, end_date=None, time=None, description=None,
      location=None, gps=None, gps_location=None, category=None, color=None):
    fields_to_update = {
        'title': title,
        'start_date': start_date,
        'end_date': end_date,  # When None means = start_date (full day event)
        'time': time,
        'description': description,
        'location': location,
        'gps': gps,
        'gps_location': gps_location,
        'category': category,
        'color': color
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
      cursor.execute(update_event, tuple(fields_to_update.values()))
      db.commit()

  def delete_event(self, event_id):
    db, cursor = self._connect()
    get_event = "DELETE FROM events WHERE id=?"
    cursor.execute(get_event, (event_id,))
    db.commit()

  def get_event_list(self, year_to_list):
    db, cursor = self._connect()
    get_event = "SELECT * FROM events WHERE strftime('%Y', start_date)=?"
    cursor.execute(get_event, (str(year_to_list),))
    return cursor.fetchall()