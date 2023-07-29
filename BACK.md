# Local installation

If you're new with Python, pip and virtualenv, please read [Installing packages using pip and virtual environments](https://packaging.python.org/guides/installing-using-pip-and-virtual-environments/)  
Basically meaning, for windows environment:

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

For linux, replace `py` with `python3` and virtualenv activation with: `source env/bin/activate`

# Local run (dev)

`py .\app_flask.py`

Now open your browser to http://localhost:5000/swagger  
It should allows you to see and interact with the API (click "Try it out").

You can also query:
* http://localhost:5000/swagger-online
* http://localhost:5000/api/events?year=2020

Insert an event in database:  
`curl -i -H "Content-Type: application/json" -X POST -d "{\"title\": \"mon titre\", \"location\": \"mon endroit\", \"start_date\": \"2020-03-29\"}" http://localhost:5000/api/events`

# Check for updates

For back:
```
pip install pip-outdated # install globally
.\env\Scripts\activate
pip-outdated
```

For front:
```
npm outdated
```

# Linux hosting (prod)

Follow the tutorial: [Flask + Gunicorn + Nginx + HTTPS](VPS.md)

