import settings from './settings';
import get_connected_user from './user';

export function getColorConf (): ColorConfiguration
{
	var theme = getTheme();
	var colorConf;
	if (Object.prototype.hasOwnProperty.call(settings.categories, theme))
	{
		colorConf = settings.categories[theme];
	}
	else
	{
		colorConf = settings.categories.default;
	}
	return colorConf;
}

export function getColor (category: string): string
{
	return getColorConf()[category];
}

function getTheme (): string
{
	var user = get_connected_user();
	if (user)
	{
		return user.theme;
	}
	else // ex: home page unauthenticated
	{
		var theme = settings.default_theme;
		var styles = Array.from(document.head.querySelectorAll('link'));
		var themeCSS = styles.map((x:HTMLLinkElement) => x.href).filter((x:string) => x.includes('/css/theme/'))[0];
		if (themeCSS)
		{
			var themeFilename = themeCSS.split('/').pop();
			if (themeFilename)
			{
				theme = themeFilename.split('.')[0];
			}
		}
		return theme;
	}
}
