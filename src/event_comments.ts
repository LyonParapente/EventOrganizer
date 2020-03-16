import { i18n, toRelativeTimeString } from './trads';

export default function loadComments(id, isFinished)
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

	var $event_participants = $("#event_participants").empty();
	var $event_interested = $("#event_interested").empty();

	jQuery.getJSON("events/Event_"+id+".json", function(data)
	{
		var a, i, avatar;
		event_comments.innerHTML = ''; // rendering optim to avoid repaint in .always()
		for (i = 0; i < data.comments.length; ++i)
		{
			var comment = data.comments[i],
				userid = comment.user,
				username = data.users[userid];

			if (!username)
			{
				console.warn("Missing user "+userid);
			}

			var dateText = toRelativeTimeString(new Date(comment.date));

			var groupitem = document.createElement('div');
			groupitem.className = 'list-group-item p-1 d-flex';
				var d = document.createElement('div');
					a = document.createElement('a');
					a.href = "user/"+userid;
						avatar = new Image();
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
			event_comments.appendChild(groupitem);
		}

		data.participants = data.participants || [];
		var participants_badge = $('<span class="badge badge-success"></span>').text(data.participants.length);
		var participants_button = isFinished ? '' : $('<button type="button" class="btn btn-outline-info float-right"></button>').text(i18n("I'm in"));
		var participants_header = $("<h4>").text(i18n("Participants ")).append(participants_badge).append(participants_button);
		$event_participants.append(participants_header);
		for (i = 0; i < data.participants.length; ++i)
		{
			var participant = data.participants[i];
			if (data.users.hasOwnProperty(participant))
			{
				a = document.createElement('a');
				a.href = "user/"+participant;
					avatar = new Image();
					avatar.src = "avatars/"+participant+"-2.jpg";
					avatar.alt = data.users[participant];
					avatar.className = "mr-1 mb-1";
				a.appendChild(avatar);
				$event_participants.append(a);
			}
			else
			{
				console.warn("Missing participant user "+participant);
			}
		}

		data.interested = data.interested || [];
		var interested_badge = $('<span class="badge badge-info"></span>').text(data.interested.length);
		var interested_button = isFinished ? '' : $('<button type="button" class="btn btn-outline-info float-right"></button>').text(i18n("I'm interested"));
		var interested_header = $("<h4>").text(i18n("Interested ")).append(interested_badge).append(interested_button);
		$event_interested.append(interested_header);
		for (i = 0; i < data.interested.length; ++i)
		{
			var interested = data.interested[i];
			if (data.users[interested])
			{
				a = document.createElement('a');
				a.href = "user/"+interested;
					avatar = new Image();
					avatar.src = "avatars/"+interested+"-2.jpg";
					avatar.alt = data.users[interested];
					avatar.className = "mr-1 mb-1";
				a.appendChild(avatar);
				$event_interested.append(a);
			}
			else
			{
				console.warn("Missing interested user "+interested);
			}
		}
	}).fail(function(o, type, ex)
	{
		console.error(ex);
		$errorBox.show();
		$errorBox.clone().removeAttr("id").appendTo($event_participants);
	}).always(function()
	{
		$(".spinner-border, event_comments").remove();
	});
}
