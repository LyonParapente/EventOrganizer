var mapList = {}, $sortie_RDV = $("#sortie_RDV");
function initMap(elem_id, edit, gps, location)
{
	var defaultPoint = gps || settings.default_map_center;
	if (mapList.hasOwnProperty(elem_id))
	{
		map = mapList[elem_id].map;
		marker = mapList[elem_id].marker;

		// Reset positions
		map.setView(defaultPoint, settings.default_map_zoom, {animate: false});

		if (!gps)
		{
			marker.remove(map);
		}
		marker.off('move', onMarkerMove); // avoid issue with placeholder in edit mode
		marker.setLatLng(defaultPoint);
		marker.on('move', onMarkerMove);
	}
	else
	{
		map = L.map(elem_id,
		{
			center: defaultPoint,
			zoom: settings.default_map_zoom,
			fullscreenControl: true
		});
		map.zoomControl.setPosition('topright');
		L.control.scale().addTo(map);

		map.on('fullscreenchange', function()
		{
			// re-center on marker when making fullscreen or exiting
			map.setView(marker.getLatLng());
		});

		L.tileLayer('https://{s}.tile.openstreetmap.de/tiles/osmde/{z}/{x}/{y}.png',
		{
			attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
		}).addTo(map);

		marker = L.marker(defaultPoint, {draggable: edit})
		if (gps || edit)
		{
			marker.addTo(map);
		}
		mapList[elem_id] = {map: map, marker: marker};

		marker.on('click', function()
		{
			var latlng = marker.getLatLng();
			var url = "http://maps.google.com/maps?daddr=loc:"+latlng.lat+"+"+latlng.lng;
			marker.unbindPopup();
			marker.bindPopup('<a href="'+url+'" target="_blank">Open in Google Maps</a>').openPopup();
		});

		if (edit)
		{
			marker.on('move', onMarkerMove);

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
				marker.addTo(map);
				marker.setLatLng(e.latlng);
				onMarkerMove();
			});

			$sortie_RDV.on('change', function()
			{
				var latlng = marker.getLatLng();
				if (latlng.lat === settings.default_map_center[0] &&
					latlng.lng === settings.default_map_center[1])
				{
					findLocation(this.value, marker, map);
				}
			});
		}
	}
	if (!edit)
	{
		if (!gps && location)
		{
			findLocation(location, marker, map);
		}
	}
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

function findLocation(text, marker, map)
{
	var proximity = L.latLng(settings.default_map_center);
	var proximity_radius = 100000;
	$("#spinner_RDV").show();
	L.esri.Geocoding.geocode().text(text).nearby(proximity, proximity_radius).run(function (error, response)
	{
		$("#spinner_RDV").hide();
		if (response.results.length > 0)
		{
			var bestResult = response.results[0];
			marker.addTo(map);
			marker.setLatLng(bestResult.latlng);
			//map.fitBounds(bestResult.bounds); // immediate
			map.flyToBounds(bestResult.bounds); // animation
		}
	});
}
