function loadBackground (extraPath)
{
	var vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
	var vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
	var resolution = vw + "x" + vh;
	var url = "/background"+(extraPath?extraPath:"")+"/"+resolution;
	document.body.style.backgroundImage = "url('"+url+"')";
}
