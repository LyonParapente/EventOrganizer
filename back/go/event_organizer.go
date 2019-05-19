package main

import (
	"net/http"

	"github.com/LyonParapente/EventOrganizer/core"
	"github.com/LyonParapente/EventOrganizer/srv"
	"github.com/LyonParapente/EventOrganizer/templates"
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
	router.Handle("/", homePageOrFileServer(&srv.GetHomepage{App: e}, http.FileServer(http.Dir(e.PublicPath))))
	router.Handle("/calendar", &srv.GetCalendar{App: e})

	router.Handle("/api/events", &srv.GetEvents{App: e})
	return router
}
