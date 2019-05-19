package templates

import (
	"html/template"
	"path"
)

var (
	HomepageTmpl *template.Template
	CalendarTmpl *template.Template
)

// LoadTemplates load template at start-up to avoid to access to filesystem
// for each request and avoid to parse multiple time the template (too slow).
// TODO(mfranc): better to return an error properly to allow to catch and log them.
func LoadAllOrFail() {
	// Closure to simplify the generation of a template path
	tmplPath := func(name string) string {
		return path.Join("templates", name)
	}
	layoutPath := tmplPath("layout.html")
	HomepageTmpl = template.Must(template.ParseFiles(layoutPath, tmplPath("homepage.html")))
	CalendarTmpl = template.Must(template.ParseFiles(layoutPath, tmplPath("calendar.html")))
}

// Default and common ressources expected by layout
// TODO: update this with current front
var CommonCSSRessources = []string{"css/fontawesome-all.min.css"}
var CommonJSRessources = JSRessources{
	{Src: "js/libs/jquery.min.js"},
	{Src: "js/libs/moment.min.js"},
	{Src: "js/libs/bootstrap.min.js"},
}

// Common struct for each page (layout metadata)
type Page struct {
	Title       string
	Description string

	CSS []string
	JS  JSRessources
}

func NewPage(title, desc string) Page {
	return Page{
		Title:       title,
		Description: desc,
		CSS:         CommonCSSRessources,
		JS:          CommonJSRessources,
	}
}

type JSRessources []JSRessource
type JSRessource struct {
	Src   string
	Async bool
	Defer bool
}
