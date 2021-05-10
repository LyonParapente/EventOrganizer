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
		[key: string]:
		{
			[key: string]: string
		}
	},
	use_unsplash: boolean,
	unsplash_tags: string[],
	IGN_key: string,
	international_prefix: string
}
