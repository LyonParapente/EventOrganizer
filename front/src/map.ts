import settings from './settings';
import { i18n } from './trads';

/// <reference types="leaflet" />
/// <reference types="esri-leaflet" />
/// <reference types="esri-leaflet-geocoder" />

var mapList = {},
	id: (string) => HTMLElement = document.getElementById.bind(document),
	sortie_RDV = <HTMLInputElement>id('sortie_RDV'),
	sortie_RDV_gps = <HTMLInputElement>id('sortie_RDV_gps'),
	spinner_RDV = id('spinner_RDV');

export function initMap (elem_id: string, edit: boolean, gps?: L.LatLngTuple, location?: string): void
{
	var defaultPoint: L.LatLngTuple = gps || settings.default_map_center;
	var map: L.Map, marker: L.Marker;
	if (mapList.hasOwnProperty(elem_id))
	{
		map = mapList[elem_id].map;
		marker = mapList[elem_id].marker;

		if (!gps)
		{
			marker.remove();
		}
		resetMap(map, defaultPoint, marker);
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

		map.on('fullscreenchange', function ()
		{
			// re-center on marker when making fullscreen or exiting
			map.setView(marker.getLatLng(), map.getZoom());
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
		mapList[elem_id] = {map, marker};

		marker.on('click', function ()
		{
			var latlng = marker.getLatLng();
			var url = "http://maps.google.com/maps?daddr=loc:"+latlng.lat+"+"+latlng.lng;
			marker.unbindPopup();
			marker.bindPopup('<a href="'+url+'" target="_blank">'+i18n('Open in Google Maps')+'</a>').openPopup();
		});

		if (edit)
		{
			marker.on('move', onMarkerMove);
			marker.on('movestart', () => {marker.unbindPopup();});

			var searchControl = L.esri.Geocoding.geosearch(
			{
				position: 'topleft',
				useMapBounds: false, // difficult to get head around otherwise
				collapseAfterResult: true,
				expanded: false,
				placeholder: i18n("Search an address")
			}).addTo(map);

			var results = new L.LayerGroup().addTo(map);
			searchControl.on('results', function (data)
			{
				// data is of type L.esri.Geocoding.Results
				var dataResults = (data as any).results;
				results.clearLayers();
				if (dataResults.length === 1)
				{
					let latlng = dataResults[0].latlng;
					marker.setLatLng(latlng);
					onMarkerMove({latlng});
				}
				else
				{
					marker.removeFrom(map);
					for (var i = dataResults.length - 1; i >= 0; i--)
					{
						var searchMarker = L.marker(dataResults[i].latlng);
						results.addLayer(searchMarker);
						searchMarker.on('click', function ()
						{
							let latlng = this.getLatLng();
							marker.setLatLng(latlng);
							marker.addTo(map);
							onMarkerMove({latlng});
							results.clearLayers();
						});
					}
				}
			});

			map.on('click', function (e: L.LeafletMouseEvent)
			{
				marker.addTo(map);
				marker.setLatLng(e.latlng);
				onMarkerMove({latlng: e.latlng});

				spinner_RDV.style.display = 'block';
				L.esri.Geocoding.geocodeService().reverse().latlng(e.latlng).run(function (error, result)
				{
					spinner_RDV.style.display = 'none';
					if (error) {return;}
					sortie_RDV.value = (result.address as any).Match_addr;
				});
			});

			sortie_RDV.addEventListener('change', function ()
			{
				findLocation(this.value, marker, map);
			});
			var timeoutID = null;
			sortie_RDV.addEventListener('keyup', function ()
			{
				clearTimeout(timeoutID);
				timeoutID = setTimeout(function()
				{
					findLocation(sortie_RDV.value, marker, map);
				}, 400);
			});

			id('sortie_RDV_reset').addEventListener('click', function ()
			{
				sortie_RDV.value = '';
				resetMap(map, defaultPoint, marker);
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

function resetMap (map: L.Map, point: L.LatLngTuple, marker: L.Marker): void
{
	map.setView(point, settings.default_map_zoom, {animate: false});
	marker.off('move', onMarkerMove); // avoid issue with placeholder in edit mode
	marker.setLatLng(point);
	marker.on('move', onMarkerMove);
}

function onMarkerMove (evt): void
{
	var position = evt.latlng.lat+', '+evt.latlng.lng;
	sortie_RDV_gps.value = position;
	if (sortie_RDV.value.length === 0 || sortie_RDV.value.match(/\d+\.\d+, \d+\.\d+/))
	{
		sortie_RDV.value = position;
	}
}

function findLocation (text: string, marker: L.Marker, map: L.Map): void
{
	var proximity = L.latLng(settings.default_map_center);
	var proximity_radius = 100000;
	spinner_RDV.style.display = 'block';
	L.esri.Geocoding.geocode().text(text).nearby(proximity, proximity_radius).run(function (error, response)
	{
		spinner_RDV.style.display = 'none';
		if (response.results.length > 0)
		{
			var bestResult = response.results[0];
			marker.addTo(map);
			marker.setLatLng(bestResult.latlng);
			map.flyToBounds(bestResult.bounds); // animation
		}
	});
}
