import * as jQuery from 'jquery';
import 'bootstrap-colorpicker';

var sortie_category = document.getElementById("sortie_category");

var colorPicker: BootstrapColorpicker = null;

export function init_colorPicker (): void
{
	var $sortie_color_box = jQuery("#sortie_color_box").colorpicker(
	{
		format: 'hex',
		useAlpha: false,
		inline: true,
		fallbackColor: 'fff',
		autoInputFallback: false
	})
	.on("colorpickerChange", onColorPickerChange);

	colorPicker = $sortie_color_box.data('colorpicker');
	colorPicker.hide(); // default state

	var sortie_color = <HTMLInputElement>document.getElementById("sortie_color");
	sortie_color.addEventListener('focus', function ()
	{
		colorPicker.show();
	});

	jQuery(sortie_category.parentElement)
	.on('show.bs.dropdown', function ()
	{
		var text = sortie_category.textContent;
		var val = text.indexOf('#') === 0 ? text : '';
		sortie_color.value = val;
	})
	.on('hide.bs.dropdown', function (event)
	{
		var clickEvent = (event as any).clickEvent;
		if (clickEvent && clickEvent.target)
		{
			var target = clickEvent.target;
			if (target.id !== 'sortie_color_btn' &&
				hasParentWithId(target, "sortie_color_box"))
			{
				event.preventDefault();
				return false;
			}
		}
		colorPicker.hide();
	});
}

function onColorPickerChange (event: BootstrapColorpickerEvent): void
{
	if (event.color)
	{
		var colorBox = document.createElement('div');
		var css =
		{
			display: 'inline-block',
			backgroundColor: event.color.toString(),
			color: event.color.isDark() ? 'white' : 'black'
		};
		Object.keys(css).forEach(option => colorBox.style[option] = css[option]);

		colorBox.textContent = event.color.toString();

		sortie_category.innerHTML = '';
		sortie_category.appendChild(colorBox);
	}
	else if ((event.target as HTMLInputElement).value.match(/^#[a-fA-F0-9]{6}$/))
	{
		// User is typing something
		colorPicker.setValue((event.target as HTMLInputElement).value); // trigger colorpickerChange
	}
}

function hasParentWithId (element: Element, id: string): boolean
{
	var current = element;
	while (current !== document.body)
	{
		if (current.id === id)
		{
			return true;
		}
		current = current.parentElement;
	}
	return false;
}