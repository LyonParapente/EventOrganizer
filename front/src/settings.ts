const settings: Settings =
{
	lang: "fr", // see `trads` under
	listDayAltFormat: // https://fullcalendar.io/docs/date-formatting
	{
		month: 'long'
	},
	default_event_color: "#3A87AD",
	default_random_event_title:
	[
		"Allons voler ",
		"Ca vole ",
		"Let's Fly",
		"Sortie autour de ",
		"Sortie vers ",
		"Qui veut voler ?"
	],
	default_location: "La Halle Mode & Chaussures | Bron",
	default_map_center: [45.721892, 4.919573],
	default_map_zoom: 14,
	default_theme: "flatly",
	categories:
	{
		default:
		{
			"sortie vol": '#3A87AD',
			"rando-vol": '#B9EB1A',
			gonflage: '#BD2323',
			cross: '#EB2DF5',
			permanence: '#5FDCE2',
			club: '#00C400',
			weekend: '#FF9F89',
			"3-5 jours": '#007AC7',
			itinérant: '#D29BFF',
			films: '#AFD853',
			'coupe icare': '#D9E9B5',
			stage: 'green',
			voyage: '#8D00FF',
			compétition: '#212529',
			REX: '#FBEA25',
			conférence: '#FF4848',
			théorie: '#C0B701',
			dune: '#FF9900',
			ski: '#662C67',
			escalade: '#FF99CC',
			jeux: '#8894F9',
			annulée: '#8A8A8A',
			autre: '#FB6F46'
		}
	},
	use_unsplash: false,
	unsplash_tags: ['paraglider'],
	IGN_key: 'h62ss3f9nubg3eo7udzium9n',
	international_prefix: '+33'
};
export default settings;
