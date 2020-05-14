export default function unsplash (tags?)
{
  const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
  const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
  var resolution = vw + "x" + vh;
  // var url = `https://source.unsplash.com/featured/${resolution}?${tags.join(',')}`;
  var url = `/background/${resolution}`;
  document.body.style.backgroundImage = "url('"+url+"')"
}

function unsplashL ()
{
  window.addEventListener('load', unsplash);
}

(<any>window).unsplashL = unsplashL;
