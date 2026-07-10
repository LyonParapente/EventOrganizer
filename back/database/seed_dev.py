"""Seed the database with development data.

Idempotent: does nothing if at least one user already exists.
Run from the back/ folder: python -m database.seed_dev
NEVER run this in production (it creates accounts with known passwords).
"""
import datetime

import settings
import database.manager


def seed():
  database.manager.init(settings.db_filepath)
  db = database.manager.db

  if db.list_users(include_new_and_expired=True):
    print("Seed: users already exist, nothing to do")
    return

  print("Seed: inserting development data into " + settings.db_filepath)

  admin = db.insert_user(firstname='Admin', lastname='Dev',
    email='admin@example.com', password='admin1234',
    phone='+33600000001', share_phone=True, wing='Advance Alpha',
    presentation="Compte administrateur de développement.")
  db.update_user_role(admin['id'], 'admin')

  marie = db.insert_user(firstname='Marie', lastname='Dupont',
    email='marie@example.com', password='marie1234',
    phone='+33600000002', share_phone=True, has_whatsapp=True, wing='Ozone Rush 6',
    presentation="Je vole depuis 5 ans, plutôt cross.")
  db.update_user_role(marie['id'], 'user')

  paul = db.insert_user(firstname='Paul', lastname='Martin',
    email='paul@example.com', password='paul1234',
    phone='+33600000003', wing='Nova Mentor 7',
    presentation="Pilote du dimanche, toujours partant.")
  db.update_user_role(paul['id'], 'user')

  # A pending registration, to exercise the admin approval flow
  db.insert_user(firstname='Jeanne', lastname='Nouvelle',
    email='jeanne@example.com', password='jeanne1234',
    presentation="Je viens de finir mon stage init !")

  today = datetime.date.today()
  def day(offset):
    return (today + datetime.timedelta(days=offset)).isoformat()

  past = db.insert_event(title='Sortie Semnoz', start_date=day(-7),
    time='9h30', location='Semnoz, Annecy', gps='45.7960, 6.1000',
    gps_location='Décollage du Semnoz',
    description="Session **soaring** au Semnoz, débrief au café ensuite.",
    creator_id=marie['id'])
  db.set_registration(event_id=past['id'], user_id=marie['id'], interest=2)
  db.set_registration(event_id=past['id'], user_id=paul['id'], interest=2)
  db.insert_message(event_id=past['id'], author_id=paul['id'],
    comment="Super journée, merci pour l'orga !")

  soon = db.insert_event(title='Vol du soir à Planfait', start_date=day(2),
    time='17h30', location='Planfait, Talloires', gps='45.8420, 6.2140',
    gps_location='Décollage de Planfait',
    description="Vol tranquille en fin de journée, *conditions douces*.\n\nCovoiturage possible depuis Lyon.",
    creator_id=admin['id'])
  db.set_registration(event_id=soon['id'], user_id=admin['id'], interest=2)
  db.set_registration(event_id=soon['id'], user_id=marie['id'], interest=1)
  db.insert_message(event_id=soon['id'], author_id=marie['id'],
    comment="Je serai peut-être en retard, gardez-moi une place !")
  db.insert_message(event_id=soon['id'], author_id=admin['id'],
    comment="Pas de souci, on décolle vers 18h.")

  week_end = db.insert_event(title='Week-end à Saint-Hilaire', start_date=day(9),
    end_date=day(10), time='8h00', location='Saint-Hilaire du Touvet',
    description="Deux jours de vol, nuit au camping. Niveau **brevet de pilote** minimum.",
    color='#FF6FFF', creator_id=marie['id'])
  db.set_registration(event_id=week_end['id'], user_id=paul['id'], interest=2)

  db.insert_event(title='Soirée sécurité : la météo en montagne', start_date=day(15),
    time='20h00', location='Local du club, Lyon', category='conférence',
    description="Intervention d'un météorologue, ouverte à tous les membres.",
    creator_id=admin['id'])

  print("Seed: done (admin@example.com / admin1234)")


if __name__ == '__main__':
  seed()
