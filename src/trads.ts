import settings from './settings';

var trads =
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
		"Date is required": "Date requise",
		"Cannot end before start": "Egale ou après la date de début",
		"By": "Par",
		"Comments:": "Commentaires :",
		"Add a comment...": "Ajouter un commentaire...",
		"Please provide a comment": "Veuillez saisir un commentaire",
		"Send": "Envoyer",
		"The ": "Le ",
		" at ": " à ",
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
		"Reset": "Reset" // Prédéfini?
	}
};

export function i18n (key/*, arg1, arg2, ...*/)
{
	var dic = trads[settings.lang];
	if (dic)
	{
		if (dic.hasOwnProperty(key))
		{
			var trad = dic[key];
			var args = Array.prototype.slice.call(arguments, 1);
			return i18nFormat(trad, args);
		}
		else
		{
			console.warn("Missing trad for key:", key);
		}
	}
	return "[["+key+"]]"; // not translated yet
}

function i18nFormat (trad, replaceValues)
{
	for (var i = 0; i < replaceValues.length; ++i)
	{
		var regex = new RegExp("\\{" + i + "\\}", "g");
		trad = trad.replace(regex, replaceValues[i]);
	}
	return trad;
}

var translated = new Set();

export function i18n_inPlace (selectors, attr?)
{
	for (var i = 0; i < selectors.length; ++i)
	{
		var selector = selectors[i];
		var items = typeof selector === "string" ? document.querySelectorAll(selector) : [selector];
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

export function toDateString (date)
{
	var year = date.getFullYear(),
		month = date.getMonth() + 1,
		day = date.getDate()/*,
		hours = d.getHours(),
		minutes = d.getMinutes(),
		seconds = d.getSeconds(),
		milliseconds = d.getMilliseconds()*/;

	var YYYY = year.toString(),
		MM = month < 10 ? '0' + month : month.toString(),
		DD = day < 10 ? '0' + day : day.toString()/*,
		hh = hh < 10 ? '0' + hh : hh.toString(),
		mm = mm < 10 ? '0' + mm : mm.toString(),
		ss = ss < 10 ? '0' + ss : ss.toString(),
		ms = ms < 10 ? '00' + ms : (ms < 100 ? '0' + ms : ms.toString())*/;
	return YYYY+"-"+MM+"-"+DD/*+" "+hh+":"+mm+":"+ss+"."+ms*/;
}
