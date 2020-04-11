import sqlite3
import datetime


create_table_users = """CREATE TABLE IF NOT EXISTS users (
                            id integer PRIMARY KEY,
                            email text NOT NULL,
                            pseudo text NOT NULL,
                            password text NOT NULL,
                            phone text,
                            status text NOT NULL
                        );"""
# TODO: The email shall be the primary key instead of the id ???

# user status can be:
# REG_PEND for registration pending
# REGISTERED
# INACTIVE when its account has been deleted

create_table_events = """CREATE TABLE IF NOT EXISTS events (
                             id integer PRIMARY KEY,
                             title text NOT NULL,
                             location text,
                             start_date text NOT NULL,
                             end_date text,
                             description text,
                             status text,
                             creator text NOT NULL,
                             creator_id integer NOT NULL,
                             FOREIGN KEY (creator_id) REFERENCES users(id)
                         );"""

# event status can be:
# CANCELLED then not modifiable any longer
# NULL for a valid event


create_table_messages = """CREATE TABLE IF NOT EXISTS messages (
                             id integer PRIMARY KEY,
                             text text NOT NULL,
                             time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                             edited text,
                             author text NOT NULL,
                             author_id integer NOT NULL,
                             event_id integer NOT NULL,
                             FOREIGN KEY (author_id) REFERENCES users(id)
                             FOREIGN KEY (event_id) REFERENCES events(id)
                         );"""
# message edited can be:
# TRUE when the message has been edited
# NULL when not edited


def _dict_factory(cursor, row):
    d = {}
    for idx, col in enumerate(cursor.description):
        d[col[0]] = row[idx]
    return d


class EventsDb(object):
    def __init__(self, db_file):
        self.db_file = db_file

        db = self._connect()
        cursor = db.cursor()
        cursor.execute("PRAGMA foreign_keys = ON")
        cursor.execute(create_table_users)
        # Insert a default user
        cursor.execute('SELECT * FROM users')
        if cursor.fetchone() is None:
            cursor.execute("""INSERT INTO users(email,pseudo,password,phone,status)
                        VALUES('root','default_user','toto',01234,'REGISTERED')""")
            print("Default user id: %d" % cursor.lastrowid)

        cursor.execute(create_table_events)
        cursor.execute(create_table_messages)
        db.commit()

    def _connect(self):
        db = sqlite3.connect(self.db_file)

        if db is None:
            raise Exception("Can not connect to database")
        return db

    def insert_user(self, *, email=None, pseudo=None, password=None, phone=None):
        """Insert a user in the database. Force use of keyworded arguments to prevent from field mismatch and
        interface incompatibility"""
        # Note that the keys insertion order in the dictionary is important and allow the use of
        # new_user.values() whose element order shall match the sqlite insertion command
        new_user = {
            'email': email,
            'pseudo': pseudo,
            'password': password,
            'phone': phone,
            'status': 'REGISTERED'
        }

        insert_user = """INSERT INTO users(email,pseudo,password,phone,status)
                        VALUES(?,?,?,?,?)"""

        db = self._connect()
        cursor = db.cursor()
        cursor.execute(insert_user, tuple(new_user.values()))
        db.commit()

        return cursor.lastrowid

    def insert_event(self, *, title=None, location=None, start_date=None, end_date=None,
                     description=None, status=None, creator=None, creator_id=None):
        """Insert an event in the database. Force use of keyworded arguments to prevent from field mismatch and
        interface incompatibility"""
        # Note that the keys insertion order in the dictionary is important and allow the use of
        # new_event.values() whose element order shall match the sqlite insertion command

        # Note: there is no check in sqlite the the foreign key reference (i.e. creator_id) exists unless a specific
        # pragma is set upon each connection to the db.
        new_event = {
            'title': title,
            'location': location,
            'start_date': start_date,
            'end_date': end_date,  # When None means = start_date (full day event)
            'description': description,
            'status': status,
            'creator': creator,
            'creator_id': creator_id,
        }

        insert_event = """INSERT INTO events(title,location,start_date,end_date,description,status,creator,creator_id)
                        VALUES(?,?,?,?,?,?,?,?)"""

        db = self._connect()
        cursor = db.cursor()
        # Foreign keys constraint enforcement shall be enabled upon every connection to DB
        cursor.execute("PRAGMA foreign_keys = ON")
        cursor.execute(insert_event, tuple(new_event.values()))
        db.commit()

        return cursor.lastrowid

    def get_event(self, event_id):
        db = self._connect()
        db.row_factory = _dict_factory
        cursor = db.cursor()

        get_event = """SELECT * FROM events WHERE id=?"""
        cursor.execute(get_event, (event_id,))

        return cursor.fetchone()

    def update_event(self, event_id, *, title=None, location=None, start_date=None, end_date=None,
                     description=None):
        """Update an event in the database. Force use of keyworded arguments to prevent from field mismatch and
                interface incompatibility"""
        fields_to_update = {
            'title': title,
            'location': location,
            'start_date': start_date,
            'end_date': end_date,  # When None means = start_date (full day event)
            'description': description
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

            db = self._connect()
            cursor = db.cursor()
            # Foreign keys constraint enforcement shall be enabled upon every connection to DB
            cursor.execute("PRAGMA foreign_keys = ON")
            cursor.execute(update_event, tuple(fields_to_update.values()))
            db.commit()

    def delete_event(self, event_id):
        """Shall we allow deletion, or only set status to CANCELLED?"""
        db = self._connect()
        db.row_factory = _dict_factory
        cursor = db.cursor()

        get_event = """DELETE FROM events WHERE id=?"""
        cursor.execute(get_event, (event_id,))
        db.commit()

    def get_event_list(self, year_to_list):
        db = self._connect()
        db.row_factory = _dict_factory
        cursor = db.cursor()

        get_event = """SELECT * FROM events WHERE strftime('%Y', start_date)=?"""
        cursor.execute(get_event, (str(year_to_list),))

        return cursor.fetchall()
