# Local installation

If you're new with Python, pip and virtualenv, please read [Installing packages using pip and virtual environments](https://packaging.python.org/guides/installing-using-pip-and-virtual-environments/)  
Basically meaning:
```
# install virtualenv
py -m pip install --user virtualenv
# create a virtual environment
py -m venv env
# activate it
.\env\Scripts\activate
# install requirements
py -m pip install wheel
py -m pip install -r .\requirements.txt
```

# Local run (dev)

`py .\app_flask.py`

Now open your browser to http://localhost:5000/  
It should redirect you to:
http://petstore.swagger.io/?url=http://localhost:5000/api/swagger.json  
Which allows you to see and interact with the API (click "Try it out").

You can also query:
* http://localhost:5000/api/swagger.json
* http://localhost:5000/api/v1.0/events?year=2020

Insert an event in database:  
`curl -i -H "Content-Type: application/json" -X POST -d "{\"title\": \"mon titre\", \"location\": \"mon endroit\", \"start_date\": \"2020-03-29\"}" http://localhost:5000/api/v1.0/events`


# Linux hosting (prod)

Follow the tutorial: [Flask + Gunicorn + Nginx + HTTPS](VPS.md)

