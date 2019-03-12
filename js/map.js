var map, marker, $sortie_RDV;
function initMap()
{
	if (map)
	{
		// Reset positions
		map.setView(settings.default_map_center, settings.default_map_zoom);

		marker.off('move', onMarkerMove); // avoid issue with placeholder
		marker.setLatLng(settings.default_map_center);
		marker.on('move', onMarkerMove);
	}
	else
	{
		$sortie_RDV = $("#sortie_RDV");
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
	// Map unfortunately has de-focus the title field
	$("#sortie_title").focus();
}

function onMarkerMove()
{
	marker.unbindPopup();
	var latlng = marker.getLatLng();
	$sortie_RDV.val(function (i, value)
	{
		if (value.length === 0 || value.match(/\d+\.\d+, \d+\.\d+/))
		{
			return latlng.lat+', '+latlng.lng;
		}
		return value;
	});
}
