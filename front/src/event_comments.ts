import { i18n, toRelativeTimeString } from './trads';
import requestJson from './request_json';

var id: (string) => HTMLElement = document.getElementById.bind(document);

export default function loadComments (event_id: string, isFinished: boolean): void
{
	var error_box = id("event_comments_error");
	error_box.style.display = 'none';

	var attributes =
	{
		// TODO: replace by current connected user id
		"alt": "Thibault ROHMER",
		"src": "avatars/4145-1.jpg",
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

	requestJson("GET", "/api/messages?event_id="+event_id, null, function (data: JSON)
	{
		event_comments.innerHTML = ''; // Remove spinner
		receiveEventInfos(data, event_comments, isFinished, participants, interested);
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

function receiveEventInfos(data: any, event_comments: HTMLElement, isFinished: boolean, participants: HTMLElement, interested: HTMLElement): void
{
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

	createParticipants(data.participants || [], data.users, isFinished, participants);
	createInterested(data.interested || [], data.users, isFinished, interested);
}

function getUserName (user: User)
{
	return user.firstname + ' ' + user.lastname;
}

function createCommentEntry (comment: Comment, userid: number, user: User): HTMLElement
{
	var dateText = toRelativeTimeString(new Date(comment.date));

	var groupitem = document.createElement('div');
	groupitem.className = 'list-group-item p-1 d-flex';
		var d = document.createElement('div');
			var a = document.createElement('a');
			a.href = "user/"+userid;
				var avatar = new Image();
				avatar.src = "avatars/"+userid+"-2.jpg";
				avatar.alt = getUserName(user);
			a.appendChild(avatar);
		d.appendChild(a);
		groupitem.appendChild(d);

		var col = document.createElement('div');
		col.className = 'col';
			var comment_infos = document.createElement('span');
			comment_infos.className = 'border-bottom border-light';
				a = document.createElement('a');
				a.href = "user/"+userid;
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

function createParticipants(participants: number[], users: UsersDictionary, isFinished: boolean, event_participants: HTMLElement): void
{
	var participants_badge = document.createElement('span');
	participants_badge.classList.add('badge', 'badge-success');
	participants_badge.textContent = participants.length.toString();

	var participants_header = document.createElement('h4');
	participants_header.textContent = i18n("Participants ");
	participants_header.appendChild(participants_badge);
	if (!isFinished)
	{
		var participants_button = document.createElement('button');
		participants_button.setAttribute('type', 'button');
		participants_button.classList.add('btn', 'btn-outline-info', 'float-right');
		participants_button.textContent = i18n("I'm in");
		participants_header.appendChild(participants_button);
	}
	event_participants.appendChild(participants_header);

	for (var i = 0; i < participants.length; ++i)
	{
		var participant = participants[i].toString();
		if (users.hasOwnProperty(participant))
		{
			var a = document.createElement('a');
			a.href = "user/"+participant;
				var avatar = new Image();
				avatar.src = "avatars/"+participant+"-2.jpg";
				avatar.alt = getUserName(users[participant]);
				avatar.className = "mr-1 mb-1";
			a.appendChild(avatar);
			event_participants.appendChild(a);
		}
		else
		{
			console.warn("Missing participant user "+participant);
		}
	}
}

function createInterested(interested: number[], users: UsersDictionary, isFinished: boolean, event_interested: HTMLElement): void
{
	var interested_badge = document.createElement('span');
	interested_badge.classList.add('badge', 'badge-info');
	interested_badge.textContent = interested.length.toString();

	var interested_header = document.createElement('h4');
	interested_header.textContent = i18n("Interested ");
	interested_header.appendChild(interested_badge);
	if (!isFinished)
	{
		var interested_button = document.createElement('button');
		interested_button.setAttribute('type', 'button');
		interested_button.classList.add('btn', 'btn-outline-info', 'float-right');
		interested_button.textContent = i18n("I'm interested");
		interested_header.appendChild(interested_button);
	}
	event_interested.appendChild(interested_header);

	for (var i = 0; i < interested.length; ++i)
	{
		var interested_user = interested[i].toString();
		if (users.hasOwnProperty(interested_user))
		{
			var a = document.createElement('a');
			a.href = "user/"+interested_user;
				var avatar = new Image();
				avatar.src = "avatars/"+interested_user+"-2.jpg";
				avatar.alt = getUserName(users[interested_user]);
				avatar.className = "mr-1 mb-1";
			a.appendChild(avatar);
			event_interested.appendChild(a);
		}
		else
		{
			console.warn("Missing interested user "+interested);
		}
	}
}
