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
			left: 'listMonth listYear'
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

function getColor(category)
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
	return colorConf[category];
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
		D("sortie_save")
	]);

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
	loadEventComments(calEvent.id);
	var $eventProperties = $("#eventProperties");

	i18n_inPlace($eventProperties.find('.trad'));
	i18n_inPlace(["#event_comment"], "placeholder");
	i18n_inPlace(
	[
		"#event_time_title",
		"#event_location_title"
	], "title");

	var $form = $("#eventProperties form");
	$form.removeClass('was-validated');
	i18n_inPlace($form.find('.invalid-feedback'));

	$("#event_title").text(calEvent.title);
	$("#event_description").html(calEvent.desc);
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
	$("#event_author").text(calEvent.by);

	var date_start = calEvent.start.format('L');
	var date_end = (calEvent.end ? calEvent.end : calEvent.start).format('L');
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
		date_end = moment(calEvent.end).add(-1, 'days').format('L');
		$("#event_date_start").text(date_start);
		$("#event_date_end").text(date_end);
		$("#event_date_day").text('');
		$("#event_date_from").show();
		$("#event_date_to").show();
		$("#event_date_the").hide();
	}

	if (!calEvent.time && !calEvent.location)
	{
		$("#event_time").text('');
		$("#event_location").text('');
		$("#event_rdv_infos").hide();
		$("#event_map").hide();
	}
	else
	{
		$("#event_time").text(calEvent.time || "");
		$("#event_location").text(calEvent.location || "");
		$("#event_rdv_infos").show();
		$("#event_map").show();
	}

	var $el = $("#event_location");
	$el.css('height', 'auto'); // step 1

	$eventProperties.modal('show').one('shown.bs.modal', function()
	{
		// Adjust height of location - step 2
		var el = $el[0];
		$el.css('height', el.scrollHeight + (el.offsetHeight - el.clientHeight));

		initMap('event_map', false, calEvent.gps, calEvent.location);

		// Avoid keyboard popping on mobile
		//$("#event_comment").focus();
	});
}

function loadEventComments(id)
{
	var $errorBox = $("#event_comments_error").hide();
	$("#event_comment_avatar").attr(
	{
		// TODO: replace by current user id
		"alt": "Thibault ROHMER",
		"src": "avatars/4145-1.jpg",
		"height": 110
	});
	//TODO: view avatar of person who proposed the event, even if (s)he didn't comment

	var event_comments = document.getElementById('event_comments');
	event_comments.innerHTML = '';

	//TODO: call server side
	//TODO: loading spinner why loading comments
	jQuery.getJSON("js/test/fakeData_Event_"+id+".json", function(data)
	{
		for (var i = 0; i < data.comments.length; ++i)
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
					var a = document.createElement('a');
					a.href = "user/"+userid;
						var avatar = new Image();
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

		for (i = 0; i < data.participants.length; ++i)
		{
			var participant = data.participants[i];
			if (!data.users[participant])
			{
				console.warn("Missing user "+participant);
			}
		}

		//TODO: use data.participants
	}).fail(function(o, type, ex)
	{
		console.error(ex);
		$errorBox.show();
	});
}
