import { i18n, i18n_inPlace, toDateString } from './trads';
import { getColor } from './event_plan_categories';
import { initMap } from './map';
import loadComments from './event_comments';
import requestJson from './request_json';
import settings from './settings';
import { router } from './routing';
import { EventApi } from '@fullcalendar/core';

var id: (string) => HTMLElement = document.getElementById.bind(document);

var current_event: CurrentEvent;

export function init_showEvent (): void
{
	var form: HTMLFormElement = document.querySelector("#eventProperties form.needs-validation");

	// Submit a comment
	form.addEventListener('submit', function ()
	{
		if (form.checkValidity())
		{
			form.classList.remove('was-validated');
			SubmitComment();
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
}

export function showEvent (calEvent: EventApi): void
{
	if (!window['connected_user'])
	{
		window.location.assign('/login');
		return;
	}

	id('event_id').textContent = calEvent.id;

	var start = calEvent.start,
		end = calEvent.end;
	if (end)
	{
		// Remove 1 day because end is exclusive
		end = new Date(end.getTime() - 86400000);
	}
	else
	{
		end = start;
	}

	current_event =
	{
		event_id: parseInt(calEvent.id, 10),
		creator_id: calEvent.extendedProps.creator_id,
		isFinished: end.getTime() < new Date().getTime()
	}
	loadComments(current_event);

	// Trads
	i18n_inPlace(["#event_comment"], "placeholder");
	i18n_inPlace(
	[
		"#event_author_phone_box i",
		"#event_author_email_box i",
		"#event_rdv_time_title",
		"#event_rdv_location_title i",
		"#event_location_title i"
	], "title");

	// Reset submission checks
	var form = document.querySelector("#eventProperties form");
	form.classList.remove('was-validated');
	i18n_inPlace(form.querySelectorAll('.invalid-feedback'));
	id('comment_post_error').style.display = 'none';

	// Title & description
	id("event_title").textContent = calEvent.title;
	id("event_description").innerHTML = calEvent.extendedProps.description || i18n('No description');

	// Will be set by loadComments, cleanup any previously open
	id("event_author").textContent = '';
	id('event_author_phone_box').style.display = 'none'
	id('event_author_email_box').style.display = 'none'
	id("event_author_phone").innerHTML = '';
	id("event_author_email").innerHTML = '';

	// ----------------------
	// Category

	var category = calEvent.extendedProps.category;
	var event_category = id("event_category");
	if (category)
	{
		event_category.textContent = category;
		event_category.style.backgroundColor = getColor(category);
		event_category.style.color = 'white';
	}
	else
	{
		event_category.textContent = '';
	}

	// ----------------------
	// Author

	var creator_id = calEvent.extendedProps.creator_id;
	var author_img = new Image();
	author_img.src = "/avatars/"+creator_id+"-130";
	var event_author_img = id("event_author_img");
	event_author_img.setAttribute("href", "/user:"+creator_id);
	event_author_img.innerHTML = '';
	event_author_img.appendChild(author_img);

	// ----------------------
	// Dates

	var date_start = toDateString(start);
	var date_end = toDateString(end);
	if (date_start === date_end)
	{
		id("event_date_start").textContent = '';
		id("event_date_end").textContent  = '';
		id("event_date_day").textContent = date_start;
		id("event_date_from").style.display = 'none';
		id("event_date_to").style.display = 'none';
		id("event_date_the").style.display = '';
	}
	else
	{
		id("event_date_start").textContent = date_start;
		id("event_date_end").textContent  = date_end;
		id("event_date_day").textContent = '';
		id("event_date_from").style.display = '';
		id("event_date_to").style.display = '';
		id("event_date_the").style.display = 'none';
	}

	// ----------------------
	// Activity location

	var location = calEvent.extendedProps.location;
	var event_location_text = location || "";
	var event_location = id("event_location"),
		event_location2 = id("event_location2") as HTMLTextAreaElement;
	event_location.textContent = event_location_text;
	event_location2.textContent = event_location_text;
	id("event_location_box").style.display = location ? '' : 'none';

	// ----------------------
	// Rendez-vous time & location

	var time = calEvent.extendedProps.time;
	id("event_rdv_time").textContent = time || "";
	id("event_rdv_time_box").style.display = time ? '' : 'none';

	var rdv_location_text = '';
	var eP = calEvent.extendedProps;
	if (eP.gps || eP.gps_location)
	{
		if (eP.gps_location)
		{
			rdv_location_text = eP.gps_location;
		}
		else
		{
			rdv_location_text = eP.gps.join(', ');
		}
	}
	else
	{
		// Retro-compatibility with old events that don't have .gps or .gps_location
		rdv_location_text = location || "";
	}
	var event_rdv_location = id("event_rdv_location") as HTMLInputElement;
	event_rdv_location.value = rdv_location_text;
	event_rdv_location.setAttribute("placeholder", settings.default_location);
	id("event_rdv_location_box").style.display = '';

	// ----------------------

	router.navigate("event:"+calEvent.id, i18n("EventTitle", calEvent.id));

	// Make sure of state (for next time we show an event)
	event_location.style.display = '';
	event_location2.style.display = 'none';
	event_location2.style.height = 'auto';

	jQuery("#eventProperties")
		.one('shown.bs.modal', function ()
		{
			// Step 1 - Compute textarea height according to width
			var w = event_location.offsetWidth;
			event_location2.style.width = w+'px';

			event_location.style.display = 'none';
			event_location2.style.display = '';

			// Step 2 - Adjust textarea height
			var el2 = event_location2;
			var height = el2.scrollHeight + (el2.offsetHeight - el2.clientHeight);
			event_location2.style.height = height+'px';

			// -----

			initMap('event_map', false, eP.gps, location);

			// Avoid keyboard popping on mobile
			// id("event_comment").focus();
		})
		.one('hide.bs.modal', function ()
		{
			router.navigate("planning", i18n("Planning"));
		})
		.modal('show');

	// ----------------------
	// Clipboard copy

	ClipboardCopyLocation(id('event_location_title'), event_location2);
	ClipboardCopyLocation(event_location2, event_location2);

	ClipboardCopyLocation(id('event_rdv_location_title'), event_rdv_location);
	ClipboardCopyLocation(event_rdv_location, event_rdv_location);
}

function ClipboardCopyLocation (clickTarget: HTMLElement, copyTarget: HTMLInputElement|HTMLTextAreaElement)
{
	clickTarget.addEventListener("click", function ()
	{
		if (!copyTarget.value) {return}

		copyTarget.select();
		document.execCommand('copy');
		copyTarget.setSelectionRange(0, 0);

		var url = "http://maps.google.com/maps?daddr="+encodeURIComponent(copyTarget.value);
		var text = i18n('Copied to clipboard!')+
			'<br/><a href="'+url+'" target="_blank">'+
			i18n('Open in Google Maps')+'</a>';

		ShowClipboarTooltip(clickTarget, text);
	});
}

function ShowClipboarTooltip (element: HTMLElement, html: string): void
{
	// @ts-ignore html5tooltips
	var tooltip = new HTML5TooltipUIComponent();
	tooltip.set(
	{
		animateFunction: "spin",
		contentText: html,
		stickTo: "top",
		target: element
	});
	tooltip.mount();
	tooltip.show();

	setTimeout(() => tooltip.destroy(), 3000);
}

function SubmitComment ()
{
	var textarea = id('event_comment') as HTMLTextAreaElement;
	var comment_post_error = id('comment_post_error');
	comment_post_error.style.display = 'none';
	var body =
	{
		event_id: current_event.event_id,
		comment: textarea.value
	};
	requestJson("POST", "/api/message", body,
	function ()
	{
		textarea.value = '';

		// Reload all comments because there are new comments from others
		loadComments(current_event);
	},
	function (type: string, ex: XMLHttpRequest)
	{
		console.error(type, ex.responseText)
		comment_post_error.innerHTML = i18n('Unable to save, please retry');
		comment_post_error.style.display = '';
	});
}
