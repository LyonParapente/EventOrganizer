import { i18n, toRelativeTimeString } from './trads';
import { requestJson } from '@fullcalendar/core';

export default function loadComments (id: string, isFinished: boolean): void
{
	var $errorBox = $("#event_comments_error").hide();
	$("#event_comment_avatar").attr(
	{
		// TODO: replace by current user id
		"alt": "Thibault ROHMER",
		"src": "avatars/4145-1.jpg",
		"height": 110
	});

	var event_comments = document.getElementById('event_comments');
	event_comments.innerHTML = '<div class="spinner-border m-auto" role="status"></div>';

	var $participants = $("#event_participants").empty();
	var $interested = $("#event_interested").empty();

	requestJson("GET", "events/Event_"+id+".json", null, function (data)
	{
		event_comments.innerHTML = ''; // Remove spinner
		receiveEventInfos(data, event_comments, isFinished, $participants, $interested);
	},
	function (type, ex)
	{
		event_comments.innerHTML = ''; // Remove spinner
		console.error(type, ex);
		$errorBox.show();
		$errorBox.clone().removeAttr("id").appendTo($participants);
	});
}

interface Comment
{
	date: string;
	user: number;
	comment: string;
}

function receiveEventInfos(data, event_comments: HTMLElement, isFinished: boolean, $participants: JQuery, $interested: JQuery): void
{
	for (var i = 0; i < data.comments.length; ++i)
	{
		var comment = data.comments[i],
			userid = comment.user,
			username = data.users[userid];

		if (!username)
		{
			console.warn("Missing user "+userid);
		}

		var groupitem = createCommentEntry(comment, userid, username);
		event_comments.appendChild(groupitem);
	}

	createParticipants(data.participants || [], data.users, isFinished, $participants);
	createInterested(data.interested || [], data.users, isFinished, $interested);
}

function createCommentEntry (comment: Comment, userid: number, username: string): HTMLElement
{
	var dateText = toRelativeTimeString(new Date(comment.date));

	var groupitem = document.createElement('div');
	groupitem.className = 'list-group-item p-1 d-flex';
		var d = document.createElement('div');
			var a = document.createElement('a');
			a.href = "user/"+userid;
				var avatar = new Image();
				avatar.src = "avatars/"+userid+"-2.jpg";
				avatar.alt = username;
			a.appendChild(avatar);
		d.appendChild(a);
		groupitem.appendChild(d);

		var col = document.createElement('div');
		col.className = 'col';
			var comment_infos = document.createElement('span');
			comment_infos.className = 'border-bottom border-light';
				a = document.createElement('a');
				a.href = "user/"+userid;
				a.appendChild(document.createTextNode(username));
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

function createParticipants(participants: number[], users: object, isFinished: boolean, $event_participants: JQuery): void
{
	var participants_badge = $('<span class="badge badge-success"></span>').text(participants.length);
	var participants_button = isFinished ? '' : $('<button type="button" class="btn btn-outline-info float-right"></button>').text(i18n("I'm in"));
	var participants_header = $("<h4>").text(i18n("Participants ")).append(participants_badge).append(participants_button);
	$event_participants.append(participants_header);
	for (var i = 0; i < participants.length; ++i)
	{
		var participant = participants[i].toString();
		if (users.hasOwnProperty(participant))
		{
			var a = document.createElement('a');
			a.href = "user/"+participant;
				var avatar = new Image();
				avatar.src = "avatars/"+participant+"-2.jpg";
				avatar.alt = users[participant];
				avatar.className = "mr-1 mb-1";
			a.appendChild(avatar);
			$event_participants.append(a);
		}
		else
		{
			console.warn("Missing participant user "+participant);
		}
	}
}

function createInterested(interested: number[], users: object, isFinished: boolean, $event_interested: JQuery): void
{
	var interested_badge = $('<span class="badge badge-info"></span>').text(interested.length);
	var interested_button = isFinished ? '' : $('<button type="button" class="btn btn-outline-info float-right"></button>').text(i18n("I'm interested"));
	var interested_header = $("<h4>").text(i18n("Interested ")).append(interested_badge).append(interested_button);
	$event_interested.append(interested_header);
	for (var i = 0; i < interested.length; ++i)
	{
		var interested_user = interested[i].toString();
		if (users[interested_user])
		{
			var a = document.createElement('a');
			a.href = "user/"+interested_user;
				var avatar = new Image();
				avatar.src = "avatars/"+interested_user+"-2.jpg";
				avatar.alt = users[interested_user];
				avatar.className = "mr-1 mb-1";
			a.appendChild(avatar);
			$event_interested.append(a);
		}
		else
		{
			console.warn("Missing interested user "+interested);
		}
	}
}
