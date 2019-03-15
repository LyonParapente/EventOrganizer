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
		alert(i18n("Cannot create event in the past"));
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

	var date_start = calEvent.start.format();
	var date_end = (calEvent.end ? calEvent.end : calEvent.start).format();
	if (date_start === date_end)
	{
		$("#event_date_day").text(date_start);
		$("#event_date_from").hide();
		$("#event_date_to").hide();
		$("#event_date_the").show();
	}
	else
	{
		$("#event_date_start").text(date_start);
		$("#event_date_end").text(date_end);
		$("#event_date_from").show();
		$("#event_date_to").show();
		$("#event_date_the").hide();
	}

	if (!calEvent.time && !calEvent.location)
	{
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

	$eventProperties.modal('show').one('shown.bs.modal', function()
	{
		initMap('event_map', false, calEvent.gps);

		// Avoid keyboard popping on mobile
		//$("#event_comment").focus();
	});
}