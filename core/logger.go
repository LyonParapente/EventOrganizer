package core

import (
	"log"
	"os"
	"strings"
)

type Logger struct {
	*log.Logger

	Level  LogLevel
	Output string
}

type LogLevel int

const (
	DEBUG LogLevel = iota
	INFO
	WARNING
	ERROR
)

func NewLogLevel(s string) LogLevel {
	switch strings.ToLower(s) {
	case "debug":
		return DEBUG
	case "info":
		return INFO
	case "warning":
		return WARNING
	case "error":
		return ERROR
	default:
		return INFO
	}
}

func NewLogger(prefix, output string, level LogLevel) *Logger {
	var l *log.Logger

	switch output {
	case "stdout":
		l = log.New(os.Stdout, prefix, log.LstdFlags|log.Lshortfile)
	default:
		f, err := os.OpenFile(output, os.O_WRONLY|os.O_APPEND|os.O_CREATE|os.O_TRUNC, 0666)
		if err != nil {
			log.Fatalln("Unable to initialize logger, err:", err)
		}
		l = log.New(f, prefix, log.LstdFlags|log.Lshortfile)
	}

	return &Logger{
		Logger: l,
		Level:  level,
	}
}

func (l Logger) Debug(v ...interface{}) {
	if l.Level <= DEBUG {
		l.Println("DEBUG:", v)
	}
}

func (l Logger) Info(v ...interface{}) {
	if l.Level <= INFO {
		l.Println("INFO:", v)
	}
}

func (l Logger) Warning(v ...interface{}) {
	if l.Level <= WARNING {
		l.Println("WARNING:", v)
	}
}

func (l Logger) Error(v ...interface{}) {
	if l.Level <= ERROR {
		l.Println("ERROR:", v)
	}
}
