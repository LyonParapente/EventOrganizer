import { i18n, toRelativeTimeString } from './trads';
import requestJson from './request_json';
import settings from './settings';
import { UpdateCommentPreview } from './event_show';

import * as DOMPurify from 'dompurify';
import * as marked from 'marked';

var id: (string) => HTMLElement = document.getElementById.bind(document);

export default function loadComments (event: CurrentEvent): void
{
	var error_box = id("event_comments_error");
	error_box.style.display = 'none';

	var connected_user = get_connected_user();
	var attributes =
	{
		"alt": getUserName(connected_user),
		"src": "/avatars/"+connected_user.id+"-130",
		"height": 110
	};
	var event_comment_avatar = id("event_comment_avatar");
	Object.keys(attributes).forEach(attr =>
		event_comment_avatar.setAttribute(attr, attributes[attr]));

	var event_comments = id('event_comments');
	event_comments.innerHTML = '<div class="spinner-border m-auto" role="status"></div>';

	var participants = id("event_participants");
	var interested = id("event_interested");
	participants.innerHTML = interested.innerHTML = '';

	requestJson("GET", "/api/messages?event_id="+event.event_id.toString(), null, function (data: JSON)
	{
		event_comments.innerHTML = ''; // Remove spinner
		receiveEventInfos(data, event_comments, event, participants, interested);
	},
	function (type: string, ex: XMLHttpRequest)
	{
		CheckAuthentication(ex);

		event_comments.innerHTML = ''; // Remove spinner
		console.error(type, ex.responseText);
		error_box.style.display = '';

		var clone = error_box.cloneNode(true) as HTMLElement;
		clone.removeAttribute("id");
		participants.appendChild(clone);
	});
}

function CheckAuthentication (ex)
{
	if (ex.status === 401)
	{
		window.location.assign('/login');
	}
}

interface Comment
{
	date: string;
	user: number;
	comment: string;
}

interface User
{
	firstname: string;
	lastname: string;
	phone?: string;
	has_whatsapp?: boolean;
	email?: string;
}

interface UsersDictionary
{
	[x: string]: User;
}

interface RegistrationInfos
{
	badge: string,
	title: string,
	button: string,
	buttonMsg: string,
	buttonDelMsg: string,
	interest: number
}

function receiveEventInfos(data: any, event_comments: HTMLElement, event: CurrentEvent, participantsEl: HTMLElement, interestedEl: HTMLElement): void
{
	fillCreator(data.users[event.creator_id]);

	var connected_user_id = get_connected_user().id;

	for (var i = 0; i < data.comments.length; ++i)
	{
		var comment = data.comments[i],
			userid = comment.user,
			user = data.users[userid];

		if (!user)
		{
			console.warn("Missing user "+userid);
		}

		var isLatest = i === data.comments.length - 1;
		var canEdit = isLatest && userid === connected_user_id;
		var groupitem = createCommentEntry(comment, userid, user, canEdit);
		event_comments.appendChild(groupitem);
	}

	var participants = data.participants || [];
	var interested = data.interested || [];

	var in_participants = participants.indexOf(connected_user_id) !== -1;

	createRegistrations(participants, data.users,
		event.isFinished, participantsEl, event.event_id, false,
	{
		badge: 'badge-success',
		title: 'Participants ',
		button: 'participants_button',
		buttonMsg: "I'm in",
		buttonDelMsg: "I'm out",
		interest: 2
	});
	createRegistrations(interested, data.users,
		event.isFinished, interestedEl, event.event_id, in_participants,
	{
		badge: 'badge-info',
		title: 'Interested ',
		button: 'interested_button',
		buttonMsg: "I'm interested",
		buttonDelMsg: "I'm not interested",
		interest: 1
	});
}

function getUserName (user: User): string
{
	return user.firstname + ' ' + user.lastname;
}

function rawPhone (phone: string): string
{
	return phone.replace(/[^\d+]/g, '');
}

function nicePhone (phone: string): string
{
	var raw_phone = rawPhone(phone);
	if (raw_phone.length === 10)
	{
		var p = raw_phone.split('');
		return p[0]+p[1]+'.'+p[2]+p[3]+'.'+p[4]+p[5]+'.'+p[6]+p[7]+'.'+p[8]+p[9];
	}
	return phone;
}

function whatsappPhone (phone: string): string
{
	var raw_phone = rawPhone(phone);
	if (raw_phone.length === 10 && raw_phone.charAt(0) === '0')
	{
		return settings.international_prefix + raw_phone.substr(1);
	}
	return phone;
}

function fillCreator (creator: User)
{
	// Sensitive information not exposed in /api/events
	id("event_author").textContent = getUserName(creator);
	if (creator.phone)
	{
		let a = document.createElement('a');
		a.href = "tel:"+rawPhone(creator.phone);
		a.innerHTML = DOMPurify.sanitize(nicePhone(creator.phone));
		id("event_author_phone").innerHTML = ''
		id("event_author_phone").appendChild(a);
		id('event_author_phone_box').style.display = '';

		if (creator.has_whatsapp)
		{
			var event_author_whatsapp = id("event_author_whatsapp");
			var author_whatsapp = event_author_whatsapp.querySelector('a');
			author_whatsapp.href = "https://api.whatsapp.com/send?phone=" + whatsappPhone(creator.phone);
			event_author_whatsapp.style.display = '';
		}
	}
	if (creator.email)
	{
		let a = document.createElement('a');
		a.href = "mailto:"+creator.email;
		a.innerHTML = DOMPurify.sanitize(creator.email);
		id("event_author_email").innerHTML = ''
		id("event_author_email").appendChild(a);
		id('event_author_email_box').style.display = '';
	}
}

function createCommentEntry (comment: Comment, userid: number, user: User, canEdit: boolean): HTMLElement
{
	var dateText = toRelativeTimeString(new Date(comment.date));

	var groupitem = document.createElement('div');
	groupitem.className = 'list-group-item p-1 d-flex';
		var d = document.createElement('div');
			var a = document.createElement('a');
			a.href = "/user:"+userid;
				var avatar = new Image();
				avatar.src = "/avatars/"+userid+"-60";
				avatar.alt = getUserName(user);
				avatar.title = getUserName(user);
			a.appendChild(avatar);
		d.appendChild(a);
		if (canEdit)
		{
			d.className = "d-flex flex-column";
			var editButton = document.createElement('button');
			editButton.type = "button";
			editButton.className = "btn btn-outline-secondary mt-auto p-1 btn-sm";
			editButton.textContent = i18n("Edit");
			editButton.addEventListener('click', function ()
			{
				edit_comment(comment.comment);
			});
			d.appendChild(editButton);
		}
		groupitem.appendChild(d);

		var col = document.createElement('div');
		col.className = 'pl-2';
			var comment_infos = document.createElement('span');
			comment_infos.className = 'border-bottom border-light';
				a = document.createElement('a');
				a.href = "/user:"+userid;
				a.appendChild(document.createTextNode(getUserName(user)));
			comment_infos.appendChild(a);
			comment_infos.appendChild(document.createTextNode(' - ' + dateText));

			col.appendChild(comment_infos);
			var p = document.createElement("p");
			p.className = 'blockquote my-1';
			p.innerHTML = DOMPurify.sanitize(marked(comment.comment));
		col.appendChild(p);
	groupitem.appendChild(col);
	return groupitem;
}

function createRegistrations(registrations: number[], users: UsersDictionary, isFinished: boolean, container: HTMLElement, event_id: number, hideButtons: boolean, props: RegistrationInfos): void
{
	var badge = document.createElement('span');
	badge.classList.add('badge', props.badge);
	badge.textContent = registrations.length.toString();

	var header = document.createElement('h3');
	header.textContent = i18n(props.title);
	header.appendChild(badge);
	if (!isFinished)
	{
		var button = document.createElement('button');
		button.id = props.button;
		button.setAttribute('type', 'button');
		button.classList.add('btn', 'btn-outline-info', 'float-right');
		button.textContent = i18n(props.buttonMsg);
		button.addEventListener('click', function()
		{
			registerToEvent(event_id, props.interest, props.button, container);
		});

		var buttonDelete = document.createElement('button');
		var button_id = props.button+'_delete';
		buttonDelete.id = button_id;
		buttonDelete.setAttribute('type', 'button');
		buttonDelete.classList.add('btn', 'btn-outline-secondary', 'float-right');
		buttonDelete.textContent = i18n(props.buttonDelMsg);
		buttonDelete.style.display = 'none';
		buttonDelete.addEventListener('click', function()
		{
			unregisterFromEvent(event_id, button_id, container);
		});

		if (registrations.indexOf(get_connected_user().id) !== -1)
		{
			button.style.display = 'none';
			buttonDelete.style.display = '';
		}
		if (hideButtons)
		{
			// Connected user is present in other section
			button.style.display = 'none';
			buttonDelete.style.display = 'none';
		}
		header.appendChild(button);
		header.appendChild(buttonDelete);
	}
	container.appendChild(header);

	for (var i = 0; i < registrations.length; ++i)
	{
		var registration = registrations[i].toString();
		if (users.hasOwnProperty(registration))
		{
			addRegistration(registration, users[registration], container);
		}
		else
		{
			console.warn("Missing user "+registration);
		}
	}
}

function addRegistration (user_id: string, user: User, container: HTMLElement)
{
	var a = document.createElement('a');
	a.href = "/user:"+user_id;
		var avatar = new Image();
		avatar.src = "/avatars/"+user_id+"-40";
		avatar.alt = getUserName(user);
		avatar.title = getUserName(user);
		avatar.className = "mr-1 mb-1";
	a.appendChild(avatar);
	container.appendChild(a);
}

function registerToEvent (event_id: number, interest: number, button_id: string, container: HTMLElement)
{
	var url = "/api/event/"+event_id.toString()+'/registration?interest='+interest;
	requestJson("PUT", url, null, function (data: any)
	{
		updateRegistration(button_id, container);
	},
	function (type: string, ex: XMLHttpRequest)
	{
		CheckAuthentication(ex);
		console.error(type, ex);
	});
}

function unregisterFromEvent (event_id: number, button_id: string, container: HTMLElement)
{
	var url = "/api/event/"+event_id.toString()+'/registration';
	requestJson("DELETE", url, null, function (data: any)
	{
		updateRegistration(button_id, container);
	},
	function (type: string, ex: XMLHttpRequest)
	{
		CheckAuthentication(ex);
		console.error(type, ex);
	});
}

function updateRegistration (button_id: string, box: HTMLElement)
{
	var user_id = get_connected_user().id.toString();
	var button = id(button_id);
	if (button_id.endsWith('_delete'))
	{
		// Remove user and decrement counter
		var user = box.querySelector(`a[href='/user:${user_id}']`);
		if (user)
		{
			box.removeChild(user);
			badge = box.querySelector('.badge') as HTMLSpanElement;
			badge.textContent = (parseInt(badge.textContent, 10) - 1).toString();
		}

		// Show registration buttons
		id('participants_button').style.display = '';
		id('interested_button').style.display = '';

		// Hide delete button
		button.style.display = 'none';
	}
	else
	{
		// Hide clicked button
		button.style.display = 'none';

		// Show delete button
		var button_delete = id(button_id+'_delete');
		button_delete.style.display = '';

		// Prevent double-add if ajax is slow and user clicks several times
		var user = box.querySelector(`a[href='/user:${user_id}']`);
		if (!user)
		{
			addRegistration(user_id, get_connected_user(), box);

			// Increase counter
			var badge = box.querySelector('.badge') as HTMLSpanElement;
			badge.textContent = (parseInt(badge.textContent, 10) + 1).toString();
		}

		// Hide interested section buttons when becoming participant
		if (button_id === 'participants_button')
		{
			id('interested_button').style.display = 'none';
			id('interested_button_delete').style.display = 'none';

			// Remove user in other section if
			// already in interested but click "i'm in"
			var otherBox = id('event_interested');
			var user = otherBox.querySelector(`a[href='/user:${user_id}']`);
			if (user)
			{
				otherBox.removeChild(user);
				badge = otherBox.querySelector('.badge') as HTMLSpanElement;
				badge.textContent = (parseInt(badge.textContent, 10) - 1).toString();
			}
		}
	}
}

function get_connected_user ()
{
	return window['connected_user'];
}

function edit_comment (comment: string)
{
	var event_comment = id('event_comment') as HTMLTextAreaElement;
	event_comment.value = DOMPurify.sanitize(comment);
	UpdateCommentPreview.call(event_comment);

	id('comment_cancel_btn').classList.remove('collapse');
	var comment_send_btn = id('comment_send_btn');
	comment_send_btn.textContent = i18n('Edit');
	comment_send_btn.classList.add('edit');
	comment_send_btn.setAttribute("data-action", "edit");
}
