import { i18n, i18n_inPlace, toDateString } from './trads';
import { getColor } from './event_plan_categories';
import { initMap } from './map';
import loadComments from './event_comments';
import requestJson from './request_json';
import settings from './settings';
import { router } from './routing';
import { planAnEvent } from './event_plan';
import { Calendar, EventApi } from '@fullcalendar/core';

import * as jQuery from 'jquery/dist/jquery.slim';
import * as DOMPurify from 'dompurify';
import * as marked from 'marked';

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

	id('event_bell').addEventListener('click', function ()
	{
		var is_blocking = this.classList.contains('fa-bell-slash');
		var verb = is_blocking ? "DELETE" : "PUT";
		requestJson(verb, "/api/event/"+current_event.event_id+"/notifications_blacklist", null,
		function (data: any)
		{
			SetBell(verb === "PUT");
		},
		function (type: string, ex: XMLHttpRequest)
		{
			console.error(type, ex.responseText)
		});
	});

	i18n_inPlace(["#event_ics"], "title");

	id('event_whatsapp').addEventListener('click', function ()
	{
		window.open(current_event.whatsapp_link);
	});

	var event_comment = id('event_comment') as HTMLTextAreaElement;
	event_comment.addEventListener('keyup', UpdateCommentPreview);
	id('event_preview_btn').addEventListener('click', function()
	{
		id('comment_preview').classList.toggle('collapse');
	});

	var calendar_export_instance;
	var event_ics = id('event_ics') as HTMLAnchorElement;
	event_ics.addEventListener('click', function (evt)
	{
		if (calendar_export_instance)
		{
			calendar_export_instance.destroy();
			calendar_export_instance = null;
		}
		else
		{
			var event = calendar.getEventById(current_event.event_id.toString());
			calendar_export_instance = ShowCalendarExport(event);
			setTimeout(() =>
			{
				calendar_export_instance.destroy();
				calendar_export_instance = null;
			}, 6000);
		}
		evt.preventDefault();
	});
}

export function showEvent (calEvent: EventApi): void
{
	var connected_user = get_connected_user();
	if (!connected_user)
	{
		window.location.assign('/login');
		return;
	}

	var start = calEvent.start,
		end = calEvent.end;
	if (end)
	{
		// Remove 1 day because end is exclusive in datastore
		end = new Date(end.getTime() - 86400000);
	}
	else
	{
		end = start;
	}

	var endMidnight = new Date(end.getFullYear(), end.getMonth(), end.getDate());
	var endMidnightPlus24H = new Date(endMidnight.getTime() + 86400000);

	current_event =
	{
		event_id: parseInt(calEvent.id, 10),
		creator_id: calEvent.extendedProps.creator_id,
		isFinished: endMidnightPlus24H.getTime() < new Date().getTime(),
		whatsapp_link: calEvent.extendedProps.whatsapp_link
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

	// ----------------------
	// Title & description

	id("event_title").textContent = calEvent.title;
	var event_description = id("event_description");
	var desc = calEvent.extendedProps.description || i18n('No description');
	event_description.innerHTML = DOMPurify.sanitize(marked(desc));

	// ----------------------
	// WhatsApp

	var event_whatsapp = id('event_whatsapp') as HTMLLinkElement;
	if (current_event.whatsapp_link)
	{
		event_whatsapp.style.display = '';
		event_whatsapp.classList.add('d-flex');
	}
	else
	{
		event_whatsapp.style.display = 'none';
		event_whatsapp.classList.remove('d-flex'); // so that display: none; works
	}

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
	var canEdit = connected_user.id === current_event.creator_id ||
		connected_user.role === 'admin';
	if (!current_event.isFinished && canEdit)
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
	id('event_author_phone_box').style.display = 'none';
	id('event_author_whatsapp').style.display = 'none';
	id('event_author_email_box').style.display = 'none';
	id("event_author_phone").innerHTML = '';
	id("event_author_email").innerHTML = '';

	// ----------------------
	// Bell

	var event_bell = id('event_bell');
	event_bell.style.display = 'none';
	if (connected_user.notif_event_change === 0)
	{
		// Hide it completely since globally deactivated by user
	}
	else
	{
		requestJson("GET", "/api/event/"+calEvent.id+"/notifications_blacklist", null,
		function (data: any)
		{
			event_bell.style.display = '';
			SetBell(data.block);
		},
		function (type: string, ex: XMLHttpRequest)
		{
			console.error(type, ex.responseText)
		});
	}

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
	// Comment

	id('comment_cancel_btn').addEventListener('click', function ()
	{
		RemoveEditComment();
		(id('event_comment') as HTMLTextAreaElement).value = '';
		id('comment_preview').innerHTML = '';
	});

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
			router.navigate("", i18n("Planning"));
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

function ShowCalendarExport (event: EventApi): object
{
	var evt_start = toDateString(event.start).replace(/-/g, '');
	var evt_end = evt_start;
	if (event.end)
	{
		evt_end = toDateString(event.end).replace(/-/g, '');
	}

	var google_link = "https://calendar.google.com/calendar/u/0/r/eventedit?"+
	[
		"location="+encodeURIComponent(event.extendedProps.location),
		"text="+encodeURIComponent(event.title),
		"sprop=website:"+window.location.origin+"/event:"+event.id,
		"details="+encodeURIComponent(DOMPurify.sanitize(marked(event.extendedProps.description))),
		"dates="+evt_start+'/'+evt_end
	].join('&');

	var yahoo_link = "http://calendar.yahoo.com/?"+
	[
		"in_loc="+encodeURIComponent(event.extendedProps.location),
		"TITLE="+encodeURIComponent(event.title),
		"URL="+window.location.origin+"/event:"+event.id,
		"DESC="+encodeURIComponent(DOMPurify.sanitize(marked(event.extendedProps.description))),
		"ST="+evt_start,
		"ET="+evt_end,
		"v=60"
	].join('&');

	var links =
	[
		'<a href="'+google_link+'" target="_blank">Google</a>',
		'<a href="ics?event='+event.id+'">iCal</a>',
		'<a href="ics?event='+event.id+'">Android</a>',
		'<a href="ics?event='+event.id+'">Outlook</a>',
		'<a href="'+yahoo_link+'" target="_blank">Yahoo</a>'
	];

	// @ts-ignore html5tooltips
	var tooltip = new HTML5TooltipUIComponent();
	tooltip.set(
	{
		animateFunction: "spin",
		contentText: links.join('<HR/>'),
		stickTo: "bottom",
		target: id('event_ics')
	});
	tooltip.mount();
	tooltip.show();
	return tooltip;
}

function SubmitComment ()
{
	var textarea = id('event_comment') as HTMLTextAreaElement;
	var comment_post_error = id('comment_post_error');
	comment_post_error.style.display = 'none';
	var comment_send_btn = id('comment_send_btn');
	var editLatest = comment_send_btn.getAttribute("data-action") === "edit";
	var body =
	{
		event_id: current_event.event_id,
		comment: textarea.value,
		editLatest: editLatest
	};
	requestJson("POST", "/api/message", body,
	function ()
	{
		textarea.value = '';

		var comment_preview = id('comment_preview');
		comment_preview.innerHTML = '';
		comment_preview.classList.add('collapse');

		if (editLatest)
		{
			RemoveEditComment();
		}

		// Reload all comments because there might be new comments from others
		loadComments(current_event);
	},
	function (type: string, ex: XMLHttpRequest)
	{
		if (ex.status === 401)
		{
			window.location.assign('/login');
		}
		console.error(type, ex.responseText)
		comment_post_error.innerHTML = i18n('Unable to save');
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

function get_connected_user ()
{
	return window['connected_user'];
}

function SetBell (block): void
{
	var event_bell = id('event_bell');
	event_bell.className = block ? "far fa-bell-slash" : "fas fa-bell";
	event_bell.setAttribute('title', i18n(block ? 'NotificationsBlocked' : 'NotificationsNotBlocked'));
}

export function UpdateCommentPreview ()
{
	id('comment_preview').innerHTML = DOMPurify.sanitize(marked(this.value));
}

function RemoveEditComment ()
{
	id('comment_cancel_btn').classList.add('collapse');
	var comment_send_btn = id('comment_send_btn');
	comment_send_btn.classList.remove('edit');
	comment_send_btn.textContent = i18n('Send');
	comment_send_btn.removeAttribute("data-action");
}