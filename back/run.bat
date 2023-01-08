@ECHO OFF

CALL env\Scripts\activate

::py -m pip install wheel
::py -m pip install -r .\requirements.txt

SET FLASK_ENV=development
py .\app_flask.py
