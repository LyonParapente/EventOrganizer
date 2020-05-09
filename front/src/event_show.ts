import { i18n, i18n_inPlace, toDateString } from './trads';
import { getColor } from './event_plan_categories';
import { initMap } from './map';
import loadComments from './event_comments';
import requestJson from './request_json';
import settings from './settings';
import { router } from './routing';
import { planAnEvent } from './event_plan';
import { Calendar, EventApi } from '@fullcalendar/core';

var id: (string) => HTMLElement = document.getElementById.bind(document);

var current_event: CurrentEvent = null;
var calendar: Calendar = null;

export function init_showEvent (cal: Calendar): void
{
	calendar = cal;
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
	var event_description = id("event_description");
	event_description.innerHTML = '';
	var desc = calEvent.extendedProps.description || i18n('No description');
	event_description.appendChild(document.createTextNode(desc));
	event_description.innerHTML = event_description.innerHTML.replace(/\n/g,'<br/>');

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
	// Management

	var del_event = id('del_event');
	var edit_event = id('edit_event');
	if (window['connected_user'].id === current_event.creator_id &&
		!current_event.isFinished)
	{
		del_event.style.display = '';
		edit_event.style.display = '';
		del_event.addEventListener('click', DeleteEvent);
		edit_event.addEventListener('click', EditEvent);
	}
	else
	{
		del_event.style.display = 'none';
		edit_event.style.display = 'none';
		del_event.removeEventListener('click', DeleteEvent);
		edit_event.removeEventListener('click', EditEvent);
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

	// Will be set by loadComments, cleanup any previously open
	id("event_author").textContent = '';
	id('event_author_phone_box').style.display = 'none'
	id('event_author_email_box').style.display = 'none'
	id("event_author_phone").innerHTML = '';
	id("event_author_email").innerHTML = '';

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

	author_img.addEventListener('load', function ()
	{
		ComputeLocationDimensions(event_location, event_location2);
	});

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
			initMap('event_map', false, eP.gps, eP.gps_location);

			// Avoid keyboard popping on mobile
			// id("event_comment").focus();
		})
		.one('hide.bs.modal', function ()
		{
			current_event = null;
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

function ComputeLocationDimensions (el, el2)
{
	// Step 1 - Compute textarea height according to width
	var w = el.offsetWidth + 1;
	el2.style.width = w+'px';

	el.style.display = 'none';
	el2.style.display = '';

	// Step 2 - Adjust textarea height
	var height = el2.scrollHeight + (el2.offsetHeight - el2.clientHeight);
	el2.style.height = height+'px';
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
		if (ex.status === 401)
		{
			window.location.assign('/login');
		}
		console.error(type, ex.responseText)
		comment_post_error.innerHTML = i18n('Unable to save, please retry');
		comment_post_error.style.display = '';
	});
}

function DeleteEvent (): void
{
	if (confirm(i18n('Confirm')))
	{
		var url = "/api/event/"+current_event.event_id.toString();
		requestJson("DELETE", url, null, function (data: any)
		{
			var event = calendar.getEventById(current_event.event_id.toString());
			event.remove();
			current_event = null;

			jQuery("#eventProperties").modal("hide");
		},
		function (type: string, ex: XMLHttpRequest)
		{
			try
			{
				alert(JSON.parse(ex.responseText).message);
			}
			finally
			{
				console.error(type, ex);
			}
		});
	}
}

function EditEvent (): void
{
	var event = calendar.getEventById(current_event.event_id.toString());
	jQuery("#eventProperties").modal("hide");
	planAnEvent(event.start, event.end || event.start, event);
}
