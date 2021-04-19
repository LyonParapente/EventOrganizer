// @ts-ignore ColorPicker
import ColorPicker from 'simple-color-picker';

var sortie_category = document.getElementById("sortie_category") as HTMLElement;
var sortie_color = <HTMLInputElement>document.getElementById("sortie_color");

var colorPicker: SimpleColorPicker;

export function init_colorPicker (): void
{
	var sortie_color_box = document.getElementById('sortie_color_box');

	colorPicker = new ColorPicker({
		el: sortie_color_box,
		width: 200,
		height: 200
	});
	colorPicker.onChange(onColorPickerChangeIgnoreFirstCall);

	sortie_color.addEventListener('keyup', function ()
	{
		// User is typing something
		if (this.value.match(/^#[a-fA-F0-9]{6}$/))
		{
			colorPicker.setColor(this.value);
		}
	});

	var sortie_category_parent = sortie_category.parentElement as HTMLElement;
	sortie_category_parent.addEventListener('show.bs.dropdown', function ()
	{
		var text = sortie_category.textContent as string;
		var val = text.indexOf('#') === 0 ? text : '';
		sortie_color.value = val;
		colorPicker.setColor(val);
	});
}

var firstCallDone = false;
function onColorPickerChangeIgnoreFirstCall (hexStringColor: string): void
{
	if (firstCallDone)
	{
		onColorPickerChange(hexStringColor);
	}
	else
	{
		firstCallDone = true;
		sortie_color.value = '';
	}
}

function onColorPickerChange (hexStringColor: string): void
{
	sortie_color.value = hexStringColor;

	var colorBox = document.createElement('div');
	colorBox.textContent = hexStringColor;
	var css =
	{
		display: 'inline-block',
		backgroundColor: hexStringColor,
		color: colorPicker.isDark() ? 'white' : 'black'
	};
	Object.keys(css).forEach(option => colorBox.style[option] = css[option]);

	sortie_category.innerHTML = '';
	sortie_category.appendChild(colorBox);
}
