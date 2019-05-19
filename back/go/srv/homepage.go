package srv

import (
	"net/http"

	"github.com/LyonParapente/EventOrganizer/back/go/core"
	"github.com/LyonParapente/EventOrganizer/back/go/templates"
)

type GetHomepage struct {
	App core.Application
}

func (c *GetHomepage) ServeHTTP(response http.ResponseWriter, request *http.Request) {
	p := templates.NewPage("EventOrganizer - Homepage", "Homepage of this website")
	if err := templates.HomepageTmpl.ExecuteTemplate(response, "layout", &p); err != nil {
		c.App.GetLogger().Error("Unable to render "+p.Title+", err:", err)
	}
	return
}
