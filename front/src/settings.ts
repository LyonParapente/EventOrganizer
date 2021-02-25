interface Settings
{
	lang: string,
	listDayAltFormat: object,
	default_event_color: string,
	default_random_event_title: string[],
	default_location: string,
	default_map_center: [number, number],
	default_map_zoom: number,
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
	categories:
	{
		default:
		{
			"sortie vol": '#9B0000',
			weekend: '#D50000',
			"3-5 jours": '#FF4E1B',
			cross: '#F38100',
			stage: 'F9B222',
			dune: '#F4DB6C',
			compétition: '#9BAE88',
			voyage: '#95C11F',
			"rando-vol": '#6ABF4B',
			itinérant: '#008D36',
			permanence: '#A5E5D9',
			club: '#00A887',
			REX: '#36A9E1',
			conférence: '#1D71B8',
			théorie: '#002E7D',
			ski: '#B9DBE5',
			escalade: '#9E968D',
			jeux: '#C19ADE',
			films: '#99E6D8',
			'coupe icare': '#6FCFEB',
			autre: '#F3EFA1',
			annulée: '#C1C1C1'
		}
	},
	unsplash_tags: ['paraglider'],
	IGN_key: 'o9q1uza84786tsx16keg17n0',
	international_prefix: '+33'
};
export default settings;