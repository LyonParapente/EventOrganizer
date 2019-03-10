$(function()
{
	var $calendar = $('#calendar'),
		$loading = $("#loading"),
		loadingTimer,
		DEV = typeof fakeData1 !== "undefined";

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
		unselectCancel: '', // TODO: https://fullcalendar.io/docs/unselectCancel

		eventColor: settings.default_event_color,
		displayEventTime: false,

		dayClick: function(date)
		{
			if (date.isSameOrAfter(moment(), 'day'))
			{
				planAnEvent(date);
			}
			else
			{
				alert(i18n("Cannot create event in the past"));
			}
		},
		select: function(startDate, endDate)
		{
			console.log('Selected ' + startDate.format() + ' to ' + endDate.format());
		},
		eventClick: function(calEvent)
		{
			alert('Event: ' + calEvent.title);
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

	var eventSource = './events.php';
	if (DEV)
	{
		eventSource = fakeData1;
	}
	$calendar.fullCalendar('addEventSource', eventSource);
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

function planAnEvent(date)
{
	var $sortie_title = $("#sortie_title");
	var $sortie_date = $("#sortie_date");
	var D = document.getElementById.bind(document);

	i18n_inPlace([
		D("eventPropertiesTitle"),
		$sortie_title[0].labels[0],
		D("sortie_lieu").labels[0],
		D("sortie_RDV").labels[0],
		$sortie_date[0].labels[0],
		D("sortie_heure").labels[0],
		D("sortie_description").labels[0],
		D("sortie_save")
	]);

	var titles = settings.default_random_event_title;
	var title = titles[getRandomInt(0, titles.length)];
	$sortie_title.val(title);

	$sortie_date.val(date.format());

	// https://getbootstrap.com/docs/4.1/getting-started/javascript/#programmatic-api
	$("#eventProperties").modal('show').on('shown.bs.modal', function ()
	{
		// Wait for first modal to be displayed
		initMap();
	});
}
