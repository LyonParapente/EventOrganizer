interface Settings
{
	lang: string,
	listDayAltFormat: object,
	default_event_color: string,
	default_random_event_title: string[],
	default_location: string,
	default_map_center: [number, number],
	default_map_zoom: number,
	default_theme: string,
	categories:
	{
		default:
		{
			[key: string]: string
		}
	},
	unsplash_tags: string[],
	IGN_key: string,
	international_prefix: string
};

const settings: Settings =
{
	lang: "fr", // see `trads` under
	listDayAltFormat: // https://fullcalendar.io/docs/date-formatting
	{
		month: 'long'
	},
	default_event_color: "#6E6E6E",
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
			"sortie vol": '#005CB9',
			weekend: '#006BC0',
			"3-5 jours": '#007AC7',
			cross: '#3B89CE',
			stage: '#6099D5',
			dune: '#7EA9DC',
			compétition: '#99B9E3',
			voyage: '#B3CAEA',
			"rando-vol": '#CCDBF1',
			itinérant: '#E5ECF7',
			permanence: '#007481',
			club: '#81B8BE',
			REX: '#00B189',
			conférence: '#6ACCAF',
			théorie: '#B8E6D6',
			ski: '#80BC00',
			escalade: '#9DC944',
			jeux: '#B2D46C',
			films: '#C6DE91',
			'coupe icare': '#D9E9B5',
			autre: '#ECF3D9',
			annulée: '#AAAAAA'
		}
	},
	unsplash_tags: ['paraglider'],
	IGN_key: 'o9q1uza84786tsx16keg17n0',
	international_prefix: '+33'
};
export default settings;