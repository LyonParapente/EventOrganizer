package main

import (
	"net/http"

	"./core"
	"./srv"
)

type EventOrganizer struct {
	core.App

	Target string
	PublicPath string
}

func (e *EventOrganizer) Start() error {
	router := http.NewServeMux()
	router.Handle("/", http.FileServer(http.Dir(e.PublicPath)))
	router.Handle("/events", &srv.GetEvents{App: e})

	e.GetLogger().Info("Listen on",e.Target,"...")
	return http.ListenAndServe(e.Target, router)
}
