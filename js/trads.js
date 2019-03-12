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
		"DateTo": "Au"
	}
};

function i18n (key/*, arg1, arg2, ...*/)
{
	var dic = trads[settings.lang];
	if (dic && dic.hasOwnProperty(key))
	{
		var trad = dic[key];
		var args = Array.prototype.slice.call(arguments, 1);
		return i18nFormat(trad, args);
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

function i18n_inPlace (selectors)
{
	for (var i = 0; i < selectors.length; ++i)
	{
		var $item = jQuery(selectors[i]);
		if (!$item.data('translated'))
		{
			$item.text((i, old) => i18n(old));
			$item.data('translated', true);
		}
	}
}
