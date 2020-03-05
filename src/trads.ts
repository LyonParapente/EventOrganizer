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
		"New Event": "Ajouter une sortie"
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

export function i18n_inPlace (selectors, attr)
{
	for (var i = 0; i < selectors.length; ++i)
	{
		var selector = selectors[i];
		var $item = document.querySelector(selector);
		if (!$item)
		{
			console.warn("i18n was unable to find element:", selector);
		}
		if (!translated.has($item))
		{
			if (attr)
			{
				var oldAttr = $item.getAttribute(attr);
				$item.setAttribute(i18n(oldAttr));
			}
			else
			{
				var oldText = $item.textContent;
				$item.textContent = i18n(oldText);
			}
			translated.add($item);
		}
	}
}