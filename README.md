# EventOrganizer

Organize events in your community!

We're a paragliding club but this tool could definitely be used by other groups.

Main goals:
* Intuitive & nice looking
* Mobile friendly (we're often outside...)
* Ability to organize events for one or more days
** Each event has a name, description, date and meeting point
** Comments can be exchange between members for this event
** Nice to have: organize transport (how many vehicules available for how many persons...)
* List of members (restrict access)
* Emails notifications
* Stats (per month / year)


# Developer

## Fast debug

Open calendar.dev.html in your favorite browser

## Normal debug

[npm](https://www.npmjs.com/) & [gulp](https://gulpjs.com/) are used

### Prepare

First time: `npm install`
If you want to update dependancies: `npm update`

### Run

Just execute: `gulp`


There is a default task (see `gulpfile.js`) which launch a small http server on port 3000.
Please open http://localhost:3000/calendar.dev.html

Each time you save a source file, [browserSync](https://www.browsersync.io) reloads the page of all connected browsers, even your phone :). See `gulp.watch`.



# Stack

* [FullCalendar](https://fullcalendar.io/) with [Bootstrap](https://getbootstrap.com)
* [Font Awesome](https://fontawesome.com/)
* [Moment.js](https://momentjs.com)
* [jQuery](https://jquery.com/)
* [GoLang](https://golang.org/)
