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
		eventClick: function(calEvent)
		{
			alert('Event: ' + calEvent.title);
		},
		eventDataTransform: function(event)
		{
			// Manage color according to category
			if (event.hasOwnProperty('category'))
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
				event.color = colorConf[event.category];
			}
			return event;
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

	$("#eventPropertiesBody .needs-validation").on('submit', function(e)
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

	i18n_inPlace([
		D("eventPropertiesTitle"),
		$sortie_title[0].labels[0],
		D("sortie_lieu").labels[0],
		D("sortie_RDV").labels[0],
		$("#eventPropertiesBody .date")[0],
		$sortie_date_start[0].labels[0],
		$sortie_date_end[0].labels[0],
		D("sortie_heure").labels[0],
		D("sortie_description").labels[0],
		D("sortie_save")
	]);

	var $form = $("#eventPropertiesBody form");
	$form.removeClass('was-validated');
	i18n_inPlace($form.find('.invalid-feedback'));

	var titles = settings.default_random_event_title;
	var title = titles[getRandomInt(0, titles.length)];
	$sortie_title.val(title);

	$("#sortie_RDV").attr("placeholder", settings.default_location).val('');

	$sortie_date_start.val(start_date.format());
	$sortie_date_end.val(end_date.format());
	$sortie_date_start.trigger('change'); // ensure "min" attribute is set

	$("#eventProperties").modal('show').one('shown.bs.modal', initMap);
}
