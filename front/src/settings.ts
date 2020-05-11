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
	IGN_key: string
};

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
	categories:
	{
		default:
		{
			"sortie vol": "#3A87AD",
			permanence: '#5FDCE2',
			club: '#00C400',
			weekend: '#FF9F89',
			stage: 'green',
			voyage: '#8D00FF',
			conference: '#FF4848',
			theorie: '#C0B701',
			dune: '#FF9900',
			ski: '#662C67',
			escalade: '#FF99CC',
			jeux: '#8894F9',
			annulée: '#8A8A8A',
			autre: '#FB6F46'
		}
	},
	unsplash_tags: ['paragliding'],
	IGN_key: ''// 'o9q1uza84786tsx16keg17n0'
};
export default settings;