# EventOrganizer

Organize events in your community!  
We're a paragliding club but this tool could definitely be used by other groups.  
Our instance is located at: https://calendrier.lyonparapente.fr

![Screenshot](https://github.com/LyonParapente/EventOrganizer/raw/master/screenshot.png)

Main goals:
* Mobile friendly
* Ability to organize events for one or more days
  * Each event has a name, description, date and meeting point
  * Comments can be exchange between members for this event
  * Nice to have: organize transport (how many vehicules available for how many persons...)
* Intuitive & nice looking
* List of members (restrict access)
* Emails notifications
* Promote communication (Phone, WhatsApp, ...)


# Developer

## Requirements

* Front: [Node & NPM](https://nodejs.org/)
* Back: Python

## Front

First time: `npm install --also=dev`

We're using [gulp.js](https://gulpjs.com/) to "compile" the front.

Just execute: `gulp`

If you want a webserver with live reload: `gulp serve`  
and your browser should open http://localhost:3000/calendar.html

Each time you save a source file, [browserSync](https://www.browsersync.io) reloads the page of all connected browsers, even your phone :). See `gulp.watch` in gulpfile.js.


## Back

See [BACK](BACK.md) for how to configure both your local development environment your production environment.


# Stack

* [FullCalendar](https://fullcalendar.io/) with [Bootstrap](https://getbootstrap.com) & [jQuery](https://jquery.com/)
* [Font Awesome](https://fontawesome.com/)
* [Leaflet](https://leafletjs.com) with [OpenStreetMap](https://www.openstreetmap.org/about) and [Esri](https://esri.github.io/esri-leaflet/)

