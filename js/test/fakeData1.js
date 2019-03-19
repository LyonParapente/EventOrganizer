var fakeData1 =
[
	{
		title: 'All Day Event',
		start: '2014-06-01'
	},
	{
		title: 'Long Event',
		start: '2014-06-07',
		end: '2014-06-10'
	},
	{
		id: 999,
		title: 'Repeating Event',
		start: '2014-06-09T16:00:00'
	},
	{
		title: 'AAAA',
		start: '2014-06-09T09:00:00'
	},
	{
		title: 'BBBB',
		start: '2014-06-09T09:00:00'
	},
	{
		title: 'CCCC',
		start: '2014-06-09T09:00:00'
	},
	{
		title: 'DDDD',
		start: '2014-06-09T09:00:00'
	},
	{
		title: 'EEEE',
		start: '2014-06-09T09:00:00'
	},
	{
		title: 'FFFF',
		start: '2014-06-09T09:00:00'
	},
	{
		id: 999,
		title: 'Repeating Event',
		start: '2014-06-16T16:00:00'
	},
	{
		title: 'Dune',
		start: '2014-06-18',
		end: '2014-06-22',
		color: '#ff9f89'
	},
	{
		title: 'Meeting',
		start: '2014-06-12T10:30:00',
		end: '2014-06-12T12:30:00'
	},
	{
		title: 'Lunch',
		start: '2014-06-12T12:00:00'
	},
	{
		title: 'Birthday Party',
		start: '2014-06-13T07:00:00',
		allDay: true
	},
	{
		title: 'Click for Google',
		url: 'http://google.com/',
		start: '2014-06-28'
	},
	{
		title: 'Bloop',
		start: '2018-01-22'
	}
];

$(function()
{
	setTimeout(function()
	{
		$calendar.fullCalendar('addEventSource', fakeData1);
	}, 200);
});
