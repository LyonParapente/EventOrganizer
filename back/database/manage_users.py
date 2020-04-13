import datetime

def insert_user(self, *,
    firstname=None, lastname=None, email=None, password=None, share_email=False, phone=None, share_phone=False):
  """Insert a user in the database
  Force use of keyworded arguments to prevent from field mismatch and interface incompatibility"""

  new_user = {
    'firstname': firstname,
    'lastname': lastname,
    'email': email,
    'password': password,
    'share_email': 1 if share_email else 0,
    'phone': phone,
    'share_phone': 1 if share_phone else 0,
    'creation_datetime': datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
  }
  columns = ','.join(tuple(new_user))
  questions = ','.join(['?' for x in new_user])
  insert_user = """INSERT INTO users(%s)
                  VALUES(%s)"""%(columns,questions)

  db, cursor = self._connect()
  try:
    cursor.execute(insert_user, tuple(new_user.values()))
    db.commit()
    new_user['id'] = cursor.lastrowid
  finally:
    db.close()
  return new_user

def get_user(self, user_id):
  """Fetch a specific user from database"""
  db, cursor = self._connect()
  get_user = """SELECT * FROM users WHERE id=?"""
  try:
    cursor.execute(get_user, (user_id,))
    return cursor.fetchone()
  finally:
    db.close()

def update_user(self, user_id, *,
    firstname=None, lastname=None, email=None, password=None, share_email=None, phone=None, share_phone=None):
  """Update a user in the database
  Force use of keyworded arguments to prevent from field mismatch and interface incompatibility"""

  fields_to_update = {
    'firstname': firstname,
    'lastname': lastname,
    'email': email,
    'password': password,
    'share_email': share_email,
    'phone': phone,
    'share_phone': share_phone
  }

  # Delete keys whose value is None
  fields_to_update = {k: v for k, v in fields_to_update.items() if v is not None}

  if not len(fields_to_update) == 0:
    # Build the update sql command
    update_event = "UPDATE users SET "
    for k in fields_to_update.keys():
        update_event += k + "=?,"
    # Remove trailing column
    update_event = update_event.rstrip(',')
    update_event += " WHERE id=?"

    # Add id to the fields dictionary. Note that the insertion order is important
    fields_to_update['id'] = user_id

    db, cursor = self._connect()
    try:
      cursor.execute(update_event, tuple(fields_to_update.values()))
      db.commit()
      return cursor.rowcount
    finally:
      db.close()
  return 0

def delete_user(self, user_id):
  """Delete a specific user from database"""
  db, cursor = self._connect()
  del_user = "DELETE FROM users WHERE id=?"
  try:
    cursor.execute(del_user, (user_id,))
    db.commit()
    return cursor.rowcount
  finally:
    db.close()
