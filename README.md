# EventOrganizer

Organize events in your community!

We're a paragliding club but this tool could definitely be used by other groups.

Main goals:
* Ability to organize events for one or more days
  * Each event has a name, description, date and meeting point
  * Comments can be exchange between members for this event
  * Nice to have: organize transport (how many vehicules available for how many persons...)
* Intuitive & nice looking
* Mobile friendly
* List of members (restrict access)
* Emails notifications
* Stats (per month / year)


# Developer

## Requirements

* Front: [Node & NPM](https://nodejs.org/)
* Back: Python

## Front

First time: `npm install`

I'm using [gulp.js](https://gulpjs.com/) to "compile" the front.

Just execute: `gulp`
and your browser should open http://localhost:3000/calendar.html

There is a default task (see `gulpfile.js`) which launch a small http server on port 3000.
This does not use the go server implementation.

Each time you save a source file, [browserSync](https://www.browsersync.io) reloads the page of all connected browsers, even your phone :). See `gulp.watch`.


## Back

See [[Back]]


# Stack

* [FullCalendar](https://fullcalendar.io/) with [Bootstrap](https://getbootstrap.com) & [jQuery](https://jquery.com/)
* [Font Awesome](https://fontawesome.com/)
* [Leaflet](https://leafletjs.com) with [OpenStreetMap](https://www.openstreetmap.org/about) and [Esri](https://esri.github.io/esri-leaflet/)

