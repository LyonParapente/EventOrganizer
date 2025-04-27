# Local installation

If you're new with Python, pip and virtualenv, please read [Installing packages using pip and virtual environments](https://packaging.python.org/guides/installing-using-pip-and-virtual-environments/)  
Basically meaning, for windows environment:

```
# install virtualenv
py -m pip install --user virtualenv
# create a virtual environment
py -m venv env313
# activate it
.\env313\Scripts\activate
# install requirements
py -m pip install wheel
py -m pip install -r .\requirements.txt
```

For linux, replace `py` with `python3` and virtualenv activation with: `source env313/bin/activate`

## Setup application
```
cp app_secrets.sample.py app_secrets.py
nano app_secrets.py  # make required changes
```
Also make sure settings are ok:
```
nano settings.py  # make required changes
```
(domain is not important when running locally, don't worry about it)

Install locale if needed:
```
# sudo apt-get install language-pack-fr
sudo locale-gen fr_FR
sudo locale-gen fr_FR.UTF-8
sudo update-locale
```

# Local run (dev)

`flask --app app_flask run` or `py .\app_flask.py`

Now open your browser to http://localhost:5000/  

API can be browsed here: http://localhost:5000/swagger  
It should allows you to see and interact with the API (click "Try it out").

You can also query:
* http://localhost:5000/swagger-online
* http://localhost:5000/api/events?year=2020

# Create admins

Each admin should be created like a normal user (through gui or api), then manually update its role to 'admin'.

`sqlite3 events.db "UPDATE users SET role='admin' WHERE id=101"` (replace id accordingly)

# Check for updates

For back:
```
pip install pip-outdated # install globally
.\env313\Scripts\activate
pip-outdated
```

For front:
```
npm outdated
```

# Linux hosting (prod)

Follow the tutorial: [Flask + Gunicorn + Nginx + HTTPS](VPS.md)

