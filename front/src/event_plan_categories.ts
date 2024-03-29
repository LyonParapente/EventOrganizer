import { getColor, getColorConf } from './theme';
import { i18n } from './trads';

export function create_category_badge (category: string, extraCSS?: string): HTMLElement
{
	var a = document.createElement('a');
	a.className = "badge " + (extraCSS||'');
	a.style.backgroundColor = getColor(category);
	a.style.color = 'white';
	a.href = "javascript:;";
	a.appendChild(document.createTextNode(category));
	return a;
}

export function init_categories (): void
{
	var category_dd = document.getElementById("sortie_categories") as HTMLElement;
	var badges_spacing = "ml-2 mb-2";
	var colorConf = getColorConf();
	for (var category in colorConf)
	{
		if (Object.prototype.hasOwnProperty.call(colorConf, category))
		{
			var badge = create_category_badge(category, badges_spacing);
			category_dd.appendChild(badge);
		}
	}

	var sortie_category = document.getElementById("sortie_category") as HTMLButtonElement;
	(category_dd.parentElement as HTMLElement).addEventListener("click", function (evt)
	{
		var node = evt.target as HTMLElement;
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
		(document.getElementById('sortie_color') as HTMLInputElement).value = '';
	});
}

