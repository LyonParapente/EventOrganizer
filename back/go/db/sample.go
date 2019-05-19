package db

import (
	"time"

	"github.com/LyonParapente/EventOrganizer/back/go/serialization"
)

// Temporary method (just for devel) to get a list of events, next get events from db storage.
func EventsSample() []serialization.Event {
	// Just for devel, next get events from db storage
	end1 := time.Date(2014, 6, 10, 0, 0, 0, 0, time.Local)
	end2 := time.Date(2014, 6, 22, 0, 0, 0, 0, time.Local)
	end3 := time.Date(2014, 6, 12, 12, 30, 0, 0, time.Local)
	return []serialization.Event{
		{
			Title: "All Day Event",
			Start: time.Date(2017, 6, 1, 0, 0, 0, 0, time.Local),
		},
		{
			Title: "Long Event",
			Start: time.Date(2014, 6, 7, 0, 0, 0, 0, time.Local),
			End:   &end1,
		},
		{
			Title: "Repeating Event",
			Start: time.Date(2014, 6, 9, 16, 0, 0, 0, time.Local),
		},
		{
			Title: "AAAA",
			Start: time.Date(2014, 6, 9, 9, 0, 0, 0, time.Local),
		},
		{
			Title: "BBBB",
			Start: time.Date(2014, 6, 9, 9, 0, 0, 0, time.Local),
		},
		{
			Title: "CCCC",
			Start: time.Date(2014, 6, 9, 9, 0, 0, 0, time.Local),
		},
		{
			Title: "DDDD",
			Start: time.Date(2014, 6, 9, 9, 0, 0, 0, time.Local),
		},
		{
			Title: "EEEE",
			Start: time.Date(2014, 6, 9, 9, 0, 0, 0, time.Local),
		},
		{
			Title: "FFFF",
			Start: time.Date(2014, 6, 9, 9, 0, 0, 0, time.Local),
		},
		{
			Title: "Repeating Event",
			Start: time.Date(2014, 6, 16, 16, 0, 0, 0, time.Local),
		},
		{
			Title: "Dune du Pyla",
			Start: time.Date(2014, 6, 18, 0, 0, 0, 0, time.Local),
			End:   &end2,
			Color: "#ff9f89",
		},
		{
			Title: "Meeting",
			Start: time.Date(2014, 6, 12, 10, 30, 0, 0, time.Local),
			End:   &end3,
		},
		{
			Title: "Lunch",
			Start: time.Date(2014, 6, 12, 12, 0, 0, 0, time.Local),
		},
		{
			Title:  "Birthday Party",
			Start:  time.Date(2014, 6, 13, 7, 0, 0, 0, time.Local),
			AllDay: true,
		},
		{
			Title: "Click for Google",
			Start: time.Date(2014, 6, 28, 0, 0, 0, 0, time.Local),
			Url:   "http://google.com/",
		},
		{
			Title: "Bloop",
			Start: time.Date(2014, 1, 22, 0, 0, 0, 0, time.Local),
		},
	}
}
