export default function unsplash (tags=[], extraPath='')
{
  const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
  const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
  var resolution = vw + "x" + vh;
  // var url = `https://source.unsplash.com/featured/${resolution}?${tags.join(',')}`;
  var url = `/background${extraPath}/${resolution}`;
  document.body.style.backgroundImage = "url('"+url+"')"
}

function unsplashL ()
{
  window.addEventListener('load', x => unsplash());
}

(<any>window).unsplashL = unsplashL;
