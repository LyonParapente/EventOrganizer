package serialization

import (
	"time"
)

type Events []Event

type Event struct {
	Title string `json:"title"`
	Start time.Time `json:"start"`
	End *time.Time `json:"end,omitempty"`
	Color string `json:"color,omitempty"`
	AllDay bool `json:"allDay"`
	Url string `json:"url,omitempty"`
}

func NewEvent(title string, start time.Time) Event {
	return Event{
		Title: title,
		Start: start,
	}
}