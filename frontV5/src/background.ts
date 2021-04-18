export default function background (use_unsplash: boolean, tags: string[]=[], force: boolean=false): void
{
  const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
  const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
  var resolution = vw + "x" + vh;
  var url;
  if (use_unsplash)
  {
    url = `https://source.unsplash.com/featured/${resolution}?${tags.join(',')}`;
  }
  else
  {
    url = `/background/${resolution}`;
  }
  if (force)
  {
    url += (url.includes("?") ? "&" : "?") + "rand=" + new Date().getTime().toString();
  }
  document.body.style.backgroundImage = "url('"+url+"')"
}
