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

Front is made using TypeScript and [FuseBox](https://fuse-box.org/) bundler.  

First time: `npm install`

Launch compile & local web server with: `.\run.bat`   
Then open your browser to http://localhost:4444/

Each time you save a source file, FuseBox reloads the page of all connected browsers, even your phone :-).


## Back

See [BACK](BACK.md) for how to configure both your local development environment your production environment.

# Production deployment

Follow the tutorial: [Flask + Gunicorn + Nginx + HTTPS](VPS.md)

# Stack

* TypeScript and [FuseBox](https://fuse-box.org/) bundler
* [FullCalendar](https://fullcalendar.io/) with [Bootstrap](https://getbootstrap.com)
* [Font Awesome](https://fontawesome.com/)
* [Leaflet](https://leafletjs.com) with [OpenStreetMap](https://www.openstreetmap.org/about) and [Esri](https://esri.github.io/esri-leaflet/)

