import settings from './settings';

const trads =
{
	fr:
	{
		"Cannot create event in the past": "Impossible de rajouter un évènement dans le passé",
		"Plan an event": "Planifier une sortie",
		"Event": "Sortie",
		"Activity location": "Lieu de l'activité",
		"Meeting location": "Point de RDV",
		"Date": "Date",
		"Time": "Heure",
		"Description": "Description",
		"No description": "(pas de description)",
		"Save": "Enregistrer",
		"Month list": "Liste mois",
		"Year list": "Liste année",
		"Search an address": "Chercher une adresse",
		"DateFrom": "Du",
		"DateTo": "Au",
		"DateThe": "Le",
		"Please provide a title": "Veuillez saisir un nom de sortie",
		"Please provide a location": "Veuillez saisir un lieu",
		"Invalid date": "Date invalide",
		"Cannot end before start": "Egale ou après la date de début",
		"By": "Par",
		"Comments:": "Commentaires :",
		"Add a comment...": "Ajouter un commentaire...",
		"Please provide a comment": "Veuillez saisir un commentaire",
		"Send": "Envoyer",
		"The ": "Le ",
		" at ": " à ",
		"Yesterday ": "Hier ",
		"Today ": "Aujourd'hui ",
		"Unable to load comments": "Erreur lors du chargement des commentaires",
		"Participants ": "Participants ",
		"Interested ": "Intéressés ",
		"I'm in": "Je viens",
		"I'm interested": "Je suis intéressé(e)",
		"Category": "Catégorie",
		"None": "Aucune",
		"Copied to clipboard!": "Copié dans le presse-papier!",
		"Open in Google Maps": "Ouvrir avec Google Maps",
		"New Event": "Ajouter une sortie",
		"Reset": "Reset", // Prédéfini?
		"Planning": "Calendrier",
		"EventTitle": "Event #{0}"
	}
};

export function i18n (key: string, ...args: string[]): string
{
	var dic = (trads as any)[settings.lang];
	if (dic)
	{
		if (dic.hasOwnProperty(key))
		{
			var trad = dic[key];
			return i18nFormat(trad, args);
		}
		else
		{
			console.warn("Missing trad for key:", key);
		}
	}
	return "[["+key+"]]"; // not translated yet
}

function i18nFormat (trad: string, replaceValues: string[]): string
{
	for (var i = 0; i < replaceValues.length; ++i)
	{
		var regex = new RegExp("\\{" + i + "\\}", "g");
		trad = trad.replace(regex, replaceValues[i]);
	}
	return trad;
}

var translated = new Set();

export function i18n_inPlace (selectors: string[]|NodeListOf<Element>, attr?: string): void
{
	for (var i = 0; i < selectors.length; ++i)
	{
		var selector = selectors[i];
		var items = (typeof selector === "string" ? document.querySelectorAll(selector) : [selector]);
		for (var j = 0; j < items.length; ++j)
		{
			var item = items[j];
			if (!translated.has(item))
			{
				if (attr)
				{
					var oldAttr = item.getAttribute(attr);
					item.setAttribute(attr, i18n(oldAttr));
				}
				else
				{
					var oldText = item.textContent;
					item.textContent = i18n(oldText);
				}
				translated.add(item);
			}
		}
		if (items.length === 0)
		{
			console.warn("i18n was unable to find element(s):", selector);
		}
	}
}

export function toDateString (date: Date): string
{
	var YYYY = date.getFullYear(),
		MM = date.getMonth() + 1,
		DD = date.getDate()/*,
		hh = date.getHours(),
		mm = date.getMinutes(),
		ss = date.getSeconds(),
		ms = date.getMilliseconds()*/;

	var year = YYYY.toString(),
		month = MM < 10 ? '0' + MM : MM.toString(),
		day = DD < 10 ? '0' + DD : DD.toString()/*,
		hours = hh < 10 ? '0' + hh : hh.toString(),
		minutes = mm < 10 ? '0' + mm : mm.toString(),
		seconds = ss < 10 ? '0' + ss : ss.toString(),
		milliseconds = ms < 10 ? '00' + ms : (ms < 100 ? '0' + ms : ms.toString())*/;
	return year+"-"+month+"-"+day/*+" "+hours+":"+minutes+":"+seconds+"."+milliseconds*/;
}

export function toTimeString (date: Date): string
{
	var hh = date.getHours(),
		mm = date.getMinutes();

	var hours = hh < 10 ? '0' + hh : hh.toString(),
		minutes = mm < 10 ? '0' + mm : mm.toString();
	return hours+"h"+minutes;
}

export function toRelativeTimeString (date: Date): string
{
	var now = new Date();
	var nowMinus1Day = new Date(now.getTime() - 86400000);

	var today = toDateString(date) === toDateString(now);
	var yesterday = toDateString(date) === toDateString(nowMinus1Day);

	if (today)
	{
		return i18n('Today ') + i18n(' at ') + toTimeString(date);
	}
	else if (yesterday)
	{
		return i18n('Yesterday ') + i18n(' at ') + toTimeString(date);
	}
	else
	{
		var dateStr = new Intl.DateTimeFormat(settings.lang).format(date);
		return i18n('The ') + dateStr + i18n(' at ') + toTimeString(date);
	}
}
