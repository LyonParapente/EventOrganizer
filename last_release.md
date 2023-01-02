* Upgrade libraries
Switch to Flask 2 and upgrade other librairies.
To keep auto swagger generation and benefit from libs like python marshmallow => switch to apiflask
This required substantial changes to object schemas.
BREAKING change: secrets.py should now be called app_secrets.py to avoid import issue
/swagger is now openapi 3
* Improve README and add a screenshot
