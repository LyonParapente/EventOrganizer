import settings from './settings';
import { i18n } from './trads';
import { id } from './dom';

import * as L from 'leaflet';
// @ts-ignore
import * as esrileaflet from 'esri-leaflet/dist/esri-leaflet-debug.js';
import * as esrileafletgeocoder from 'esri-leaflet-geocoder';
import 'leaflet-fullscreen';

// @ts-ignore
L.esri = L.esri || esrileaflet;
// @ts-ignore
L.esri.Geocoding = esrileafletgeocoder;

L.Icon.Default.prototype.options.imagePath = "/static/css/leaflet/"; // for fusebox...

import 'leaflet/dist/leaflet.css';
import 'esri-leaflet-geocoder/dist/esri-leaflet-geocoder.css';
import 'leaflet-fullscreen/dist/leaflet.fullscreen.css';

var mapList: MapDictionary = {},
	sortie_RDV = <HTMLInputElement>id('sortie_RDV'),
	sortie_RDV_gps = <HTMLInputElement>id('sortie_RDV_gps'),
	spinner_RDV = id('spinner_RDV');

export function initMap (elem_id: string, edit: boolean, gps?: L.LatLngTuple, location?: string): void
{
	var defaultPoint: L.LatLngTuple = gps || settings.default_map_center;
	var map: L.Map, marker: L.Marker;
	if (Object.prototype.hasOwnProperty.call(mapList, elem_id))
	{
		map = mapList[elem_id].map;
		marker = mapList[elem_id].marker;
		resetMap(map, defaultPoint, marker);
	}
	else
	{
		var openstreetmap = L.tileLayer('https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
		{
			attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> | <a href="//openstreetmap.fr">OSM France</a>'
		});
		var opentopomap = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
		{
			attribution: '&copy; <a href="https://www.openstreetmap.org>/copyright">OpenStreetMap</a> | <a href="http://viewfinderpanoramas.org">SRTM</a> | &copy; <a href="https://opentopomap.org">OpenTopoMap</a>'
		});
		/*var googleSat = L.tileLayer('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
		{
			subdomains: ['mt0','mt1','mt2','mt3'],
			attribution: "Google, Images"
		});*/

		var tileLayers =
		{
			"OpenStreetMap": openstreetmap,
			// "Google Satellite": googleSat,
			"OpenTopoMap": opentopomap
		};

		if (settings.IGN_key)
		{
			var ignLayers: IgnLayers = {
				"IGN Satellite": {name: "ORTHOIMAGERY.ORTHOPHOTOS", key: "ortho"},
				"Plan IGN": {name: "GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2", key: "cartes", format: "image/png"},

				// Work only with key and referrer => Add "http://localhost:5000/" to allowed referrer in https://geoservices.ign.fr/ account key settings
				"IGN": {name: "GEOGRAPHICALGRIDSYSTEMS.MAPS"},
				"SCAN OACI": {name: "GEOGRAPHICALGRIDSYSTEMS.MAPS.SCAN-OACI"},
				"IGN Touristic Scan": {name: "GEOGRAPHICALGRIDSYSTEMS.MAPS.SCAN25TOUR"},
			};
			for (var niceName in ignLayers)
			{
				if (Object.prototype.hasOwnProperty.call(ignLayers, niceName))
				{
					var ignLayer = ignLayers[niceName];
					var ignTileLayer =	L.tileLayer(
						"https://wxs.ign.fr/"+(ignLayer.key||settings.IGN_key)+"/geoportail/wmts?" +
						"&REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0" +
						"&STYLE=normal" +
						"&TILEMATRIXSET=PM" +
						"&FORMAT="+(ignLayer.format||"image/jpeg") +
						"&LAYER="+ignLayer.name +
						"&TILEMATRIX={z}" +
						"&TILEROW={y}" +
						"&TILECOL={x}",
					{
						attribution : "IGN-F/Geoportail",
						tileSize : 256
					});
					tileLayers[niceName as keyof typeof tileLayers] = ignTileLayer;
				}
			}
		}

		map = L.map(elem_id,
		{
			center: defaultPoint,
			zoom: settings.default_map_zoom,
			fullscreenControl: true,
			layers: [openstreetmap]
		});
		map.zoomControl.setPosition('topright');
		L.control.scale().addTo(map);
		L.control.layers(tileLayers)
			.setPosition('bottomright')
			.addTo(map);

		map.on('fullscreenchange', function ()
		{
			// re-center on marker when making fullscreen or exiting
			map.setView(marker.getLatLng(), map.getZoom());
		});

		marker = L.marker(defaultPoint, {draggable: edit})
		marker.addTo(map);
		mapList[elem_id] = {map, marker};

		marker.on('click', function ()
		{
			var latlng = marker.getLatLng();
			var url = "http://maps.google.com/maps?daddr=loc:"+latlng.lat.toString()+"+"+latlng.lng.toString();
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
			searchControl.on('results', function (data: unknown)
			{
				var dataResults = (data as L.esri.Geocoding.Results).results;
				results.clearLayers();
				if (dataResults.length === 1)
				{
					const latlng = dataResults[0].latlng as L.LatLng;
					marker.setLatLng(latlng);
					onMarkerMove({latlng});
				}
				else
				{
					marker.removeFrom(map);
					for (var j = dataResults.length - 1; j >= 0; j--)
					{
						var searchMarker = L.marker(dataResults[j].latlng as L.LatLngExpression);
						results.addLayer(searchMarker);
						searchMarker.on('click', function (this: L.Marker)
						{
							const latlng = this.getLatLng();
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
					var address = result.address as unknown as ReverseGeocodeAddressResult; // @types/esri-leaflet-geocoder is incorrect so workaround
					sortie_RDV.value = address.Match_addr;
				});
			});

			sortie_RDV.addEventListener('change', function ()
			{
				findLocation(this.value, marker, map);
			});
			var timeoutID: NodeJS.Timeout;
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

function onMarkerMove (evt: L.LeafletEvent | {latlng: L.LatLng}): void
{
	var latlng = (evt as L.LeafletMouseEvent).latlng;
	var position = latlng.lat.toString()+', '+latlng.lng.toString();
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
			var bestResult = response.results[0] as NearbyResult;
			marker.addTo(map);
			marker.setLatLng(bestResult.latlng);
			map.flyToBounds(bestResult.bounds); // animation
		}
	});
}
