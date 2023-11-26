import settings from './settings';

const trads: Translations =
{
	fr:
	{
		"Cannot create event in the past": "Impossible de rajouter un évènement dans le passé",
		"Plan an event": "Planifier une sortie",
		"Title": "Titre",
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
		"Add a comment... Markdown available!": "Ajouter un commentaire... Markdown disponible !",
		"Please provide a comment": "Veuillez saisir un commentaire",
		"Send": "Envoyer",
		"Preview": "Prévisualiser",
		"Cancel": "Annuler",
		"The ": "Le ",
		" at ": " à ",
		"Yesterday ": "Hier ",
		"Today ": "Aujourd'hui ",
		"Unable to load comments": "Erreur lors du chargement des commentaires",
		"Participants ": "Participants ",
		"Interested ": "Intéressés ",
		"I'm in": "Je viens",
		"I'm out": "J'annule",
		"I'm interested": "Je suis intéressé(e)",
		"I'm not interested": "Pas intéressé(e)",
		"Category": "Catégorie",
		"None": "Aucune",
		"Copied to clipboard!": "Copié dans le presse-papier!",
		"Open in Google Maps": "Ouvrir avec Google Maps",
		"New Event": "Ajouter une sortie",
		"Reset": "Reset", // Prédéfini?
		"Planning": "Calendrier",
		"EventTitle": "Event #{0}",
		"Unable to save": "Impossible de sauvegarder",
		"insufficient rights": "droits insuffisants",
		"Phone": "Téléphone",
		"Email": "Email",
		"Edit": "Modifier",
		"Delete": "Supprimer",
		"Confirm": "Es-tu vraiment sûr(e) ?",
		"Edit an event": "Modifier un évènement",
		"NotificationsBlocked": "Notifications emails actuellement désactivées",
		"NotificationsNotBlocked": "Notifications emails actuellement activées",
		"invite link": "Lien WhatsApp",
		"Type a description... Markdown available!": "Tape une description... Markdown disponible !",
		"Export to iCalendar format (Google Calendar, Apple Calendar, Android, ...)": "Exporter au format iCalendar (Google Calendar, Apple Calendar, Android, ...)",
		"Previous": "Précédent",
		"Next": "Suivant"
	}
};

export function i18n (key: string, ...args: string[]): string
{
	var dic = trads[settings.lang];
	if (dic)
	{
		if (Object.prototype.hasOwnProperty.call(dic, key))
		{
			var trad = dic[key] as string;
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
		var regex = new RegExp("\\{" + i.toString() + "\\}", "g");
		trad = trad.replace(regex, replaceValues[i]);
	}
	return trad;
}

var translated = new Set();

export function i18n_inPlace (selectors: (string|HTMLElement)[]|NodeListOf<Element>, attr?: string): void
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
					var oldAttr = item.getAttribute(attr) as string;
					item.setAttribute(attr, i18n(oldAttr));
				}
				else
				{
					var oldText = item.textContent as string;
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
