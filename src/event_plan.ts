import { i18n, i18n_inPlace, toDateString } from './trads';
import settings from './settings';
import { initMap } from './map';
import { init_categories } from './event_plan_categories';
import { init_colorPicker } from './event_plan_colorPicker';
import { router } from './routing';

var id: (string) => HTMLElement = document.getElementById.bind(document);

var sortie_date_start = id("sortie_date_start") as HTMLInputElement;
var sortie_date_end = id("sortie_date_end") as HTMLInputElement;

export function init_createEvent (): void
{
	var form: HTMLFormElement = document.querySelector("#createEventBody .needs-validation");
	// Submit an event
	form.addEventListener('submit', function ()
	{
		if (form.checkValidity())
		{
			// TODO: post ajax data
		}
		else
		{
			(form.querySelectorAll(":invalid")[0] as HTMLElement).focus();
		}
		form.classList.add('was-validated');

		// Do not reload page
		event.preventDefault();
		event.stopPropagation();
	});

	sortie_date_start.addEventListener('change', function ()
	{
		// https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/HTML5/Constraint_validation
		// Dates before this are disabled on mobile and forbidden on desktop validation
		sortie_date_end.setAttribute("min", (<HTMLInputElement><unknown>this).value);
	});
	sortie_date_start.setAttribute("min", toDateString(new Date()));

	init_categories();
	init_colorPicker();
}

export function planAnEvent (start_date: Date, end_date: Date): void
{
	var today = new Date();
	var todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
	if (start_date.getTime() < todayMidnight.getTime())
	{
		console.warn(i18n("Cannot create event in the past"));
		return;
	}

	var sortie_title = id("sortie_title") as HTMLInputElement;
	var sortie_RDV = id("sortie_RDV") as HTMLInputElement;
	var category = id("sortie_category") as HTMLButtonElement;
	category.innerHTML = 'None';

	i18n_inPlace(
	[
		"#createEventTitle",
		sortie_title.labels[0],
		(id("sortie_lieu") as HTMLInputElement).labels[0],
		sortie_RDV.labels[0],
		"#createEventBody .date",
		sortie_date_start.labels[0],
		sortie_date_end.labels[0],
		(id("sortie_heure") as HTMLInputElement).labels[0],
		(id("sortie_description") as HTMLTextAreaElement).labels[0],
		category,
		category.labels[0],
		"#sortie_save"
	]);

	// Reset submission checks
	var form = document.querySelector("#createEventBody form");
	form.classList.remove('was-validated');
	i18n_inPlace(form.querySelectorAll('.invalid-feedback'));

	// ----------------------
	// Set up fields

	var titles = settings.default_random_event_title;
	var title = titles[getRandomInt(0, titles.length)];
	sortie_title.value = title;

	sortie_RDV.setAttribute("placeholder", settings.default_location);
	sortie_RDV.value = '';

	sortie_date_start.value = toDateString(start_date);
	sortie_date_end.value = toDateString(end_date);
	sortie_date_end.setAttribute("min", sortie_date_start.value);

	router.navigate("event:new", i18n("Plan an event"));

	jQuery("#createEvent")
		.one('shown.bs.modal', function ()
		{
			initMap('sortie_map', true);
			sortie_title.focus();
		})
		.one('hide.bs.modal', function ()
		{
			router.navigate("planning", i18n("Planning"));
		})
		.modal('show');
}

/* Returns a random integer between the specified values.
The value is no lower than min (or the next integer greater than min if min isn't an integer),
and is less than (but not equal to) max. */
function getRandomInt(min: number, max: number): number
{
	min = Math.ceil(min);
	max = Math.floor(max);
	// The maximum is exclusive and the minimum is inclusive
	return Math.floor(Math.random() * (max - min)) + min;
}
