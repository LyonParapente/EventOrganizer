var mapList = {}, $sortie_RDV;
function initMap(elem_id, edit, gps)
{
	var defaultPoint = gps || settings.default_map_center;
	if (mapList.hasOwnProperty(elem_id))
	{
		map = mapList[elem_id].map;
		marker = mapList[elem_id].marker;

		// Reset positions
		map.setView(defaultPoint, settings.default_map_zoom);

		marker.off('move', onMarkerMove); // avoid issue with placeholder in edit mode
		marker.setLatLng(defaultPoint);
		marker.on('move', onMarkerMove);
	}
	else
	{
		map = L.map(elem_id,
		{
			center: defaultPoint,
			zoom: settings.default_map_zoom
		});
		map.zoomControl.setPosition('topright');
		L.control.scale().addTo(map);

		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
		{
			attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
		}).addTo(map);

		marker = L.marker(defaultPoint, {draggable: edit}).addTo(map);
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
			$sortie_RDV = $("#sortie_RDV");
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
				marker.setLatLng(e.latlng);
				onMarkerMove();
			});
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
