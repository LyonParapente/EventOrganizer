import random
import string

def randomString(stringLength=8):
  letters = string.ascii_lowercase
  return ''.join(random.choice(letters) for i in range(stringLength))
