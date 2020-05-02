import datetime
import settings
from flask_bcrypt import Bcrypt

bcrypt = Bcrypt()

def insert_user(self, *,
    firstname=None, lastname=None, email=None, password=None, share_email=False, phone=None, share_phone=False, theme=settings.default_theme):
  """Insert a user in the database
  Force use of keyworded arguments to prevent from field mismatch and interface incompatibility"""

  pw_hash = bcrypt.generate_password_hash(password).decode()

  new_user = {
    'firstname': firstname,
    'lastname': lastname,
    'email': email,
    'password': pw_hash,
    'share_email': share_email,
    'phone': phone,
    'share_phone': share_phone,
    'theme': theme,
    'role': 'new', # to be approved -> user
    'creation_datetime': datetime.datetime.utcnow().isoformat()+'Z'
  }
  columns = ','.join(tuple(new_user))
  questions = ','.join(['?' for x in new_user])
  insert_user = """
    INSERT INTO users(%s)
    VALUES(%s)""" % (columns,questions)

  db, cursor = self._connect()
  try:
    cursor.execute(insert_user, tuple(new_user.values()))
    db.commit()
    new_user['id'] = cursor.lastrowid
  finally:
    db.close()
  return new_user

def get_user(self, user_id=None, email=None):
  """Fetch a specific user from database"""
  db, cursor = self._connect()
  try:
    if user_id is not None:
      get_user = """SELECT * FROM users WHERE id=?"""
      cursor.execute(get_user, (user_id,))
    else:
      get_user = """SELECT * FROM users WHERE email=?"""
      cursor.execute(get_user, (email,))
    return cursor.fetchone()
  finally:
    db.close()

def list_users(self, only_admins=False):
  """Fetch all approved users from database"""
  db, cursor = self._connect()
  try:
    list_users = """
      SELECT id,firstname,lastname,email
      FROM users
      WHERE role IS NOT NULL and role!='new'
    """
    if only_admins:
      list_users += " AND role='admin'"
    cursor.execute(list_users)
    return cursor.fetchall()
  finally:
    db.close()

def update_user(self, user_id, *,
    firstname=None, lastname=None, email=None, password=None, share_email=None, phone=None, share_phone=None, theme=None):
  """Update a user in the database
  Force use of keyworded arguments to prevent from field mismatch and interface incompatibility"""

  if password is None:
    pw_hash = None
  else:
    pw_hash = bcrypt.generate_password_hash(password).decode()

  fields_to_update = {
    'firstname': firstname,
    'lastname': lastname,
    'email': email,
    'password': pw_hash,
    'share_email': share_email,
    'phone': phone,
    'share_phone': share_phone,
    'theme': theme
  }

  # Delete keys whose value is None
  fields_to_update = {k: v for k, v in fields_to_update.items() if v is not None}

  if not len(fields_to_update) == 0:
    # Build the update sql command
    update_user = "UPDATE users SET "
    for k in fields_to_update.keys():
        update_user += k + "=?,"
    # Remove trailing column
    update_user = update_user.rstrip(',')
    update_user += " WHERE id=?"

    # Add id to the fields dictionary. Note that the insertion order is important
    fields_to_update['id'] = user_id

    db, cursor = self._connect()
    try:
      cursor.execute(update_user, tuple(fields_to_update.values()))
      db.commit()
    finally:
      db.close()
  return fields_to_update

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

def update_user_role(self, user_id, role, previous_role=None):
  """Update a user role in the database"""
  update_role = "UPDATE users SET role=? WHERE id=?"
  values = (role, user_id)
  if previous_role:
    update_role += " AND role=?"
    values = (role, user_id, previous_role)
  db, cursor = self._connect()
  try:
    cursor.execute(update_role, values)
    db.commit()
    return cursor.rowcount
  finally:
    db.close()
