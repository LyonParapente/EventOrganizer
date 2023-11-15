import datetime
import settings
from helper import randomString, get_datetime_from_str
from flask_bcrypt import Bcrypt

bcrypt = Bcrypt()

def insert_user(self, *,
    firstname=None, lastname=None, email=None, password=None, share_email=False, phone=None, share_phone=False, has_whatsapp=False, theme=settings.default_theme, wing=None, presentation=None,
    notif_new_event=True, notif_event_change=True, notif_tomorrow_events=True):
  """Insert a user in the database
  Force use of keyworded arguments to prevent from field mismatch and interface incompatibility"""

  pw_hash = bcrypt.generate_password_hash(password).decode()
  now = datetime.datetime.utcnow()
  now_aware = now.replace(tzinfo=datetime.timezone.utc)

  new_user = {
    'firstname': firstname,
    'lastname': lastname,
    'email': email.lower(),
    'password': pw_hash,
    'share_email': share_email,
    'phone': phone,
    'share_phone': share_phone,
    'has_whatsapp': has_whatsapp,
    'theme': theme,
    'role': 'new', # to be approved -> user|temporary,
    'notif_new_event': notif_new_event,
    'notif_event_change': notif_event_change,
    'notif_tomorrow_events': notif_tomorrow_events,
    'wing': wing,
    'presentation': presentation,
    'creation_datetime': now.isoformat()+'Z'
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

  new_user['creation_datetime'] = now_aware # need datetime object

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
    res = cursor.fetchone()
  finally:
    db.close()

  if res is not None:
    res['creation_datetime'] = get_datetime_from_str(res['creation_datetime'].replace('Z', '+00:00'))
    res['last_login_datetime'] = get_datetime_from_str(res['last_login_datetime'].replace('Z', '+00:00')) if res.get('last_login_datetime') is not None else None
  return res

def list_users(self, include_new_and_expired=False, only_admins=False,
    notif_new_event=False, notif_event_change=False, notif_tomorrow_events=False):
  """Fetch all approved users from database"""
  db, cursor = self._connect()
  try:
    list_users = """
      SELECT id,firstname,lastname,email,role,creation_datetime,last_login_datetime
        notif_new_event,notif_event_change,notif_tomorrow_events
      FROM users
      WHERE role IS NOT NULL AND role!='deleted'
    """
    if not include_new_and_expired:
      list_users += " AND role!='new' AND role!='expired'"
    if only_admins:
      list_users += " AND role='admin'"
    if notif_new_event:
      list_users += " AND notif_new_event=1"
    if notif_event_change:
      list_users += " AND notif_event_change=1"
    if notif_tomorrow_events:
      list_users += " AND notif_tomorrow_events=1"

    cursor.execute(list_users)
    res = cursor.fetchall()

    for user in res:
      user['creation_datetime'] = get_datetime_from_str(user['creation_datetime'].replace('Z', '+00:00'))
      user['last_login_datetime'] = get_datetime_from_str(user['last_login_datetime'].replace('Z', '+00:00')) if user.get('last_login_datetime') is not None else None
    return res
  finally:
    db.close()

def update_user(self, user_id, *,
    firstname=None, lastname=None, email=None, password=None, share_email=None, phone=None, share_phone=None, has_whatsapp=None, theme=None, wing=None,
    presentation=None,
    notif_new_event=None, notif_event_change=None, notif_tomorrow_events=None):
  """Update a user in the database
  Force use of keyworded arguments to prevent from field mismatch and interface incompatibility"""

  if password is None:
    pw_hash = None
  else:
    pw_hash = bcrypt.generate_password_hash(password).decode()

  if email is not None:
    email = email.lower()

  fields_to_update = {
    'firstname': firstname,
    'lastname': lastname,
    'email': email,
    'password': pw_hash,
    'share_email': share_email,
    'phone': phone,
    'share_phone': share_phone,
    'has_whatsapp': has_whatsapp,
    'theme': theme,
    'notif_new_event': notif_new_event,
    'notif_event_change': notif_event_change,
    'notif_tomorrow_events': notif_tomorrow_events,
    'wing': wing,
    'presentation': presentation,
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

def update_last_login_datetime(self, user_id):
  now = datetime.datetime.utcnow().isoformat()+'Z'
  db, cursor = self._connect()
  update_user = "UPDATE users SET last_login_datetime=? WHERE id=?"
  try:
    cursor.execute(update_user, (now, user_id))
    db.commit()
    return cursor.rowcount
  finally:
    db.close()

def set_password_lost(self, user_id, empty=False):
  db, cursor = self._connect()
  if empty:
    token = None
  else:
    randStr = randomString(stringLength=12)
    token = bcrypt.generate_password_hash(randStr).decode()
  update_user = "UPDATE users SET password_lost=? WHERE id=?"
  try:
    cursor.execute(update_user, (token, user_id))
    db.commit()
    return token if cursor.rowcount==1 else None
  finally:
    db.close()

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
    if previous_role == 'expired' and role == 'temporary':
      # Reset temporary account so that it keeps working for the next settings.temporary_user_duration
      update_role = "UPDATE users SET role=?,creation_datetime=? WHERE id=? AND role=?"
      now = datetime.datetime.utcnow()
      values = (role, now.isoformat()+'Z', user_id, previous_role)
    else:
      update_role = "UPDATE users SET role=? WHERE id=? AND role=?"
      values = (role, user_id, previous_role)

  db, cursor = self._connect()
  try:
    cursor.execute(update_role, values)
    db.commit()
    return cursor.rowcount
  finally:
    db.close()


def list_users_by_score(self, include_new_and_expired=False):
  """Fetch all users and sort them by activity score (created event = 10; participation = 5; interested = 2; comment = 1) on the last 12 months """
  db, cursor = self._connect()
  try:
    extra_filter = ""
    if not include_new_and_expired:
      extra_filter = " AND role!='new' AND role!='expired'"

    look_back = "-12 months"
    list_users = f"""
      SELECT id, firstname, lastname, email, role, creation_datetime, last_login_datetime,
        nb_created_events, nb_participations, nb_interests, nb_comments,
        (nb_created_events*10 + nb_participations*5 + nb_interests*2 + nb_comments) AS score
      FROM
      users LEFT JOIN
      (
        SELECT uid,
          SUM(nb_created_events) AS nb_created_events,
          SUM(nb_interests) AS nb_interests,
          SUM(nb_participations) AS nb_participations,
          SUM(nb_comments) AS nb_comments
        FROM (
          -- Events created by
          SELECT creator_id AS uid, COUNT(*) AS nb_created_events, 0 AS nb_interests, 0 AS nb_participations, 0 as nb_comments
          FROM events
          WHERE start_date>=date('now', '{look_back}')
          AND start_date<date('now')
          GROUP BY creator_id

          UNION ALL

          -- Number of participations and interests by user
          SELECT user_id AS uid, 0, SUM(IIF(interest == 1, 1, 0)) AS nb_interests, SUM(IIF(interest == 2, 1, 0)) AS nb_participations, 0
          FROM events_registrations, events
          WHERE events_registrations.event_id = events.id
          AND start_date>=date('now', '{look_back}')
          AND start_date<date('now')
          GROUP BY user_id

          UNION ALL

          -- Number of comments per user
          SELECT author_id AS uid, 0, 0, 0, COUNT(*) AS nb_comments
          FROM messages, events
          WHERE messages.event_id = events.id
          AND start_date>=date('now', '{look_back}')
          AND start_date<date('now')
          GROUP BY author_id
        )
        GROUP BY uid
      ) AS metrics ON users.id=metrics.uid
      WHERE role IS NOT NULL AND role!='deleted'
      {extra_filter}
      GROUP BY users.id
      ORDER BY score DESC
    """

    cursor.execute(list_users)
    res = cursor.fetchall()

    for user in res:
      user['creation_datetime'] = get_datetime_from_str(user['creation_datetime'].replace('Z', '+00:00'))
      user['last_login_datetime'] = get_datetime_from_str(user['last_login_datetime'].replace('Z', '+00:00')) if user.get('last_login_datetime') is not None else None

    return res
  finally:
    db.close()
