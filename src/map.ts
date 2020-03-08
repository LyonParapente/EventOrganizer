import settings from './settings';
import { i18n, i18n_inPlace } from './trads';

declare var L; // Leaflet.js

var map,
	marker,
	mapList = {},
	sortie_RDV = <HTMLInputElement>document.getElementById("sortie_RDV");

export function initMap(elem_id, edit, gps?, location?)
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
			marker.bindPopup('<a href="'+url+'" target="_blank">'+i18n('Open in Google Maps')+'</a>').openPopup();
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

			sortie_RDV.addEventListener('change', function()
			{
				findLocation(this.value, marker, map);
			});
			var timeoutID = null;
			sortie_RDV.addEventListener('keyup', function()
			{
				clearTimeout(timeoutID);
				timeoutID = setTimeout(function()
				{
					findLocation(sortie_RDV.value, marker, map);
				}, 400);
			});

			i18n_inPlace(['#sortie_RDV_reset']);
			document.getElementById('sortie_RDV_reset').addEventListener('click', function()
			{
				sortie_RDV.value = '';
				map.setView(defaultPoint, settings.default_map_zoom, {animate: false});
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
	if (sortie_RDV.value.length === 0 || sortie_RDV.value.match(/\d+\.\d+, \d+\.\d+/))
	{
		sortie_RDV.value = latlng.lat+', '+latlng.lng;
	}
}

function findLocation(text, marker, map)
{
	var proximity = L.latLng(settings.default_map_center);
	var proximity_radius = 100000;
	var spinner_RDV = document.getElementById('spinner_RDV');
	spinner_RDV.style.display = 'block';
	L.esri.Geocoding.geocode().text(text).nearby(proximity, proximity_radius).run(function (error, response)
	{
		spinner_RDV.style.display = 'none';
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
