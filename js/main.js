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
		// wait for first modal to be displayed
		initMap();
	});
}

var map, marker;
function initMap()
{
	if (map)
	{
		// Reset positions
		map.setView(settings.default_map_center, settings.default_map_zoom);
		marker.setLatLng(settings.default_map_center);
	}
	else
	{
		map = L.map('sortie_map',
		{
			center: settings.default_map_center,
			zoom: settings.default_map_zoom
		});
		map.zoomControl.setPosition('topright');
		L.control.scale().addTo(map);

		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
		{
			attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
		}).addTo(map);

		marker = L.marker(settings.default_map_center, {draggable: true}).addTo(map);
		marker.on('move', onMarkerMove);
		marker.on('click', function()
		{
			var latlng = marker.getLatLng();
			var url = "http://maps.google.com/maps?daddr=loc:"+latlng.lat+"+"+latlng.lng;
			marker.unbindPopup();
			marker.bindPopup('<a href="'+url+'" target="_blank">Open in Google Maps</a>').openPopup();
		});

		var searchControl = new L.esri.Geocoding.geosearch(
		{
			position: 'topleft',
			useMapBounds: false, // difficult to get head around otherwise
			collapseAfterResult: true,
			expanded: false,
			placeholder: i18n("Search an address")
		}).addTo(map);

		var results = new L.LayerGroup().addTo(map);
		searchControl.on('results', function(data)
		{
			results.clearLayers();
			if (data.results.length === 1)
			{
				marker.setLatLng(data.results[0].latlng);
				onMarkerMove();
			}
			else
			{
				marker.removeFrom(map);
				for (var i = data.results.length - 1; i >= 0; i--)
				{
					var searchMarker = L.marker(data.results[i].latlng);
					results.addLayer(searchMarker);
					searchMarker.on('click', function()
					{
						marker.setLatLng(this.getLatLng());
						marker.addTo(map);
						onMarkerMove();
						results.clearLayers();
					});
				}
			}
		});

		map.on('click', function (e)
		{
			marker.setLatLng(e.latlng);
			onMarkerMove();
		});
	}
}

function onMarkerMove()
{
	marker.unbindPopup();
	var latlng = marker.getLatLng();
	$("#sortie_RDV").val(latlng.lat+', '+latlng.lng);
}
