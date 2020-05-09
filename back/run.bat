@ECHO OFF

:: .\env\Scripts\activate
:: py -m pip install -r .\requirements.txt

CALL env\Scripts\activate
SET FLASK_ENV=development
py .\app_flask.py