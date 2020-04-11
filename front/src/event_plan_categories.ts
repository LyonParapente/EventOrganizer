import settings from './settings';
import GetTheme from './theme';
import { i18n } from './trads';

export function init_categories (): void
{
	var category_dd = document.getElementById("sortie_categories");
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
			category_dd.appendChild(a);
		}
	}

	var sortie_category = document.getElementById("sortie_category");
	category_dd.parentElement.addEventListener("click", function (evt)
	{
		var node = <HTMLElement>evt.target;
		if (node.nodeName !== 'A')
		{
			if (node.id !== 'sortie_color_btn')
			{
				evt.stopPropagation();
			}
			return;
		}

		var cloneBadge = node.cloneNode(true) as HTMLElement;
		sortie_category.innerHTML = '';
		if (cloneBadge.classList.contains("badge"))
		{
			cloneBadge.classList.remove(...badges_spacing.split(' '));
			sortie_category.appendChild(cloneBadge);
		}
		else
		{
			sortie_category.textContent = i18n("None");
		}
	});
}

function getColorConf (): object
{
	var theme = GetTheme();
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