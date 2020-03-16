import { Calendar } from '@fullcalendar/core';
import frLocale from '@fullcalendar/core/locales/fr';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import bootstrapPlugin from '@fullcalendar/bootstrap';
import interactionPlugin from '@fullcalendar/interaction';

import { i18n, i18n_inPlace, toDateString } from './trads';
import settings from './settings';
import { init_createEvent, planAnEvent } from './event_plan';
import showEvent from './event_show';
import swipedetector from './swipe';
import { getColor } from './event_plan_categories';

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
