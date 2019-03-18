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
		"Cannot end before start": "Doit être après la date de début",
		"By": "Par",
		"Comments:": "Commentaires :",
		"Add a comment...": "Ajouter un commentaire...",
		"Please provide a comment": "Veuillez saisir un commentaire",
		"Send": "Envoyer",
		"The ": "Le ",
		" at ": " à ",
		"Unable to load comments": "Erreur lors du chargement des commentaires",
		"Participants ": "Participants ",
		"Interested ": "Intéressés "
	}
};

function i18n (key/*, arg1, arg2, ...*/)
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

function i18n_inPlace (selectors, attr)
{
	for (var i = 0; i < selectors.length; ++i)
	{
		var $item = jQuery(selectors[i]);
		if ($item.length === 0)
		{
			console.warn("i18n was unable to find element:", selectors[i]);
		}
		if (!$item.data('translated'))
		{
			if (attr)
			{
				$item.attr(attr, (i, old) => i18n(old));
			}
			else
			{
				$item.text((i, old) => i18n(old));
			}
			$item.data('translated', true);
		}
	}
}
