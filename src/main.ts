import { Calendar } from '@fullcalendar/core';
import frLocale from '@fullcalendar/core/locales/fr';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import bootstrapPlugin from '@fullcalendar/bootstrap';
import interactionPlugin from '@fullcalendar/interaction';

import { i18n, i18n_inPlace, toDateString } from './trads';
import theme from './theme';
import settings from './settings';
import planAnEvent from './event_plan';
import swipedetector from "./swipe";

export var calendar;

var id = document.getElementById.bind(document);
document.addEventListener('DOMContentLoaded', function()
{
	var calendarEl = id('calendar'),
		loadingEl = id('loading'),
		loadingTimer;

	calendar = new Calendar(calendarEl,
	{
		plugins: [bootstrapPlugin, dayGridPlugin, listPlugin, interactionPlugin],

		themeSystem: 'bootstrap',

		header:
		{
			left: 'month basicWeek prev',
			center: 'title',
			right: 'next today'
		},
		footer:
		{
			left: 'listMonth listYear',
			right: 'newEvent'
		},
		views:
		{
			listMonth:
			{
				buttonText: i18n("Month list")
			},
			listYear:
			{
				buttonText: i18n("Year list"),
				listDayAltFormat: settings.listDayAltFormat
			},
			month:
			{
				showNonCurrentDates: false,
				eventLimit: false // extend cell when too many events
			}
		},

		customButtons:
		{
			newEvent:
			{
				text: i18n('New Event'),
				click: function()
				{
					var d = new Date(); // TODO
					planAnEvent(d, d);
				}
			}
		},

		//locales: [frLocale],
		locale: settings.lang,
		timeZone: 'local',

		defaultView: 'dayGridMonth',
		defaultDate: new Date(),

		selectable: true, // for both month & basicWeek views
		unselectAuto: true, // clicking elsewhere on the page will cause the current selection to be cleared

		eventColor: settings.default_event_color,
		displayEventTime: false,

		dateClick: function (infos)
		{
			console.log("Day clicked "+infos.dateStr);
			var d = infos.date;
			planAnEvent(d, d);
		},
		select: function(selectionInfo)
		{
			// Remove 1 day because end is exclusive
			var end = selectionInfo.end.getTime() - 86400000;
			var start = selectionInfo.start.getTime();
			if (start !== end)
			{
				var endDate = new Date(end);
				console.log('Selected ' + selectionInfo.startStr + ' to ' + toDateString(endDate));
				planAnEvent(selectionInfo.start, endDate);
			}
			else
			{
				// handled by dayClick
			}
		},
		eventClick: showEvent,
		eventDataTransform: function(event)
		{
			if (event.hasOwnProperty('category'))
			{
				event.color = getColor(event.category);
			}
			event.desc = event.desc.replace(/\n/g, '<br/>');
			return event;
		},
		eventRender: function(info)
		{
			var desc = info.event.extendedProps.desc;
			if (desc)
			{
				// @ts-ignore html5tooltips
				var tooltip = new HTML5TooltipUIComponent;
				var target = info.el;
				tooltip.set(
				{
					contentText: desc,
					stickTo: "bottom",
					target: target,
					maxWidth: 500
				});
				target.addEventListener('mouseenter', () => tooltip.show());
				target.addEventListener('mouseleave', () => tooltip.hide());
				tooltip.mount();
			}
		},
		loading: function(isLoading)
		{
			if (isLoading)
			{
				// Show only after a while, to avoid visual glitch when fast
				loadingTimer = setTimeout(function()
				{
					loadingEl.style.display = 'block';
				}, 200);
			}
			else
			{
				clearTimeout(loadingTimer);
				loadingEl.style.display = 'none';
			}
		}
	});
	(<any>window).calendar = calendar;
	calendar.render();

	i18n_inPlace(["#eventProperties .trad", "#createEvent .trad"]);

	init_createEvent();

	swipedetector(document, function(swipedir)
	{
		if (swipedir === 'left')
		{
			calendar.next();
		}
		else if (swipedir === 'right')
		{
			calendar.prev();
		}
	});
});


function showEvent()
{
	//TODO
}




function getColorConf()
{
	var colorConf;
	if (settings.categories.hasOwnProperty(theme))
	{
		colorConf = settings.categories[theme];
	}
	else
	{
		colorConf = settings.categories["default"];
	}
	return colorConf;
}

function getColor(category)
{
	return getColorConf()[category];
}

function init_createEvent()
{
	$("#createEventBody .needs-validation").on('submit', function(e)
	{
		var form = <HTMLFormElement><unknown>e.target;
		if (form.checkValidity())
		{
			//TODO: post ajax data
		}
		else
		{
			$(form).find(":invalid").first().focus();
		}

		form.classList.add('was-validated');

		// Do not reload page
		event.preventDefault();
		event.stopPropagation();
	});

	$("#sortie_date_start").on('change', function()
	{
		// https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/HTML5/Constraint_validation
		// Dates before this are disabled on mobile and forbidden on desktop validation
		$("#sortie_date_end").attr("min", (<HTMLInputElement><unknown>this).value);
	});

	// List of available categories
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
			a.href = "#";
			a.appendChild(document.createTextNode(category));
			$category_dd.append(a);
		}
	}
	var $sortie_category = $("#sortie_category");
	$category_dd.parent().on("click", "a", function()
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

	$("#sortie_color_box").colorpicker(
	{
		format: 'hex',
		useAlpha: false,
		inline: true,
		fallbackColor: 'red',
		autoInputFallback: false
	})
	.on("change", onColorPickerChange)
	.on("colorpickerChange", onColorPickerChange);
	
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
			if (target.id != 'sortie_color_btn' && $(target).parents("#sortie_color_box").length)
			{
				event.preventDefault();
				return false;
			}
		}
		colorPicker.hide();
	});
}