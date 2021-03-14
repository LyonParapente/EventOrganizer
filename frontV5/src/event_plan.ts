import { i18n, i18n_inPlace, toDateString } from './trads';
import settings from './settings';
import { initMap } from './map';
import { init_categories, create_category_badge } from './event_plan_categories';
import { init_colorPicker } from './event_plan_colorPicker';
import { router } from './routing';
import requestJson from './request_json';
import { EventApi } from '@fullcalendar/core';

import * as jQuery from 'jquery/dist/jquery.slim';
import * as DOMPurify from 'dompurify';
import * as marked from 'marked';

var id: (string) => HTMLElement = document.getElementById.bind(document);

var sortie_date_start = id("sortie_date_start") as HTMLInputElement;
var sortie_date_end = id("sortie_date_end") as HTMLInputElement;

var edited_event_id: string = null;

export function init_createEvent (onCreate): void
{
	var form: HTMLFormElement = document.querySelector("#createEventBody form.needs-validation");
	// Submit an event
	form.addEventListener('submit', function ()
	{
		if (form.checkValidity())
		{
			form.classList.remove('was-validated');
			SubmitEvent(onCreate);
		}
		else
		{
			form.classList.add('was-validated');
			(form.querySelectorAll(":invalid")[0] as HTMLElement).focus();
		}

		// Do not reload page
		event.preventDefault();
		event.stopPropagation();
	});

	sortie_date_start.addEventListener('change', function ()
	{
		// https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/HTML5/Constraint_validation
		// Dates before this are disabled on mobile and forbidden on desktop validation
		sortie_date_end.setAttribute("min", (<HTMLInputElement><unknown>this).value);
	});
	sortie_date_start.setAttribute("min", toDateString(new Date()));

	init_categories();
	init_colorPicker();
	init_WhatsApp_video();

	var sortie_description = id('sortie_description') as HTMLTextAreaElement;
	sortie_description.addEventListener('keyup', UpdatePreview);
	id('description_preview_btn').addEventListener('click', function()
	{
		id('description_preview').classList.toggle('collapse');
	});
}

function init_WhatsApp_video ()
{
	var whatsApp_video = id('WhatsApp_video');
	var tooltip = null;
	whatsApp_video.addEventListener('click', function ()
	{
		// Mount on demand to prevent fat gif download too soon
		if (!tooltip)
		{
			// @ts-ignore html5tooltips
			tooltip = new HTML5TooltipUIComponent();
			tooltip.set(
			{
				animateFunction: "spin",
				// need to set dimensions here, otherwise bad position because image not yet downloaded
				contentText: '<img src="static/img/WhatsApp_video.gif" width="320" height="568" />',
				stickTo: "top",
				target: whatsApp_video
			});
			tooltip.mount();
			tooltip.element.addEventListener('click', function ()
			{
				tooltip.hide();
			});
			id('sortie_whatsapp').addEventListener('focus', function ()
			{
				tooltip.hide();
			});
		}
		tooltip.show();
	});
}

export function planAnEvent (start_date: Date, end_date: Date, editedEvent?: EventApi): void
{
	if (!window['connected_user'])
	{
		window.location.assign('/login');
		return;
	}

	if (end_date.getTime() !== start_date.getTime())
	{
		// Remove 1 day because end is exclusive in datastore
		end_date = new Date(end_date.getTime() - 86400000);
	}

	var today = new Date();
	var todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
	if (start_date.getTime() < todayMidnight.getTime())
	{
		console.warn(i18n("Cannot create event in the past"));
		return;
	}

	var modal_title = id('createEventTitle');
	var sortie_title = id("sortie_title") as HTMLInputElement;
	var sortie_lieu = id("sortie_lieu") as HTMLInputElement;
	var sortie_RDV = id("sortie_RDV") as HTMLInputElement;
	var sortie_heure = id("sortie_heure") as HTMLInputElement;
	var sortie_whatsapp = id('sortie_whatsapp') as HTMLInputElement;
	var sortie_desc = id("sortie_description") as HTMLTextAreaElement;
	var sortie_category = id("sortie_category") as HTMLButtonElement;
	var sortie_color = id('sortie_color') as HTMLInputElement;

	i18n_inPlace(
	[
		sortie_title.labels[0],
		sortie_lieu.labels[0],
		sortie_RDV.labels[0],
		"#createEventBody .date",
		sortie_date_start.labels[0],
		sortie_date_end.labels[0],
		sortie_heure.labels[0],
		sortie_whatsapp.labels[0].querySelector('span'),
		sortie_desc.labels[0],
		sortie_category.labels[0],
		"#sortie_save"
	]);
	i18n_inPlace(["#sortie_description"], "placeholder");

	// Reset submission checks
	var form = document.querySelector("#createEventBody form");
	form.classList.remove('was-validated');
	i18n_inPlace(form.querySelectorAll('.invalid-feedback'));
	id('event_post_error').style.display = 'none';
	sortie_whatsapp.classList.remove('is-invalid');

	// ----------------------
	// Set up fields

	sortie_RDV.setAttribute("placeholder", settings.default_location);

	sortie_date_start.value = toDateString(start_date);
	sortie_date_end.value = toDateString(end_date);
	sortie_date_end.setAttribute("min", sortie_date_start.value);

	if (editedEvent)
	{
		edited_event_id = editedEvent.id;
		modal_title.textContent = i18n('Edit an event');
		sortie_title.value = editedEvent.title;
		var eP = editedEvent.extendedProps;
		sortie_lieu.value = eP.location || '';
		sortie_RDV.value = eP.gps_location || '';
		sortie_heure.value = eP.time || '';
		sortie_whatsapp.value = eP.whatsapp_link || '';
		sortie_desc.value = eP.description || '';
		sortie_category.innerHTML = i18n('None');
		if (eP.category || editedEvent.backgroundColor)
		{
			sortie_category.innerHTML = '';
			if (eP.category)
			{
				var badge = create_category_badge(eP.category);
				sortie_category.appendChild(badge);
			}
			else
			{
				var div = document.createElement('div');
				div.setAttribute("style", "display: inline-block; background-color: "+editedEvent.backgroundColor+"; color: white;");
				div.textContent = editedEvent.backgroundColor;
				sortie_category.appendChild(div);
				sortie_color.value = editedEvent.backgroundColor;
			}
		}

		router.navigate("event:"+editedEvent.id+":edit", i18n("Edit an event"));
	}
	else
	{
		edited_event_id = null;
		modal_title.textContent = i18n('Plan an event');

		var titles = settings.default_random_event_title;
		var title = titles[getRandomInt(0, titles.length)];

		sortie_title.value = title;
		sortie_lieu.value = '';
		sortie_RDV.value = '';
		sortie_heure.value = '';
		sortie_whatsapp.value = '';
		sortie_desc.value = '';
		sortie_category.innerHTML = i18n('None');

		router.navigate("event:new", i18n("Plan an event"));
	}
	UpdatePreview.call(sortie_desc);
	id('description_preview').classList.add('collapse');

	jQuery("#createEvent")
		.one('shown.bs.modal', function ()
		{
			if (editedEvent)
			{
				initMap('sortie_map', true, eP.gps, eP.gps_location);
			}
			else
			{
				initMap('sortie_map', true);
			}
			sortie_title.focus();
		})
		.one('hide.bs.modal', function ()
		{
			router.navigate("", i18n("Planning"));
		})
		.modal('show');
}

/* Returns a random integer between the specified values.
The value is no lower than min (or the next integer greater than min if min isn't an integer),
and is less than (but not equal to) max. */
function getRandomInt(min: number, max: number): number
{
	min = Math.ceil(min);
	max = Math.floor(max);
	// The maximum is exclusive and the minimum is inclusive
	return Math.floor(Math.random() * (max - min)) + min;
}

function SubmitEvent (onCreate)
{
	var event_post_error = id('event_post_error');
	event_post_error.style.display = 'none';

	var title = id("sortie_title") as HTMLInputElement;
	var lieu = id("sortie_lieu") as HTMLInputElement;
	var rdv = id("sortie_RDV") as HTMLInputElement;
	var rdv_gps = id("sortie_RDV_gps") as HTMLInputElement;
	var date_start = id("sortie_date_start") as HTMLInputElement;
	var date_end = id("sortie_date_end") as HTMLInputElement;
	var heure = id("sortie_heure") as HTMLInputElement;
	var whatsapp_link = id("sortie_whatsapp") as HTMLInputElement;
	var description = id("sortie_description") as HTMLTextAreaElement;
	var category = id("sortie_category") as HTMLButtonElement;
	var color = id("sortie_color") as HTMLInputElement;

	var category_str = category.textContent;
	if (category_str === i18n('None') || color.value)
	{
		category_str = '';
	}

	var end_date = new Date(date_end.value);
	if (date_start.value !== date_end.value)
	{
		// Add 1 day because end is exclusive in datastore
		end_date = new Date(end_date.getTime() + 86400000);
	}

	var body =
	{
		title: title.value,
		start_date: date_start.value,
		end_date: toDateString(end_date),
		time: heure.value,
		whatsapp_link: whatsapp_link.value,
		description: description.value,
		location: lieu.value,
		gps: rdv_gps.value,
		gps_location: rdv.value,
		category: category_str,
		color: color.value
	};

	/* Keep NULL values in db for default rendez-vous location
	if (!body.gps && !body.gps_location)
	{
		body.gps = settings.default_map_center.join(', ');
		body.gps_location = settings.default_location;
	}*/

	var method = "POST";
	var url = "/api/event";

	if (edited_event_id)
	{
		method = "PUT";
		url = "/api/event/" + edited_event_id;
	}
	else
	{
		Object.keys(body).forEach(x => body[x] === '' ? delete body[x] : x);
	}

	requestJson(method, url, body,
	function (data: any)
	{
		onCreate(data);
		jQuery("#createEvent").modal("hide");
	},
	function (type: string, ex: XMLHttpRequest)
	{
		if (ex.status === 401)
		{
			window.location.assign('/login');
		}
		else if (ex.status === 400)
		{
			if (JSON.parse(ex.responseText).message === "Invalid WhatsApp link")
			{
				whatsapp_link.classList.add('is-invalid');
			}
		}
		else
		{
			console.error(type, ex.responseText)
			event_post_error.textContent = i18n('Unable to save');
			event_post_error.style.display = '';
			if (ex.status === 403)
			{
				event_post_error.textContent += " : " + i18n('insufficient rights')
			}
		}
	});
}

function UpdatePreview ()
{
	id('description_preview').innerHTML = DOMPurify.sanitize(marked(this.value));
}
