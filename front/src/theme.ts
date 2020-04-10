var theme;
export default function GetTheme ()
{
	return theme;
}

document.addEventListener('DOMContentLoaded', function ()
{
	var themeSelector = <HTMLSelectElement>document.getElementById('themeSelector');
	SelectFavoriteTheme(themeSelector);
	theme = themeSelector.value;

	SetTheme(theme);

	themeSelector.addEventListener('change', function ()
	{
		SetTheme(this.value);
	});
});



interface FavoriteTheme
{
	theme: string;
	lastModified: number;
}
const localStorage_key = 'theme';

function GetFavoriteTheme (): FavoriteTheme
{
	try
	{
		return JSON.parse(localStorage.getItem(localStorage_key));
	}
	catch(e)
	{
		localStorage.removeItem(localStorage_key);
	}
}

function SelectFavoriteTheme (themeSelector: HTMLSelectElement): void
{
	var favorite = GetFavoriteTheme();
	if (favorite)
	{
		var options = themeSelector.options;
		for (var i = 0; i < options.length; ++i)
		{
			var option = options[i];
			option.selected = false;
			option.removeAttribute('selected');
			if (option.value === favorite.theme)
			{
				option.selected = true;
				option.setAttribute('selected', 'selected');
				return;
			}
		}
	}
}



var currentStylesheet;
function SetTheme (themeName: string): void
{
	var stylesheetUrl = "css/theme/"+themeName+".bootstrap.min.css";

	var link = document.createElement('link');
	link.setAttribute('rel', 'stylesheet');
	link.setAttribute('href', stylesheetUrl);
	document.head.appendChild(link);

	WhenStylesheetLoaded(link, function ()
	{
		if (currentStylesheet)
		{
			document.head.removeChild(currentStylesheet);
		}
		currentStylesheet = link;

		if (theme !== themeName)
		{
			theme = themeName;

			var infos = JSON.stringify({theme: themeName, lastModified: Date.now()});
			localStorage.setItem(localStorage_key, infos);
		}
	});
}

function WhenStylesheetLoaded (linkNode: HTMLLinkElement, callback: () => void): void
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
