var $calendar;
$(function()
{
	$calendar = $('#calendar');
	var $loading = $("#loading"),
		loadingTimer;

	$calendar.fullCalendar(
	{
		themeSystem: 'bootstrap4',

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
					var d = moment().stripTime();
					planAnEvent(d, d);
				}
			}
		},

		locale: settings.lang,
		timezone: false,
		defaultView: 'month',
		defaultDate: new Date(),

		selectable: true, // for both month & basicWeek views
		unselectAuto: true, // clicking elsewhere on the page will cause the current selection to be cleared

		eventColor: settings.default_event_color,
		displayEventTime: false,
		/*events: './events.php',*/

		dayClick: function (date)
		{
			console.log("Day clicked "+date.format());
			planAnEvent(date, date);
		},
		select: function(startDate, endDate)
		{
			endDate.add(-1, 'days');
			if (startDate.format() !== endDate.format())
			{
				console.log('Selected ' + startDate.format() + ' to ' + endDate.format());
				planAnEvent(startDate, endDate);
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
		eventRender: function(event, element)
		{
			if (event.desc)
			{
				//with popper.min.js
				//$(element).tooltip({title: event.desc, html: true});
			}
		},
		loading: function(isLoading)
		{
			if (isLoading)
			{
				// Show only after a while, to avoid visual glitch when fast
				loadingTimer = setTimeout(function()
				{
					$loading.show();
				}, 200);
			}
			else
			{
				clearTimeout(loadingTimer);
				$loading.hide();
			}
		}
	});

	i18n_inPlace($("#eventProperties .trad"));
	i18n_inPlace($("#createEvent .trad"));

	$("#createEventBody .needs-validation").on('submit', function(e)
	{
		var form = e.target;
		if (form.checkValidity())
		{
			//TODO: post ajax data
		}
		else
		{
			$(form).find(":invalid").first().focus();
		}

		form.classList.add('was-validated');

		// Do not reload page
		event.preventDefault();
		event.stopPropagation();
	});

	$("#sortie_date_start").on('change', function()
	{
		// https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/HTML5/Constraint_validation
		// Dates before this are disabled on mobile and forbidden on desktop validation
		$("#sortie_date_end").attr("min", this.value);
	});

	// List of available categories
	$category_dd = $("#sortie_categories");
	var badges_spacing = "ml-2 mb-2";
	var colorConf = getColorConf();
	for (var category in colorConf)
	{
		if (colorConf.hasOwnProperty(category))
		{
			var a = document.createElement('a');
			a.className = "badge " + badges_spacing;
			a.style.backgroundColor = getColor(category);
			a.style.color = 'white';
			a.href = "#";
			a.appendChild(document.createTextNode(category));
			$category_dd.append(a);
		}
	}
	var $sortie_category = $("#sortie_category");
	$category_dd.parent().on("click", "a", function()
	{
		var $cloneBadge = $(this).clone();
		if ($cloneBadge.hasClass("badge"))
		{
			$cloneBadge.removeClass(badges_spacing);
		}
		else
		{
			$cloneBadge = i18n("None");
		}
		$sortie_category.html($cloneBadge);
	});

	$("#sortie_color_box").colorpicker({format: 'hex', useAlpha: false, inline: true, autoInputFallback: false}).on("change colorpickerChange", function(event)
	{
		if (event.color)
		{
			var colorBox = $("<div>").css(
			{
				display: 'inline-block',
				backgroundColor: event.color.toString(),
				color: event.color.isDark() ? 'white' : 'black'
			}).text(event.color.toString());
			$sortie_category.empty().append(colorBox);
		}
		else if (event.target.value.match(/^#[a-fA-F0-9]{6}$/))
		{
			// User is typing something
			colorPicker.setValue(event.target.value); // trigger colorpickerChange
		}
	});
	var colorPicker = $("#sortie_color_box").data('colorpicker');
	colorPicker.hide(); // default state
	$("#sortie_color").on('focus', function()
	{
		colorPicker.show();
	});

	$sortie_category.parent().on('show.bs.dropdown', function()
	{
		var text = $sortie_category.text();
		var val = text.indexOf('#') === 0 ? text : '';
		$("#sortie_color").val(val);
	}).on('hide.bs.dropdown', function (event)
	{
		if (event.clickEvent && event.clickEvent.target)
		{
			var target = event.clickEvent.target;
			if (target.id != 'sortie_color_btn' && $(target).parents("#sortie_color_box").length)
			{
				event.preventDefault();
				return false;
			}
		}
		colorPicker.hide();
	});

	var $event_rdv_location_title = $('#event_rdv_location_title');
	$event_rdv_location_title.popover({content: i18n('Copied to clipboard!'), placement: 'top', html: true, trigger: 'manual'});
	$event_rdv_location_title.on("click", function()
	{
		var el = document.getElementById('event_rdv_location');
		if (!el.value) {return;}

		el.select();
		document.execCommand('copy');
		el.setSelectionRange(0, 0);

		var url = "http://maps.google.com/maps?daddr="+encodeURIComponent(el.value);
		var popover_link = '<br/><a href="'+url+'" target="_blank">'+i18n('Open in Google Maps')+'</a>';
		$event_rdv_location_title.attr('data-content', i18n('Copied to clipboard!')+popover_link);

		$event_rdv_location_title.popover('show');
		setTimeout(function()
		{
			$event_rdv_location_title.popover('hide');
		}, 2000);
	});
});

/* Returns a random integer between the specified values.
The value is no lower than min (or the next integer greater than min if min isn't an integer),
and is less than (but not equal to) max. */
function getRandomInt(min, max)
{
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
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

function planAnEvent(start_date, end_date)
{
	if (!start_date.isSameOrAfter(moment(), 'day'))
	{
		console.warn(i18n("Cannot create event in the past"));
		return;
	}

	var $sortie_title = $("#sortie_title");
	var $sortie_date_start = $("#sortie_date_start");
	var $sortie_date_end = $("#sortie_date_end");
	var D = document.getElementById.bind(document);

	i18n_inPlace(
	[
		D("createEventTitle"),
		$sortie_title[0].labels[0],
		D("sortie_lieu").labels[0],
		D("sortie_RDV").labels[0],
		$("#createEventBody .date")[0],
		$sortie_date_start[0].labels[0],
		$sortie_date_end[0].labels[0],
		D("sortie_heure").labels[0],
		D("sortie_description").labels[0],
		D("sortie_category").labels[0],
		D("sortie_save")
	]);

	$("#sortie_category").empty().text(i18n("None"));

	var $form = $("#createEventBody form");
	$form.removeClass('was-validated');
	i18n_inPlace($form.find('.invalid-feedback'));

	var titles = settings.default_random_event_title;
	var title = titles[getRandomInt(0, titles.length)];
	$sortie_title.val(title);

	$("#sortie_RDV").attr("placeholder", settings.default_location).val('');

	$sortie_date_start.val(start_date.format());
	$sortie_date_end.val(end_date.format());
	$sortie_date_start.trigger('change'); // ensure "min" attribute is set

	$("#createEvent").modal('show').one('shown.bs.modal', function()
	{
		initMap('sortie_map', true);
		$("#sortie_title").focus();
	})
}

function showEvent(calEvent)
{
	if (calEvent.end)
	{
		calEvent.end.add(-1, 'days');
	}
	else
	{
		calEvent.end = calEvent.start;
	}

	var isFinished = calEvent.end.isBefore(moment(), 'day');
	loadEventComments(calEvent.id, isFinished);

	i18n_inPlace(["#event_comment"], "placeholder");
	i18n_inPlace(
	[
		"#event_rdv_time_title",
		"#event_rdv_location_title i",
		"#event_location_title i"
	], "title");

	var $eventProperties = $("#eventProperties");
	var $form = $eventProperties.find("form");
	$form.removeClass('was-validated');
	i18n_inPlace($form.find('.invalid-feedback'));

	$("#event_title").text(calEvent.title);
	$("#event_description").html(calEvent.desc || i18n('No description'));
	if (calEvent.category)
	{
		$("#event_category").text(calEvent.category).css(
		{
			'backgroundColor': getColor(calEvent.category),
			'color': 'white'
		});
	}
	else
	{
		$("#event_category").text('');
	}
	$("#event_author").text(calEvent.user.name);
	var author_img = new Image();
	author_img.alt = calEvent.user.name;
	author_img.src = "avatars/"+calEvent.user.id+"-1.jpg";
	$("#event_author_img").attr("href", "user/"+calEvent.user.id)
		.empty().append(author_img);

	var date_start = calEvent.start.format('L');
	var date_end = calEvent.end.format('L');
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

	//----------------------
	// Activity location

	var event_location_text = calEvent.location || "";
	var $el = $("#event_location").text(event_location_text);
	var $el2 = $("#event_location2").text(event_location_text);
	if (calEvent.location)
	{
		$("#event_location_box").show();
	}
	else
	{
		$("#event_location_box").hide();
	}

	//----------------------
	// Rendez-vous location

	$("#event_rdv_time").text(calEvent.time || "");
	if (calEvent.time)
	{
		$("#event_rdv_time_box").show();
	}
	else
	{
		$("#event_rdv_time_box").hide();
	}

	var rdv_location_text = '';
	if (calEvent.gps || calEvent.gps_location)
	{
		if (calEvent.gps_location)
		{
			rdv_location_text = calEvent.gps_location;
		}
		else
		{
			rdv_location_text = calEvent.gps.join(', ');
		}
	}
	else
	{
		// Retro-compatibility with old events
		rdv_location_text = calEvent.location || "";
	}
	$("#event_rdv_location").val(rdv_location_text).attr("placeholder", settings.default_location);
	$("#event_rdv_location_box").show();

	//----------------------

	$el.show(); // for next time we show an event
	$el2.hide();
	$el2.css('height', 'auto');

	$eventProperties.one('shown.bs.modal', function()
	{
		// Step 1 - Compute textarea height according to width
		var w = $el.width();
		$el.hide();
		$el2.show();
		$el2.width(w);

		// Step 2 - Adjust textarea height
		var el2 = $el2[0];
		$el2.css('height', el2.scrollHeight + (el2.offsetHeight - el2.clientHeight));

		//---

		// Retro-compatibility with old events
		var location_text = calEvent.gps_location || calEvent.location;
		initMap('event_map', false, calEvent.gps, location_text);

		// Avoid keyboard popping on mobile
		//$("#event_comment").focus();
	}).modal('show');
}

function loadEventComments(id, isFinished)
{
	var $errorBox = $("#event_comments_error").hide();
	$("#event_comment_avatar").attr(
	{
		// TODO: replace by current user id
		"alt": "Thibault ROHMER",
		"src": "avatars/4145-1.jpg",
		"height": 110
	});

	var event_comments = document.getElementById('event_comments');
	event_comments.innerHTML = '<div class="spinner-border m-auto" role="status"></div>';

	var $event_participants = $("#event_participants").empty();
	var $event_interested = $("#event_interested").empty();

	//TODO: call server side
	jQuery.getJSON("data/Event_"+id+".json", function(data)
	{
		var a, i, avatar;
		event_comments.innerHTML = ''; // rendering optim to avoid repaint in .always()
		for (i = 0; i < data.comments.length; ++i)
		{
			var comment = data.comments[i],
				userid = comment.user,
				username = data.users[userid];

			if (!username)
			{
				console.warn("Missing user "+userid);
			}

			var dateText = moment(comment.date).calendar();
			if (dateText.indexOf(' ') === -1)
			{
				dateText = i18n('The ') + dateText + i18n(' at ') + moment(comment.date).format('LT')
			}
			dateText = dateText.replace(':', 'h');

			var groupitem = document.createElement('div');
			groupitem.className = 'list-group-item p-1 d-flex';
				var d = document.createElement('div');
					a = document.createElement('a');
					a.href = "user/"+userid;
						avatar = new Image();
						avatar.src = "avatars/"+userid+"-2.jpg";
						avatar.alt = username;
					a.appendChild(avatar);
				d.appendChild(a);
				groupitem.appendChild(d);

				var col = document.createElement('div');
				col.className = 'col';
					var comment_infos = document.createElement('span');
					comment_infos.className = 'border-bottom border-light';
						a = document.createElement('a');
						a.href = "user/"+userid;
						a.appendChild(document.createTextNode(username));
					comment_infos.appendChild(a);
					comment_infos.appendChild(document.createTextNode(' - ' + dateText));
					
					col.appendChild(comment_infos);
					var p = document.createElement("p");
					p.className = 'blockquote my-1 text-dark';
					p.appendChild(document.createTextNode(comment.comment));
					p.innerHTML = p.innerHTML.replace(/\n/g, '<br/>');
				col.appendChild(p);
			groupitem.appendChild(col);
			event_comments.appendChild(groupitem);
		}

		data.participants = data.participants || [];
		var participants_badge = $('<span class="badge badge-success"></span>').text(data.participants.length);
		var participants_button = isFinished ? '' : $('<button type="button" class="btn btn-outline-info float-right"></button>').text(i18n("I'm in"));
		var participants_header = $("<h4>").text(i18n("Participants ")).append(participants_badge).append(participants_button);
		$event_participants.append(participants_header);
		for (i = 0; i < data.participants.length; ++i)
		{
			var participant = data.participants[i];
			if (data.users.hasOwnProperty(participant))
			{
				a = document.createElement('a');
				a.href = "user/"+participant;
					var avatar = new Image();
					avatar.src = "avatars/"+participant+"-2.jpg";
					avatar.alt = data.users[participant];
					avatar.className = "mr-1 mb-1";
				a.appendChild(avatar);
				$event_participants.append(a);
			}
			else
			{
				console.warn("Missing participant user "+participant);
			}
		}

		data.interested = data.interested || [];
		var interested_badge = $('<span class="badge badge-info"></span>').text(data.interested.length);
		var interested_button = isFinished ? '' : $('<button type="button" class="btn btn-outline-info float-right"></button>').text(i18n("I'm interested"));
		var interested_header = $("<h4>").text(i18n("Interested ")).append(interested_badge).append(interested_button);
		$event_interested.append(interested_header);
		for (i = 0; i < data.interested.length; ++i)
		{
			var interested = data.interested[i];
			if (data.users[interested])
			{
				a = document.createElement('a');
				a.href = "user/"+interested;
					var avatar = new Image();
					avatar.src = "avatars/"+interested+"-2.jpg";
					avatar.alt = data.users[interested];
					avatar.className = "mr-1 mb-1";
				a.appendChild(avatar);
				$event_interested.append(a);
			}
			else
			{
				console.warn("Missing interested user "+interested);
			}
		}
	}).fail(function(o, type, ex)
	{
		console.error(ex);
		$errorBox.show();
		$errorBox.clone().removeAttr("id").appendTo($event_participants);
	}).always(function()
	{
		$(".spinner-border, event_comments").remove();
	});;
}
