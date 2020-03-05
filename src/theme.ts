var theme;
document.addEventListener('DOMContentLoaded', function()
{
	var themeSelector = <HTMLSelectElement>document.getElementById('themeSelector');

	var favoriteTheme = GetThemeCookie();
	if (favoriteTheme)
	{
		var options = themeSelector.options;
		for (var i = 0; i < options.length; ++i)
		{
			var option = options[i];
			option.selected = false;
			option.removeAttribute('selected');
			if (option.value === favoriteTheme)
			{
				option.selected = true;
				option.setAttribute('selected', 'selected');
			}
		}
	}

	themeSelector.addEventListener('change', function()
	{
		SetTheme(this.value);
	});

	SetTheme(favoriteTheme || themeSelector.value);

	var currentStylesheet;
	function SetTheme(themeName)
	{
		var stylesheetUrl = "css/theme/"+themeName+".bootstrap.min.css";

		var link = document.createElement('link');
		link.setAttribute('rel', 'stylesheet');
		link.setAttribute('href', stylesheetUrl);
		document.head.appendChild(link);

		WhenStylesheetLoaded(link, function()
		{
			if (currentStylesheet)
			{
				document.head.removeChild(currentStylesheet);
			}
			currentStylesheet = link;

			var date = new Date();
			var nbDays = 400; // cookie expiration
			date.setTime(date.getTime()+(nbDays*24*60*60*1000));
			var expires = "; expires="+date.toUTCString();
			document.cookie = "theme=" + themeName + expires;
			theme = themeName;
		});
	}

	function GetThemeCookie()
	{
		return document.cookie.replace(/(?:(?:^|.*;\s*)theme\s*\=\s*([^;]*).*$)|^.*$/, "$1");
	}

	function WhenStylesheetLoaded(linkNode, callback)
	{
		var isReady = false;
		function ready()
		{
			if (!isReady)
			{
				// avoid double-call
				isReady = true;
				callback();
			}
		}

		linkNode.onload = ready; // does not work cross-browser
		setTimeout(ready, 2000); // max wait. also handles browsers that don't support onload
	}
});
export default theme;