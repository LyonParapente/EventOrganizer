export function background (use_unsplash: boolean, tags: string[]=[], force=false): void
{
	const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
	const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0, document.body.scrollHeight);
	var resolution = `${vw}x${vh}`;
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
	document.body.style.backgroundImage = "url('"+url+"')";
}

export function setBackgroundColor (calendarEl: HTMLElement)
{
	var container = calendarEl.querySelector(".fc-view-harness") as HTMLElement;
	container.classList.add('bg-secondary');

	// alpha according to theme
	var color = getComputedStyle(container)['backgroundColor'];
	var color_alpha = "rgba("+color.substring(4,color.length-1)+", 0.3)";
	container.style.backgroundColor = color_alpha;
	container.classList.remove('bg-secondary');
}
