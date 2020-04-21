var background_img = null;

export default function unsplash (tags)
{
  var tags = tags.join(',');
  const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
  const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
  var resolution = vw + "x" + vh;
  var url = `https://source.unsplash.com/featured/${resolution}?${tags}`;

  if (background_img)
  {
    window.URL.revokeObjectURL(background_img.src);
    document.body.removeChild(background_img);
  }
  background_img = new Image();
  background_img.id = 'unsplash';
  background_img.src = url;
  document.body.insertBefore(background_img, document.body.firstChild);
}
(<any>window).unsplash = unsplash;
