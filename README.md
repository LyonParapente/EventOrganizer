# EventOrganizer

Organize events in your community!  
We're a paragliding club but this tool could definitely be used by other groups.  
Our instance is located at: https://calendrier.lyonparapente.fr

![Screenshot](https://github.com/LyonParapente/EventOrganizer/raw/main/screenshot.png)

An event:  
![Screenshot event](https://github.com/LyonParapente/EventOrganizer/raw/main/screenshot_event.png)

Main goals:
* Mobile friendly
* Ability to organize events for one or more days
  * Each event has a name, description, date and meeting point
  * A map shows the rendez-vous point
  * Comments can be exchange between members for this event
  * Each member can set his/her status to participant or interested
* Intuitive & nice looking
* List of members (access restricted)
* Emails notifications
* Promote communication (Phone, WhatsApp, ...)


# Developer

## Docker setup (recommended)

One command, same setup on Windows, macOS and Linux (requires [Docker](https://docs.docker.com/get-docker/)):

```
docker compose up
```

Then open http://localhost:8000/ and log in with `admin@example.com` / `admin1234`.  
Back (Python) and front (TypeScript) both hot-reload on save, and all outgoing emails are caught locally at http://localhost:8025.

See [DEV](DEV.md) for details (dev accounts, front-only mock mode, resetting data, platform notes).

## Manual setup

Currently developped on Windows but Linux also possible.

### Requirements

* Front: [Node & NPM](https://nodejs.org/)
* Back: [Python 3](https://www.python.org/)

### Front

Front is made using TypeScript and [FuseBox](https://github.com/fuse-box/fuse-box) bundler.  

First time: `npm install`

Launch compile & local web server with: `.\run.bat`  
Then open your browser to http://localhost:4444/

Each time you save a source file, FuseBox reloads the page of all connected browsers, even your phone :-).

### Back

See [BACK](BACK.md) for how to configure your local development environment.

# Production deployment

Running on linux.  
Follow the tutorial: [Flask + Gunicorn + Nginx + HTTPS](VPS.md)

# Stack

## Front
* [TypeScript](https://www.typescriptlang.org/) and [FuseBox](https://github.com/fuse-box/fuse-box) bundler
* [FullCalendar](https://fullcalendar.io/) with [Bootstrap](https://getbootstrap.com)
* [Font Awesome](https://fontawesome.com/)
* [Leaflet](https://leafletjs.com) with [OpenStreetMap](https://www.openstreetmap.org/about) and [Esri](https://esri.github.io/esri-leaflet/)

## Back
* [Python 3](https://www.python.org/)
* [Flask](https://flask.palletsprojects.com/)
* [APIFlask](https://apiflask.com/)
* and a few other useful packages, see back/requirements.txt
