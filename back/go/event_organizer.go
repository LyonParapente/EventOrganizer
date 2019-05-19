package main

import (
	"net/http"

	"github.com/LyonParapente/EventOrganizer/back/go/core"
	"github.com/LyonParapente/EventOrganizer/back/go/srv"
	"github.com/LyonParapente/EventOrganizer/back/go/templates"
)

type EventOrganizer struct {
	core.App

	Target     string
	PublicPath string
}

func (e *EventOrganizer) Start() error {
	e.GetLogger().Debug("Initialize templating...")
	templates.LoadAllOrFail()
	e.GetLogger().Info("Listen on", e.Target, "...")
	return http.ListenAndServe(e.Target, e.router())
}

// router initialize routings
func (e *EventOrganizer) router() http.Handler {
	router := http.NewServeMux()

	router.Handle("/avatars/", http.FileServer(http.Dir(e.PublicPath+"../data/")))
	router.Handle("/events/", http.FileServer(http.Dir(e.PublicPath+"../data/")))

	router.Handle("/calendar", &srv.GetCalendar{App: e})

	router.Handle("/api/events", &srv.GetEvents{App: e})

	// The "/" pattern matches everything
	router.Handle("/", homePageOrFileServer(&srv.GetHomepage{App: e}, http.FileServer(http.Dir(e.PublicPath))))

	return router
}
