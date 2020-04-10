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
py -m pip install -r .\requirements.txt
```

## /!\ Manual fix #1 required
Edit `env\Lib\site-packages\flask_restful_swagger_3\__init__.py`  
Line 436, replace  
` f.__swagger_type = type_`
with  
` f.swagger_type = type_`

Function should look like this:
```
    def inner(f):
        f.swagger_type = type_
        return f
```

## /!\ Manual fix #2
Edit `env\Lib\site-packages\werkzeug\_reloader.py`  
Line 313, in def ensure_echo_on():, replace  
` if not sys.stdin.isatty():`
with  
` if sys.stdin is None or not sys.stdin.isatty():`


# Local run

`py .\app_flask.py "./event.db"`

Now open your browser to http://localhost:5000/  
It should redirect you to:
http://petstore.swagger.io/?url=http://localhost:5000/api/swagger.json  
Which allows you to see and interact with the API (click "Try it out").

You can also query:
* http://localhost:5000/api/swagger.json
* http://localhost:5000/api/v1.0/events?year=2020

Insert an event in database:  
`curl -i -H "Content-Type: application/json" -X POST -d "{\"title\": \"mon titre\", \"location\": \"mon endroit\", \"start_date\": \"2020-03-29\"}" http://localhost:5000/api/v1.0/events`



# IIS hosting
If you want to use an IIS hosting, please follow: [WFastCGI Installation](https://pypi.org/project/wfastcgi/)  
Basically:
```
cd C:\Users\<user>\AppData\Local\Programs\Python\Python38-32\Scripts
wfastcgi-enable appcmd.exe /apphostconfig:C:\Windows\System32\inetsrv\Config\applicationHost.config
```

You might need to:  
`%windir%\system32\inetsrv\appcmd.exe unlock config -section:system.webServer/handlers`
in case you get  
> "Config Error: This configuration section cannot be used at this path. This happens when the section is locked at a parent level. Locking is either by default (overrideModeDefault="Deny"), or set explicitly by a location tag with overrideMode="Deny" or the legacy allowOverride="false"."

Then this might help:
* https://medium.com/@rajesh.r6r/deploying-a-python-flask-rest-api-on-iis-d8d9ebf886e9
* https://gist.github.com/dvas0004/3d26c25d614c54ecdf296003d68cddaa



# Azure hosting

## Create WebApp

You can create a web app with the following powershell:
```
$ResourceGroup = "MyResourceGroup"
$AppName = "MyUniqueAppName"
$Plan = "ASP-$AppName"
$location = "francecentral"
$SKU = "B1"
# Use `az webapp list-runtimes` for available list.
$Runtime = '"python|3.6"'

az appservice plan create -g $ResourceGroup -n $Plan -l $location --sku $SKU
az webapp create -g $ResourceGroup -p $Plan -n $AppName --runtime $Runtime
```

## Configure Python

Then add the following extension: Python 3.6.4 x64  
The extension will properly register wfastcgi in `C:\Windows\System32\inetsrv\Config\applicationHost.config`

(cannot be done with az webapp...)
* Go to Configuration > General settings
* Set Stack = Python
* Python Version = 3.6
* Platform = 64bit
* Hit "Save"


## Configure deployment
```
$res = az webapp deployment source config-local-git --name $AppName --resource-group $ResourceGroup
$o = $res|ConvertFrom-Json

# You can either clone the repo,
# or do this on your existing local git repo:
#git remote add azure https://<deployment-username>@<app-name>.scm.azurewebsites.net/<app-name>.git 
git remote add azure $o.url
git push --set-upstream azure master
```

## Install pip requirements

It will create a python virtual environment automatically because of requirements.txt  
It might be of interest with httpPlatform.  
However, for wfastcgi, we need the python installed in `D:\home\python364x64\` so we don't care about `D:\home\site\wwwroot\env\`  
So i recommend to add a .skipPythonDeployment file  
And install requirements like so:
* Open the **Kudu Advanced Tools** > Debug console > CMD
* Execute the following cmdline

`D:\home\python364x64>python.exe -m pip install --upgrade -r d:\home\site\wwwroot\requirements.txt`


## Python + Azure links:
* https://github.com/azure/azure-python-siteextensions
* https://azure.github.io/AppService/2016/08/04/Upgrading-Python-on-Azure-App-Service.html
* https://docs.microsoft.com/en-us/visualstudio/python/managing-python-on-azure-app-service
* https://docs.microsoft.com/en-us/azure/app-service/containers/how-to-configure-python
* https://stackoverflow.com/questions/37317754/where-to-put-sqlite-database-file-in-azure-app-service
