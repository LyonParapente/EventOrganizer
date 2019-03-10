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
				buttonText: 'Liste mois'
			},
			listYear:
			{
				buttonText: 'Liste année',
				listDayAltFormat: 'DD/MM/YYYY'
			},
			month:
			{
				showNonCurrentDates: false,
				eventLimit: false // extend cell when too many events
			}
		},

		locale: 'fr',
		timezone: false,
		defaultView: 'month',
		defaultDate: '2014-06-12',

		selectable: true, // for both month & basicWeek views
		unselectAuto: true, // clicking elsewhere on the page will cause the current selection to be cleared
		unselectCancel: '', // TODO: https://fullcalendar.io/docs/unselectCancel

		eventColor: "#3a87ad",
		displayEventTime: false,

		dayClick: function(date)
		{
			if (date.isSameOrAfter(moment(), 'day'))
			{
				$("#sortie_date").val(date.format());

				// https://getbootstrap.com/docs/4.1/getting-started/javascript/#programmatic-api
				$("#eventProperties").modal('show');
			}
			else
			{
				// Cannot create event in the past
			}
		},
		select: function(startDate, endDate)
		{
			alert('selected ' + startDate.format() + ' to ' + endDate.format());
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