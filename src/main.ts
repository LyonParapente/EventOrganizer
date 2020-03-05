import { Calendar } from '@fullcalendar/core';
import frLocale from '@fullcalendar/core/locales/fr';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import bootstrapPlugin from '@fullcalendar/bootstrap';
import interactionPlugin from '@fullcalendar/interaction';

import { i18n, i18n_inPlace } from './trads';
import theme from './theme';
import settings from './settings';

import { initMap } from "./map";
import swipedetector from "./swipe";

export var calendar;

document.addEventListener('DOMContentLoaded', function()
{
	var id = document.getElementById.bind(document);
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
			var d = infos.dateStr;
			console.log("Day clicked "+d);
			planAnEvent(d, d);
		},
		select: function(selectionInfo)
		{

			//TODO
			debugger;

			/*endDate.add(-1, 'days');
			if (startDate.format() !== endDate.format())
			{
				console.log('Selected ' + startDate.format() + ' to ' + endDate.format());
				planAnEvent(startDate, endDate);
			}
			else
			{
				// handled by dayClick
			}*/
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
			/*TODO
			if (info.event.desc)
			{
				//with popper.min.js
				//$(element).tooltip({title: event.desc, html: true});
			}*/
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
	calendar.render();





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


function planAnEvent(start_date, end_date)
{
	// TODO
}

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
