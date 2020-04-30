import random
import string
import settings
from image import generate_miniature

def generate_miniatures(path, user_id):
  user_id = str(user_id)
  # 130
  dest_path = settings.avatars_folder+'/'+user_id+'-130.jpg'
  generate_miniature(path, dest_path, format='jpg', width=130, height=130, enlarge=True)

  # 40
  dest_path = settings.avatars_folder+'/'+user_id+'-40.jpg'
  generate_miniature(path, dest_path, format='jpg', width=40, height=40, enlarge=True)

def remove_miniatures(user_id):
  user_id = str(user_id)
  dest_path = settings.avatars_folder+'/'+user_id+'-130.jpg'
  try:
    os.remove(dest_path)
  except:
    pass
  dest_path = settings.avatars_folder+'/'+user_id+'-40.jpg'
  try:
    os.remove(dest_path)
  except:
    pass

def randomString(stringLength=8):
  letters = string.ascii_lowercase
  return ''.join(random.choice(letters) for i in range(stringLength))
