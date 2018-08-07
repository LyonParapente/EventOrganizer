package core

type Application interface {
	Start() error
	GetLogger() *Logger
}

type App struct {
	Logger *Logger
	// Storage *Storage
}

func (a App) GetLogger() *Logger {
	return a.Logger
}

