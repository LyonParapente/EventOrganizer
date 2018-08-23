package main

import (
	"net/http"
)

func homePageOrFileServer(homePage http.Handler, fileServer http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if(r.URL.Path == "/"){
			homePage.ServeHTTP(w, r)
		} else {
			fileServer.ServeHTTP(w, r)
		}
	});
}