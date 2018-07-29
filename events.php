<?php

//TODO: handle parameters start=2013-12-01&end=2014-01-12

$events = array(
	array(
		"title" => "All Day Event",
		"start" => "2014-06-01"
	),
	array(
		"title" => "Long Event",
		"start" => "2014-06-07",
		"end" => "2014-06-10"
	),
	array(
		"title" => "Repeating Event",
		"start" => "2014-06-09T16:00:00"
	),
	array(
		"title" => "AAAA",
		"start" => "2014-06-09T09:00:00"
	),
	array(
		"title" => "BBBB",
		"start" => "2014-06-09T09:00:00"
	),
	array(
		"title" => "CCCC",
		"start" => "2014-06-09T09:00:00"
	),
	array(
		"title" => "DDDD",
		"start" => "2014-06-09T09:00:00"
	),
	array(
		"title" => "EEEE",
		"start" => "2014-06-09T09:00:00"
	),
	array(
		"title" => "FFFF",
		"start" => "2014-06-09T09:00:00"
	),
	array(
		"title" => "Repeating Event",
		"start" => "2014-06-16T16:00:00"
	),
	array(
		"title" => "Dune",
		"start" => "2014-06-18",
		"end" => "2014-06-22",
		"color" => '#ff9f89'
	),
	array(
		"title" => "Meeting",
		"start" => "2014-06-12T10:30:00",
		"end" => "2014-06-12T12:30:00"
	),
	array(
		"title" => "Lunch",
		"start" => "2014-06-12T12:00:00"
	),
	array(
		"title" => "Birthday Party",
		"start" => "2014-06-13T07:00:00",
		"allDay" => true
	),
	array(
		"title" => "Click for Google",
		"start" => "2014-06-28",
		"url" => "http://google.com/"
	),
	array(
		"title" => "Bloop",
		"start" => "2014-01-22"
	)
);

// Test loading
usleep(1000000); //1s

echo json_encode($events);

?>