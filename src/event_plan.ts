import { i18n, i18n_inPlace, toDateString } from './trads';
import settings from './settings';
import { initMap } from './map';

var id = document.getElementById.bind(document);

function planAnEvent(start_date, end_date)
{
	if (start_date.getTime() < new Date().getTime())
	{
		console.warn(i18n("Cannot create event in the past"));
		return;
	}

	var sortie_title = id("sortie_title");
	var sortie_date_start = id("sortie_date_start");
	var sortie_date_end = id("sortie_date_end");
	var sortie_RDV = id("sortie_RDV");

	i18n_inPlace(
	[
		"#createEventTitle",
		sortie_title.labels[0],
		id("sortie_lieu").labels[0],
		sortie_RDV.labels[0],
		"#createEventBody .date",
		sortie_date_start.labels[0],
		sortie_date_end.labels[0],
		id("sortie_heure").labels[0],
		id("sortie_description").labels[0],
		id("sortie_category").labels[0],
		"#sortie_save"
	]);

	var category = id("sortie_category");
	category.innerHTML = '';
	category.appendChild(document.createTextNode(i18n("None")));

	var form = document.querySelector("#createEventBody form");
	form.classList.remove('was-validated');
	i18n_inPlace(form.querySelector('.invalid-feedback'));

	var titles = settings.default_random_event_title;
	var title = titles[getRandomInt(0, titles.length)];
	sortie_title.value = title;

	sortie_RDV.setAttribute("placeholder", settings.default_location);
	sortie_RDV.value = '';

	sortie_date_start.value = toDateString(start_date);
	sortie_date_end.value = toDateString(end_date);

	$(sortie_date_start).trigger('change'); // ensure "min" attribute is set

	$("#createEvent").modal('show').one('shown.bs.modal', function()
	{
		initMap('sortie_map', true);
		sortie_title.focus();
	})
}

/* Returns a random integer between the specified values.
The value is no lower than min (or the next integer greater than min if min isn't an integer),
and is less than (but not equal to) max. */
function getRandomInt(min, max)
{
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

export default planAnEvent;