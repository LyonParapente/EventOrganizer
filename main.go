package main

import (
	"flag"
	"strings"
	"os"

	"./core"
)

var (
	logLevel *string
	logOutput *string
	publicPath *string
	target *string
)

func init() {
	logLevel = flag.String("loglevel", "info", "Log level (ie: debug, info, warning, error)")
	logOutput = flag.String("logoutput", "stdout", "Log output")
	publicPath = flag.String("public-path", "./public", "Path of \"public\" directory")
	target = flag.String("target", ":8080", "HTTP target of listener")
}

func main() {
	flag.Parse()

	switch strings.ToLower(*logLevel) {
	case "debug", "info", "warning", "error":
	default:
		flag.PrintDefaults()
		os.Exit(1)
	}

	app := EventOrganizer{
		PublicPath: *publicPath,
		Target: *target,
	}
	app.Logger = core.NewLogger("", "stdout", core.NewLogLevel(*logLevel))

	if err := app.Start(); err != nil {
		app.Logger.Fatalln("Unable to start EventOrganazer, err:", err)
	}
}
