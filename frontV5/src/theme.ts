import settings from './settings';
import get_connected_user from './user';

export function getColorConf (): object
{
	var theme = getTheme();
	var colorConf;
	if (settings.categories.hasOwnProperty(theme))
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
	return get_connected_user().theme;
}
