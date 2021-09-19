from PIL import Image, ImageFilter
from io import BytesIO as StringIO
import os

FIT = 'fit'
CROP = 'crop'
PAD = 'pad'
RESHAPE = 'reshape'
ALL = (FIT, CROP, PAD, RESHAPE)

class ImageSize(object):

  @property
  def image(self):
    if not self._image and self.path:
      self._image = Image.open(self.path)
    return self._image

  def __init__(self, path=None, image=None, width=None, height=None,
    enlarge=True, mode=None, sharpen=None, _shortcut=False, **kw
  ):

    # Inputs
    self.__dict__.update(kw)
    self.path = path
    self._image = image
    self.req_width = width
    self.req_height = height
    self.enlarge = bool(enlarge)
    self.mode = mode
    self.sharpen = sharpen

    self.image_width = self.image_height = None

    # Results to be updated as appropriate
    self.needs_enlarge = None
    self.width = width
    self.height = height
    self.op_width = None
    self.op_height = None

    if _shortcut and width and height and enlarge and mode in (RESHAPE, CROP, None):
      return

    # Source the original image dimensions
    self.image_width, self.image_height = self.image.size

    # It is possible that no dimensions are even given, so pass it through
    if not (self.width or self.height):
      self.width = self.image_width
      self.height = self.image_height
      return

    # Maintain aspect ratio and scale width
    if not self.height:
      self.needs_enlarge = self.width > self.image_width
      if not self.enlarge:
        self.width = min(self.width, self.image_width)
      self.height = self.image_height * self.width // self.image_width
      return

    # Maintain aspect ratio and scale height
    if not self.width:
      self.needs_enlarge = self.height > self.image_height
      if not self.enlarge:
        self.height = min(self.height, self.image_height)
      self.width = self.image_width * self.height // self.image_height
      return

    # Don't maintain aspect ratio; enlarging is sloppy here
    if self.mode in (RESHAPE, None):
      self.needs_enlarge = self.width > self.image_width or self.height > self.image_height
      if not self.enlarge:
        self.width = min(self.width, self.image_width)
        self.height = min(self.height, self.image_height)
      return

    if self.mode not in (FIT, CROP, PAD):
      raise ValueError('unknown mode %r' % self.mode)

    # This effectively gives us the dimensions of scaling to fit within or
    # around the requested size. These are always scaled to fit.
    fit, pre_crop = sorted([
      (self.req_width, self.image_height * self.req_width // self.image_width),
      (self.image_width * self.req_height // self.image_height, self.req_height)
    ])

    self.op_width, self.op_height = fit if self.mode in (FIT, PAD) else pre_crop
    self.needs_enlarge = self.op_width > self.image_width or self.op_height > self.image_height

    if self.needs_enlarge and not self.enlarge:
      self.op_width = min(self.op_width, self.image_width)
      self.op_height = min(self.op_height, self.image_height)
      if self.mode != PAD:
        self.width = min(self.width, self.image_width)
        self.height = min(self.height, self.image_height)
      return

    if self.mode != PAD:
      self.width = min(self.op_width, self.width)
      self.height = min(self.op_height, self.height)


def resize(image, background=None, **kw):
  size = ImageSize(image=image, **kw)

  # Get into the right colour space
  colorspace = image.mode.upper()
  if not colorspace.startswith('RGB'):
    image = image.convert('RGBA')

  # Handle the easy cases
  if size.mode in (RESHAPE, None) or size.req_width is None or size.req_height is None:
    return image.resize((size.width, size.height), Image.ANTIALIAS)

  if size.mode not in (FIT, PAD, CROP):
    raise ValueError('unknown mode %r' % size.mode)

  if image.size != (size.op_width, size.op_height):
    image = image.resize((size.op_width, size.op_height), Image.ANTIALIAS)

  if size.mode == FIT:
    return image
  elif size.mode == PAD:
    pad_color = str(background or 'black')
    padded = Image.new(colorspace, (size.width, size.height), pad_color)
    padded.paste(image, (
      (size.width  - size.op_width ) // 2,
      (size.height - size.op_height) // 2
    ))
    return padded
  elif size.mode == CROP:
    dx = (size.op_width  - size.width ) // 2
    dy = (size.op_height - size.height) // 2
    return image.crop(
      (dx, dy, dx + size.width, dy + size.height)
    )
  else:
    raise RuntimeError('unhandled mode %r' % size.mode)


def post_process(image, sharpen=None):
  if sharpen:
    assert len(sharpen) == 3, 'unsharp-mask has 3 parameters'
    image = image.filter(ImageFilter.UnsharpMask(
      float(sharpen[0]),
      int(sharpen[1]),
      int(sharpen[2]),
    ))
  return image


def resize_image(path, dest_path, width=None, height=None, quality=90,
  enlarge=False, sharpen=None, format=None, mode='crop', background='white'):

  try:
    image = Image.open(path)
    image = resize(image,
      background=background,
      enlarge=enlarge,
      height=height,
      mode=mode,
      width=width,
    )
  except Exception as exception:
    params = 'width={} height={} filename={} quality={} enlarge={} sharpen={} format={} mode={} background={}'.format(
      width,
      height,
      os.path.basename(path),
      quality,
      enlarge,
      sharpen,
      format,
      mode,
      background
    )
    raise Exception('Resize image exception', params, exception)
  sharpen = re.split(r'[+:;,_/ ]', sharpen) if sharpen else None
  image = post_process(image, sharpen=sharpen)

  format = (format or os.path.splitext(path)[1][1:] or 'jpeg').lower()
  format = {'jpg' : 'jpeg'}.get(format, format)

  dest_file = open(dest_path, 'wb')
  image.save(dest_file, format, quality=quality)
  dest_file.close()

