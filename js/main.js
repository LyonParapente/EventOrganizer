$(function()
{
	var $calendar = $('#calendar'),
		$themeSelector = $('#themeSelector'),
		$loading = $("#loading"),
		loadingTimer;

	var favoriteTheme = GetThemeCookie();
	if (favoriteTheme)
	{
		// Change combo
		$themeSelector.children("option")
			.removeAttr('selected')
			.filter("[value="+favoriteTheme+"]")
			.attr("selected", true);
	}

	$themeSelector.on("change", function()
	{
		SetTheme(this.value);
	});

	SetTheme(favoriteTheme || $themeSelector.val());

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
		events: './events.php',

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

	var $currentStylesheet;
	function SetTheme(themeName)
	{
		var stylesheetUrl = "css/themes/"+themeName+".bootstrap.min.css";
		var $stylesheet = $('<link rel="stylesheet" href="' + stylesheetUrl + '"/>').appendTo('head');

		WhenStylesheetLoaded($stylesheet[0], function()
		{
			if ($currentStylesheet)
			{
				$currentStylesheet.remove();
			}
			$currentStylesheet = $stylesheet;

			var date = new Date();
			var nbDays = 400; // cookie expiration
			date.setTime(date.getTime()+(nbDays*24*60*60*1000));
			var expires = "; expires="+date.toGMTString();
			document.cookie = "theme=" + themeName + expires;
		});
	}

	function GetThemeCookie()
	{
		return document.cookie.replace(/(?:(?:^|.*;\s*)theme\s*\=\s*([^;]*).*$)|^.*$/, "$1");
	}

	function WhenStylesheetLoaded(linkNode, callback)
	{
		var isReady = false;
		function ready()
		{
			if (!isReady)
			{
				// avoid double-call
				isReady = true;
				callback();
			}
		}

		linkNode.onload = ready; // does not work cross-browser
		setTimeout(ready, 2000); // max wait. also handles browsers that don't support onload
	}



	$calendar.fullCalendar('addEventSource',
	[
		{
			title: 'All Day Event',
			start: '2014-06-01'
		},
		{
			title: 'Long Event',
			start: '2014-06-07',
			end: '2014-06-10'
		},
		{
			id: 999,
			title: 'Repeating Event',
			start: '2014-06-09T16:00:00'
		},
		{
			title: 'AAAA',
			start: '2014-06-09T09:00:00'
		},
		{
			title: 'BBBB',
			start: '2014-06-09T09:00:00'
		},
		{
			title: 'CCCC',
			start: '2014-06-09T09:00:00'
		},
		{
			title: 'DDDD',
			start: '2014-06-09T09:00:00'
		},
		{
			title: 'EEEE',
			start: '2014-06-09T09:00:00'
		},
		{
			title: 'FFFF',
			start: '2014-06-09T09:00:00'
		},
		{
			id: 999,
			title: 'Repeating Event',
			start: '2014-06-16T16:00:00'
		},
		{
			title: 'Dune',
			start: '2014-06-18',
			end: '2014-06-22',
			color: '#ff9f89'
		},
		{
			title: 'Meeting',
			start: '2014-06-12T10:30:00',
			end: '2014-06-12T12:30:00'
		},
		{
			title: 'Lunch',
			start: '2014-06-12T12:00:00'
		},
		{
			title: 'Birthday Party',
			start: '2014-06-13T07:00:00',
			allDay: true
		},
		{
			title: 'Click for Google',
			url: 'http://google.com/',
			start: '2014-06-28'
		},
		{
			title: 'Bloop',
			start: '2018-01-22'
		}
	]);

});