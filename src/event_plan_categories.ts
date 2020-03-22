import settings from './settings';
import theme from './theme';
import { i18n } from './trads';

export function init_categories (): void
{
	var $category_dd = $("#sortie_categories");
	var badges_spacing = "ml-2 mb-2";
	var colorConf = getColorConf();
	for (var category in colorConf)
	{
		if (colorConf.hasOwnProperty(category))
		{
			var a = document.createElement('a');
			a.className = "badge " + badges_spacing;
			a.style.backgroundColor = getColor(category);
			a.style.color = 'white';
			a.href = "javascript:;";
			a.appendChild(document.createTextNode(category));
			$category_dd.append(a);
		}
	}
	var $sortie_category = $("#sortie_category");
	$category_dd.parent().on("click", "a", function ()
	{
		var $cloneBadge = $(this).clone();
		$sortie_category.empty();
		if ($cloneBadge.hasClass("badge"))
		{
			$cloneBadge.removeClass(badges_spacing);
			$sortie_category.append($cloneBadge);
		}
		else
		{
			$sortie_category.text(i18n("None"));
		}
	});
}

function getColorConf (): object
{
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
