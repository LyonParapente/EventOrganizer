export default function unsplash (tags)
{
  var tags = tags.join(',');
  const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
  const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
  var resolution = vw + "x" + vh;
  var url = `https://source.unsplash.com/featured/${resolution}?${tags}`;

  document.body.style.backgroundImage = "url('"+url+"')"
}
(<any>window).unsplash = unsplash;
