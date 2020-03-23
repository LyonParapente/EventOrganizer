import { i18n, i18n_inPlace, toDateString } from './trads';
import { getColor } from './event_plan_categories';
import { initMap } from './map';
import loadComments from './event_comments';
import settings from './settings';
import { router } from './routing';
import { EventApi } from '@fullcalendar/core';

var id = document.getElementById.bind(document);

export default function showEvent (calEvent: EventApi): void
{
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

	var isFinished = end.getTime() < new Date().getTime();
	loadComments(calEvent.id, isFinished);

	// Trads
	i18n_inPlace(["#event_comment"], "placeholder");
	i18n_inPlace(
	[
		"#event_rdv_time_title",
		"#event_rdv_location_title i",
		"#event_location_title i"
	], "title");

	// Reset submission checks
	var $eventProperties = $("#eventProperties");
	var $form = $eventProperties.find("form");
	$form.removeClass('was-validated');
	i18n_inPlace($form.find('.invalid-feedback'));

	// Fill event infos
	$("#event_title").text(calEvent.title);
	$("#event_description").html(calEvent.extendedProps.desc || i18n('No description'));
	var category = calEvent.extendedProps.category;
	if (category)
	{
		$("#event_category").text(category).css(
		{
			'backgroundColor': getColor(category),
			'color': 'white'
		});
	}
	else
	{
		$("#event_category").text('');
	}
	var user = calEvent.extendedProps.user;
	$("#event_author").text(user.name);
	var author_img = new Image();
	author_img.alt = user.name;
	author_img.src = "avatars/"+user.id+"-1.jpg";
	$("#event_author_img").attr("href", "user/"+user.id)
		.empty().append(author_img);

	var date_start = toDateString(start);
	var date_end = toDateString(end);
	if (date_start === date_end)
	{
		$("#event_date_start").text('');
		$("#event_date_end").text('');
		$("#event_date_day").text(date_start);
		$("#event_date_from").hide();
		$("#event_date_to").hide();
		$("#event_date_the").show();
	}
	else
	{
		$("#event_date_start").text(date_start);
		$("#event_date_end").text(date_end);
		$("#event_date_day").text('');
		$("#event_date_from").show();
		$("#event_date_to").show();
		$("#event_date_the").hide();
	}

	// ----------------------
	// Activity location

	var location = calEvent.extendedProps.location;
	var event_location_text = location || "";
	var $el = $("#event_location").text(event_location_text);
	var $el2 = $("#event_location2").text(event_location_text);
	if (location)
	{
		$("#event_location_box").show();
	}
	else
	{
		$("#event_location_box").hide();
	}

	// ----------------------
	// Rendez-vous location

	var time = calEvent.extendedProps.time;
	$("#event_rdv_time").text(time || "");
	if (time)
	{
		$("#event_rdv_time_box").show();
	}
	else
	{
		$("#event_rdv_time_box").hide();
	}

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
	$("#event_rdv_location").val(rdv_location_text).attr("placeholder", settings.default_location);
	$("#event_rdv_location_box").show();

	// ----------------------

	$el.show(); // for next time we show an event
	$el2.hide();
	$el2.css('height', 'auto');

	router.navigate("event:"+calEvent.id, i18n("EventTitle", calEvent.id));

	$eventProperties
		.one('shown.bs.modal', function ()
		{
			// Step 1 - Compute textarea height according to width
			var w = $el.width();
			$el.hide();
			$el2.show();
			$el2.width(w);

			// Step 2 - Adjust textarea height
			var el2 = $el2[0];
			$el2.css('height', el2.scrollHeight + (el2.offsetHeight - el2.clientHeight));

			// -----

			initMap('event_map', false, eP.gps, location);

			// Avoid keyboard popping on mobile
			// $("#event_comment").focus();
		})
		.one('hide.bs.modal', function ()
		{
			router.navigate("planning", i18n("Planning"));
		})
		.modal('show');

	// ----------------------
	// Clipboard copy

	ClipboardCopyLocation(id('event_location_title'), id('event_location2'));
	ClipboardCopyLocation(id('event_rdv_location_title'), id('event_rdv_location'));
}

function ClipboardCopyLocation (clickTarget: HTMLElement, copyTarget: HTMLInputElement)
{
	clickTarget.addEventListener("click", function ()
	{
		if (!copyTarget.value) {return;}

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

function ShowClipboarTooltip (element: HTMLElement, html: string)
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
