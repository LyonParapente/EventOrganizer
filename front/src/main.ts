import { Calendar } from '@fullcalendar/core';
import * as frLocale from '@fullcalendar/core/locales/fr';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import bootstrapPlugin from '@fullcalendar/bootstrap';
import interactionPlugin from '@fullcalendar/interaction';

import { i18n, i18n_inPlace, toDateString } from './trads';
import settings from './settings';
import { init_createEvent, planAnEvent } from './event_plan';
import { init_showEvent, showEvent } from './event_show';
import swipedetector from './swipe';
import { getColor } from './event_plan_categories';
import { router } from './routing';
import requestJson from './request_json';
import unsplash from './unsplash';

export var calendar: Calendar;

var id: (string) => HTMLElement = document.getElementById.bind(document);

document.addEventListener('DOMContentLoaded', function ()
{
	var calendarEl = id('calendar'),
		loadingEl = id('loading'),
		loadingTimer: number;

	calendar = new Calendar(calendarEl,
	{
		plugins: [bootstrapPlugin, dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin],

		themeSystem: 'bootstrap',

		header:
		{
			left: 'prev',
			center: 'title',
			right: 'next'
		},
		footer:
		{
			left: 'dayGridWeek,dayGridMonth listMonth,listYear',
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
					var d = new Date();
					planAnEvent(d, d);
				}
			},
			prev:
			{
				text: '', // doesn't matter but need to be here for .ts
				click: function()
				{
					calendar.prev();
					updateUrlWithCurrentMonth();
				}
			},
			next:
			{
				text: '', // doesn't matter but need to be here for .ts
				click: function()
				{
					calendar.next();
					updateUrlWithCurrentMonth();
				}
			}
		},

		events: '/api/events',

		locales: [frLocale],
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
		select: function (selectionInfo)
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
		eventClick: function (clickInfos)
		{
			showEvent(clickInfos.event);
		},
		eventDataTransform: eventDataTransform,
		eventRender: function (info)
		{
			var desc = info.event.extendedProps.description;
			if (desc)
			{
				// @ts-ignore html5tooltips
				var tooltip = new HTML5TooltipUIComponent();
				var target = info.el;
				tooltip.set(
				{
					contentText: desc.replace(/\n/g, '<br/>'),
					stickTo: "bottom",
					target: target,
					maxWidth: 500
				});

				// on mobile, touchstart happens first
				// destroy tooltip which cause visual glitch when the
				// even properties modal appear
				target.addEventListener('touchstart', () => tooltip.destroy());

				target.addEventListener('mouseenter', () => tooltip.show());
				target.addEventListener('mouseleave', () => tooltip.hide());

				tooltip.mount();
			}
		},
		loading: function (isLoading)
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

	setBackgroundColor(calendarEl);

	i18n_inPlace(["#eventProperties .trad", "#createEvent .trad"]);

	// Once and for all
	init_routing();
	init_createEvent(onCreateEvent);
	init_showEvent(calendar);

	swipedetector(document, function (swipedir: string)
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

	if (settings.unsplash_tags)
	{
		unsplash(settings.unsplash_tags);
	}
	id('changeBg').addEventListener('click', function ()
	{
		unsplash(settings.unsplash_tags);
	});
});

function init_routing ()
{
	router
		.add("planning", function ()
		{
			console.log('Show the planning');
			jQuery("#eventProperties").modal('hide');
			jQuery("#createEvent").modal('hide');
		})
		.add("event:new", function ()
		{
			console.log('Create a new event');
			var d = new Date();
			planAnEvent(d, d);
		})
		.add(/event:([0-9]+)$/, function (num: string)
		{
			console.log('Fetching event:'+num);
			requestJson('GET', '/api/event/'+num, null, function (data: object)
			{
				console.log('Showing event:'+num);
				onCreateEvent(data);
				var event = calendar.getEventById(num);
				showEvent(event);
				calendar.gotoDate(event.start);
			}, function(){}); // tslint:disable-line
		})
		.add(/([0-9]{4})-([0-9]{2})/, function (year, month)
		{
			console.log('Showing month '+month+' of year '+year);
			calendar.gotoDate(new Date(+year, +month-1, 1));
		});

	if (location.pathname === router.root)
	{
		router.replace('planning', i18n('Planning'));
	}
	else if (history.state)
	{
		router.check(history.state.path);
	}
	else
	{
		router.check(location.pathname.substr(router.root.length));
	}
}

function updateUrlWithCurrentMonth ()
{
	var now = calendar.getDate();

	var monthTrad = new Intl.DateTimeFormat(settings.lang, {month: "long"}).format(now);
	monthTrad = monthTrad.charAt(0).toLocaleUpperCase(settings.lang) + monthTrad.substr(1);

	var YYYY = now.getFullYear();
	var MM = now.getMonth() + 1;
	var monthNum = MM < 10 ? '0' + MM : MM.toString();
	router.navigate(YYYY+"-"+monthNum, monthTrad+" "+YYYY);
}

// Adapt server response to fullcalendar expected fields
function eventDataTransform (event)
{
	if (event.hasOwnProperty('category'))
	{
		event.color = getColor(event.category);
	}
	event.description = event.description || '';

	// re-map start & end to expected properties
	event.start = event.start_date;
	event.end = event.end_date;
	delete event.start_date;
	delete event.end_date;

	if (typeof event.gps === 'string')
	{
		event.gps = event.gps.split(', ');
	}

	return event;
}

function onCreateEvent (event: object)
{
	eventDataTransform(event);
	calendar.addEvent(event);
}

function setBackgroundColor (calendarEl)
{
	var container = calendarEl.querySelector(".fc-view-container");
	container.classList.add('bg-secondary');

	// alpha according to theme
	var color = getComputedStyle(container)['backgroundColor'];
	var color_alpha = "rgba("+color.substring(4,color.length-1)+", 0.3)";
	container.style.backgroundColor = color_alpha;
	container.classList.remove('bg-secondary');
}
