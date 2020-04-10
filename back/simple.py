from flask import Flask
import os

app = Flask(__name__)

@app.route("/")
def hello():
  return "Hello, Flask!"

@app.route("/test")
def test():
  return "testing"

if __name__ == "__main__":
  app.run()
