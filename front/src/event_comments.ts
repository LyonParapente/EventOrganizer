import { i18n, toRelativeTimeString } from './trads';
import requestJson from './request_json';

var id: (string) => HTMLElement = document.getElementById.bind(document);

// TODO: when authenticated
var connected_user_id: number = 101;
var connected_user: User = {firstname: "John", lastname: "DOE"};

export default function loadComments (event: CurrentEvent): void
{
	var error_box = id("event_comments_error");
	error_box.style.display = 'none';

	var attributes =
	{
		"alt": getUserName(connected_user),
		"src": "/static/avatars/"+connected_user_id+"-1.jpg",
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
		event_comments.innerHTML = ''; // Remove spinner
		console.error(type, ex.responseText);
		error_box.style.display = '';

		var clone = error_box.cloneNode(true) as HTMLElement;
		clone.removeAttribute("id");
		participants.appendChild(clone);
	});
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

	for (var i = 0; i < data.comments.length; ++i)
	{
		var comment = data.comments[i],
			userid = comment.user,
			user = data.users[userid];

		if (!user)
		{
			console.warn("Missing user "+userid);
		}

		var groupitem = createCommentEntry(comment, userid, user);
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

function getUserName (user: User)
{
	return user.firstname + ' ' + user.lastname;
}

function nicePhone (phone: string)
{
	if (phone.length === 10)
	{
		var p = phone.split('');
		return p[0]+p[1]+'.'+p[2]+p[3]+'.'+p[4]+p[5]+'.'+p[6]+p[7]+'.'+p[8]+p[9];
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
		a.href = "tel:"+creator.phone;
		a.innerHTML = nicePhone(creator.phone);
		id("event_author_phone").appendChild(a);
		id('event_author_phone_box').style.display = ''
	}
	if (creator.email)
	{
		let a = document.createElement('a');
		a.href = "mailto:"+creator.email;
		a.innerHTML = creator.email;
		id("event_author_email").appendChild(a);
		id('event_author_email_box').style.display = ''
	}
}

function createCommentEntry (comment: Comment, userid: number, user: User): HTMLElement
{
	var dateText = toRelativeTimeString(new Date(comment.date));

	var groupitem = document.createElement('div');
	groupitem.className = 'list-group-item p-1 d-flex';
		var d = document.createElement('div');
			var a = document.createElement('a');
			a.href = "/user:"+userid;
				var avatar = new Image();
				avatar.src = "/static/avatars/"+userid+"-2.jpg";
				avatar.alt = getUserName(user);
			a.appendChild(avatar);
		d.appendChild(a);
		groupitem.appendChild(d);

		var col = document.createElement('div');
		col.className = 'col';
			var comment_infos = document.createElement('span');
			comment_infos.className = 'border-bottom border-light';
				a = document.createElement('a');
				a.href = "/user:"+userid;
				a.appendChild(document.createTextNode(getUserName(user)));
			comment_infos.appendChild(a);
			comment_infos.appendChild(document.createTextNode(' - ' + dateText));

			col.appendChild(comment_infos);
			var p = document.createElement("p");
			p.className = 'blockquote my-1 text-dark';
			p.appendChild(document.createTextNode(comment.comment));
			p.innerHTML = p.innerHTML.replace(/\n/g, '<br/>');
		col.appendChild(p);
	groupitem.appendChild(col);
	return groupitem;
}

function createRegistrations(registrations: number[], users: UsersDictionary, isFinished: boolean, container: HTMLElement, event_id: number, hideButtons: boolean, props: RegistrationInfos): void
{
	var badge = document.createElement('span');
	badge.classList.add('badge', props.badge);
	badge.textContent = registrations.length.toString();

	var header = document.createElement('h4');
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

		if (registrations.indexOf(connected_user_id) !== -1)
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
		avatar.src = "/static/avatars/"+user_id+"-2.jpg";
		avatar.alt = getUserName(user);
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
		console.error(type, ex);
	});
}

function updateRegistration (button_id: string, box: HTMLElement)
{
	var user_id = connected_user_id.toString();
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
			addRegistration(user_id, connected_user, box);

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
