import { Calendar, EventInputTransformer } from '@fullcalendar/core';
import frLocale from '@fullcalendar/core/locales/fr';

import bootstrapPlugin from '@fullcalendar/bootstrap';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';

import * as bootstrap from 'bootstrap';

import 'bootstrap/dist/css/bootstrap.css';
import 'css/themes/flatly.bootstrap.min.css';
import 'css/calendar.scss';
import '@fortawesome/fontawesome-free/css/all.min.css';

import { i18n, i18n_inPlace, toDateString } from './trads';
import settings from './settings';
import { init_createEvent, planAnEvent } from './event_plan';
import { init_showEvent, showEvent } from './event_show';
import swipedetector from './swipe';
import { getColor } from './event_plan_categories';
import { router } from './routing';
import requestJson from './request_json';
import unsplash from './unsplash';

var calendar: Calendar = null;

var id: (str: string) => HTMLElement = document.getElementById.bind(document);

// Adapt server response to fullcalendar expected fields
let eventDataTransform: EventInputTransformer = function (event)
{
	var orig = calendar.getEventById(event.id);
	if (orig)
	{
		// Typically happens when we update an event
		// Or when we create an event then scroll through months
		orig.remove();
	}

	// -----

	if (event.category)
	{
		event.color = getColor(event.category);
	}
	event.description = event.description || '';

	// re-map start & end to expected properties
	if (event.start_date) // if useful for onCreateEvent scenario
	{
		event.start = event.start_date;
		delete event.start_date;
	}
	if (event.end_date)
	{
		event.end = event.end_date;
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
	let calendarEl = id('calendar'),
		loadingEl = id('loading'),
		loadingTimer: NodeJS.Timeout;

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

	if (settings.unsplash_tags)
	{
		unsplash(settings.unsplash_tags);
	}
	id('changeBg').addEventListener('click', function ()
	{
		var tags = settings.unsplash_tags.concat(new Date().getTime().toString())
		unsplash(tags);
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
				var event = calendar.getEventById(num);
				if (edit)
				{
					console.log('Editing event:'+num);
					planAnEvent(event.start, event.end||event.start, event);
				}
				else
				{
					console.log('Showing event:'+num);
					showEvent(event);
				}
				calendar.gotoDate(event.start);
			}, function(){}); // tslint:disable-line
		})
		.add(/([0-9]{4})-([0-9]{2})/, function (year, month)
		{
			console.log('Showing month '+month+' of year '+year);
			calendar.gotoDate(new Date(+year, +month-1, 1));
		})
		.add("", function ()
		{
			console.log('Show the planning');
			bootstrap.Modal.getInstance(id('eventProperties')).hide();
			bootstrap.Modal.getInstance(id('createEvent')).hide();
		});

	if (location.pathname === router.root)
	{
		router.replace('', i18n('Planning'));
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

function onCreateEvent (event: any)
{
	eventDataTransform(event);
	calendar.addEvent(event);
}

function setBackgroundColor (calendarEl: HTMLElement)
{
	var container: HTMLElement = calendarEl.querySelector(".fc-view-harness");
	container.classList.add('bg-secondary');

	// alpha according to theme
	var color = getComputedStyle(container)['backgroundColor'];
	var color_alpha = "rgba("+color.substring(4,color.length-1)+", 0.3)";
	container.style.backgroundColor = color_alpha;
	container.classList.remove('bg-secondary');
}
