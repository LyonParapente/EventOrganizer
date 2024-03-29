import { Calendar, EventApi, EventInputTransformer, EventInput } from '@fullcalendar/core';
import frLocale from '@fullcalendar/core/locales/fr';

import bootstrapPlugin from '@fullcalendar/bootstrap';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';

import * as bootstrap from 'bootstrap';

// import 'bootstrap/dist/css/bootstrap.css'; // commented so that we can import the theme between bootstrap and calendar.scss
import 'css/calendar.scss';
import '@fortawesome/fontawesome-free/css/all.min.css';

import settings from './settings';
import { i18n, i18n_inPlace } from './trads';
import { toDateString } from './datetime';
import { id } from './dom';
import { init_createEvent, planAnEvent } from './event_plan';
import { init_showEvent, showEvent } from './event_show';
import swipedetector from './swipe';
import { getColor } from './theme';
import { router } from './routing';
import requestJson from './request_json';
import { background, setBackgroundColor } from './background';

var calendar: Calendar;

// Adapt server response to fullcalendar expected fields
const eventDataTransform: EventInputTransformer = function (event: EventInput)
{
	var orig = calendar.getEventById(event.id as string);
	if (orig)
	{
		// Typically happens when we update an event
		// Or when we create an event then scroll through months
		orig.remove();
	}

	// -----

	if (event.category)
	{
		event.color = getColor(event.category as string);
	}
	event.description = event.description as string || '';

	// re-map start & end to expected properties
	if (event.start_date) // if useful for onCreateEvent scenario
	{
		event.start = event.start_date as string;
		delete event.start_date;
	}
	if (event.end_date)
	{
		event.end = event.end_date as string;
		delete event.end_date;
	}

	if (typeof event.gps === 'string' && event.gps)
	{
		event.gps = event.gps.split(', ');
	}

	return event;
}

document.addEventListener('DOMContentLoaded', function()
{
	const calendarEl = id('calendar'),
		loadingEl = id('loading');
	let loadingTimer: NodeJS.Timeout;

	calendar = new Calendar(calendarEl,
	{
		plugins: [bootstrapPlugin, dayGridPlugin, listPlugin, interactionPlugin],
		themeSystem: 'bootstrap',

		headerToolbar:
		{
			left: 'prev',
			center: 'title',
			right: 'next'
		},
		footerToolbar:
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
				dayMaxEventRows: false // extend cell when too many events
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
				hint: i18n('Previous'),
				click: function()
				{
					calendar.prev();
					updateUrlWithCurrentMonth();
				}
			},
			next:
			{
				text: '', // doesn't matter but need to be here for .ts
				hint: i18n('Next'),
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

		initialView: 'dayGridMonth',
		initialDate: new Date(),

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
			// Remove 1 day for comparison because end is exclusive in datastore
			var end = selectionInfo.end.getTime() - 86400000;
			var start = selectionInfo.start.getTime();
			if (start !== end)
			{
				var endDate = new Date(end);
				console.log('Selected ' + selectionInfo.startStr + ' to ' + toDateString(endDate));
				planAnEvent(selectionInfo.start, selectionInfo.end);
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
		loading: function (isLoading)
		{
			if (isLoading)
			{
				// Show only after a while, to avoid visual glitch when fast
				loadingTimer = setTimeout(function()
				{
					calendarEl.appendChild(loadingEl);
					loadingEl.style.display = 'block';
				}, 200);
			}
			else
			{
				clearTimeout(loadingTimer);
				loadingEl.style.display = 'none';
				document.body.appendChild(loadingEl);
			}
		}
	});
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

	background(settings.use_unsplash, settings.unsplash_tags);
	id('changeBg').addEventListener('click', function ()
	{
		background(settings.use_unsplash, settings.unsplash_tags, true);
	});
});

function init_routing ()
{
	router
		.add("event:new", function ()
		{
			console.log('Create a new event');
			var d = new Date();
			planAnEvent(d, d);
		})
		.add(/event:([0-9]+)(:edit)?$/, function (num: string, edit: string)
		{
			console.log('Fetching event:'+num);
			requestJson('GET', '/api/event/'+num, null, function (data: object)
			{
				onCreateEvent(data);
				var event = calendar.getEventById(num) as EventApi;
				if (edit)
				{
					console.log('Editing event:'+num);
					planAnEvent(event.start as Date, (event.end||event.start) as Date, event);
				}
				else
				{
					console.log('Showing event:'+num);
					showEvent(event);
				}
				calendar.gotoDate(event.start as Date);
			}, function(){/* do nothing */});
		})
		.add(/([0-9]{4})-([0-9]{2})/, function (year, month)
		{
			console.log('Showing month '+month+' of year '+year);
			calendar.gotoDate(new Date(+year, +month-1, 1));
		})
		.add("", function ()
		{
			console.log('Show the planning');
			bootstrap.Modal.getInstance(id('eventProperties'))?.hide();
			bootstrap.Modal.getInstance(id('createEvent'))?.hide();
		});

	if (location.pathname === router.root)
	{
		router.replace('', i18n('Planning'));
	}
	else if (history.state)
	{
		router.check((history.state as {path: string}).path);
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
	monthTrad = monthTrad.charAt(0).toLocaleUpperCase(settings.lang) + monthTrad.substring(1);

	var YYYY = now.getFullYear().toString();
	var MM = now.getMonth() + 1;
	var monthNum = MM < 10 ? '0' + MM.toString() : MM.toString();
	router.navigate(YYYY+"-"+monthNum, monthTrad+" "+YYYY);
}

function onCreateEvent (event: EventInput)
{
	eventDataTransform(event);
	calendar.addEvent(event);
}
