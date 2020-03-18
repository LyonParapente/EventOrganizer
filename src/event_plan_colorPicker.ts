export function init_colorPicker()
{
	$("#sortie_color_box").colorpicker(
	{
		format: 'hex',
		useAlpha: false,
		inline: true,
		fallbackColor: 'fff',
		autoInputFallback: false
	})
	.on("change", onColorPickerChange)
	.on("colorpickerChange", onColorPickerChange);

	var $sortie_category = $("#sortie_category");

	function onColorPickerChange(event: BootstrapColorpickerEvent)
	{
		if (event.color)
		{
			var colorBox = $("<div>").css(
			{
				display: 'inline-block',
				backgroundColor: event.color.toString(),
				color: event.color.isDark() ? 'white' : 'black'
			}).text(event.color.toString());
			$sortie_category.empty().append(colorBox);
		}
		else if ((event.target as HTMLInputElement).value.match(/^#[a-fA-F0-9]{6}$/))
		{
			// User is typing something
			colorPicker.setValue((event.target as HTMLInputElement).value); // trigger colorpickerChange
		}
	}

	var colorPicker = $("#sortie_color_box").data('colorpicker');
	colorPicker.hide(); // default state
	$("#sortie_color").on('focus', function()
	{
		colorPicker.show();
	});

	$sortie_category.parent().on('show.bs.dropdown', function()
	{
		var text = $sortie_category.text();
		var val = text.indexOf('#') === 0 ? text : '';
		$("#sortie_color").val(val);
	})
	.on('hide.bs.dropdown', function (event)
	{
		var clickEvent = (event as any).clickEvent;
		if (clickEvent && clickEvent.target)
		{
			var target = clickEvent.target;
			if (target.id !== 'sortie_color_btn' &&
				$(target).parents("#sortie_color_box").length)
			{
				event.preventDefault();
				return false;
			}
		}
		colorPicker.hide();
	});
}