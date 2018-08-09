package srv

import (
	"encoding/json"
	"net/http"

	"github.com/LyonParapente/EventOrganizer/core"
	"github.com/LyonParapente/EventOrganizer/db"
)

type GetEvents struct {
	App core.Application
}

func (c *GetEvents) ServeHTTP(response http.ResponseWriter, request *http.Request) {
	data, err := json.Marshal(db.EventsSample())
	if err != nil {
		response.WriteHeader(500)
		c.App.GetLogger().Error("Unable to serialize events, err:", err)
		response.Write([]byte("Unable to serialize events"))
		return
	}
	response.Header().Set("Content-Type", "application/json")
	response.Write(data)
	return
}
