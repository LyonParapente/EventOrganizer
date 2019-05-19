package srv

import (
	"net/http"

	"github.com/LyonParapente/EventOrganizer/core"
	"github.com/LyonParapente/EventOrganizer/templates"
)

type GetCalendar struct {
	App core.Application
}

func (c *GetCalendar) ServeHTTP(response http.ResponseWriter, request *http.Request) {
	p := templates.NewPage("EventOrganizer - Calendar", "Schedule an event")
	p.CSS = append(p.CSS, "css/fullcalendar.min.css", "css/calendar.css", "css/fontawesome-all.min.css")
	p.JS = append(p.JS, templates.JSRessources{
		{Src: "js/libs/fullcalendar.min.js"},
		{Src: "js/libs/fullcalendar-locale-fr.js"},
		{Src: "js/main.js"},
	}...)

	if err := templates.CalendarTmpl.ExecuteTemplate(response, "layout", &p); err != nil {
		c.App.GetLogger().Error("Unable to render "+p.Title+", err:", err)
	}
	return
}
