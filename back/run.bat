@ECHO OFF

CALL env\Scripts\activate

::py -m pip install -r .\requirements.txt

SET FLASK_DEBUG=1
py .\app_flask.py
