var Events_2020 =
[
{
	"id": 3456789,
	"title": "Test 1",
	"start": "2020-03-07",
	"user": {
		"id": 4145,
		"name": "Thibault ROHMER"
	},
	"desc": "Oh yeah!",
	"time": "20h00",
	"location": ""
},
{
	"id": 3456790,
	"title": "Test 2",
	"start": "2020-03-13",
	"user": {
		"id": 4145,
		"name": "Thibault ROHMER"
	},
	"desc": "Oh yeah!",
	"time": "13h00",
	"location": "Annecy"
}
];

document.addEventListener('DOMContentLoaded', function()
{
	// Simulate network
	setTimeout(function()
	{
		calendar.addEventSource(Events_2020);
	}, 200);
});
