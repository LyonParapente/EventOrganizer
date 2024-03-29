import sqlite3

def _dict_factory(cursor, row):
  d = {}
  for idx, col in enumerate(cursor.description):
    d[col[0]] = row[idx]
  return d

class DBManage(object):
  def __init__(self, db_file):
    self.db_file = db_file

    db, cursor = self._connect()
    with open('./database/create_db.sql', 'r') as sql_file:
      cursor.executescript(sql_file.read())

    # Default sequences values
    cursor.execute('SELECT * FROM sqlite_sequence')
    if cursor.fetchone() is None:
      cursor.execute("INSERT INTO sqlite_sequence VALUES('events', 10000)")
      cursor.execute("INSERT INTO sqlite_sequence VALUES('users', 100)")
      cursor.execute("INSERT INTO sqlite_sequence VALUES('events_registrations', 0)")
      cursor.execute("INSERT INTO sqlite_sequence VALUES('messages', 0)")

    cursor.execute('PRAGMA table_info(users)')
    users_columns = [i['name'] for i in cursor.fetchall()]
    # Patch 1
    if 'share_email' not in users_columns:
      print("Applying patch 1")
      with open('./database/patch1.sql', 'r') as sql_file:
        cursor.executescript(sql_file.read())
    # Patch 2
    if 'last_login_datetime' not in users_columns:
      print("Applying patch 2")
      with open('./database/patch2.sql', 'r') as sql_file:
        cursor.executescript(sql_file.read())

    # Save
    db.commit()

  def _connect(self):
    db = sqlite3.connect(self.db_file)
    if db is None:
      raise Exception("Can not connect to database")

    db.row_factory = _dict_factory

    # Trace all sql requests
    #db.set_trace_callback(print)

    cursor = db.cursor()
    # Foreign keys constraint enforcement shall be enabled upon every connection to DB
    cursor.execute("PRAGMA foreign_keys = ON")
    return db, cursor

  from .manage_users import insert_user, get_user, update_user, delete_user, update_user_role, list_users, list_users_by_score, set_password_lost, update_last_login_datetime
  from .manage_events import insert_event, get_event, update_event, delete_event, get_events_list
  from .manage_messages import insert_message, get_last_message, edit_message, get_messages_list
  from .manage_registration import set_registration, get_registration, delete_registration
  from .manage_notifications_blocklist import set_notifications_blocklist, list_notifications_blocklist, delete_notifications_blocklist

db = None
def init(db_filepath):
  global db
  db = DBManage(db_filepath)
