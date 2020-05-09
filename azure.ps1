param (
  [string]$ResourceGroup = "EventOrganizer",
  [string]$AppName = "letsgogliding",
  [string]$Plan = "ASP-$AppName",
  [string]$location = "francecentral",
  [string]$Tier = "Basic",
  [string]$ApiVersion = "2018-02-01"
)

Write-Host "Create an App Service plan"
New-AzAppServicePlan -Name $Plan `
  -Location $location `
  -Tier $Tier `
  -ResourceGroupName $ResourceGroup `
  -ErrorAction Stop

Write-Host "Create a web app"
New-AzWebApp -Name $AppName `
  -ResourceGroupName $ResourceGroup `
  -Location $location `
  -AppServicePlan $Plan `
  -ErrorAction Stop

Write-Host "Install Python extension with wfastcgi"
# Note: the extension will properly register wfastcgi in C:\Windows\System32\inetsrv\Config\applicationHost.config
New-AzResource -ResourceType "Microsoft.Web/sites/siteextensions" `
  -Name "$AppName/azureappservice-python364x64" `
  -ResourceGroupName $ResourceGroup `
  -ApiVersion $ApiVersion `
  -Force `
  -ErrorAction Stop

Write-Host "Enforce HTTPS with TLS/1.2"
Set-AzWebApp -Name $AppName -ResourceGroupName $ResourceGroup `
  -MinTlsVersion "1.2" `
  -HttpsOnly $true `
  -AlwaysOn $true `
  -ErrorAction Stop

Write-Host "Enable HTTP/2"
$http2 = @{ http20Enabled = $true; }
Set-AzResource -PropertyObject $http2 `
  -ResourceGroupName $ResourceGroup `
  -ResourceType Microsoft.Web/sites/config `
  -ResourceName "$AppName/web" `
  -ApiVersion $ApiVersion `
  -Force

#------------------------------
# WebJob: install-pip-requirements

Write-Host "Create a webjob to install/upgrade pip requirements"
# Based on https://github.com/projectkudu/kudu/wiki/Deploying-a-WebJob-using-PowerShell-ARM-Cmdlets

function Get-KuduApiAuthorisationHeaderValue($ResourceGroup, $AppName){
  [xml]$publishingCredentials =  Get-AzWebAppPublishingProfile -ResourceGroupName $ResourceGroup -Name $AppName
  $profile = $publishingCredentials.publishData.publishProfile[0]
  return ("Basic {0}" -f [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes(("{0}:{1}" -f 
    $profile.userName, $profile.userPWD))))
}

$webjobname = "install-pip-requirements"
$tempPath = "${env:TEMP}\$webjobname.ps1"
$requirements = (Get-Content back/requirements.txt) -join "`n"
$script = @"
`$r = 'd:\home\site\wwwroot\requirements.txt'
if (!(Test-Path `$r))
{
  # Initial requirements
  Set-Content -Path `$r '$requirements'
}

# Go into python installation
PUSHD D:\home\python364x64

# Run pip
CMD /C python.exe -m pip install --upgrade -r `$r

# Fix flask_restful_swagger_3 ; edit: no more required
#`$c = Get-Content Lib\site-packages\flask_restful_swagger_3\__init__.py
#`$c2 = `$c.Replace('f.__swagger_type = type_', 'f.swagger_type = type_')
#Set-Content Lib\site-packages\flask_restful_swagger_3\__init__.py `$c2

POPD
"@
Set-Content -Path $tempPath $script
Write-Host "$tempPath created"

$accessToken = Get-KuduApiAuthorisationHeaderValue $ResourceGroup $Appname
#Generating header to create and publish the Webjob :
$Header = @{
'Content-Disposition'="attachment; filename=$webjobname.ps1"
'Authorization'=$accessToken
}

Write-Host "Create the webjob: $webjobname"
$apiUrl = "https://$AppName.scm.azurewebsites.net/api/triggeredwebjobs/$webjobname"
$result = Invoke-RestMethod -Uri $apiUrl -Headers $Header -Method PUT -InFile $tempPath -ContentType 'application/text'

Write-Host "Run the webjob: $webjobname"
$resp = Invoke-WebRequest -Uri "$apiUrl/run" -Headers $Header -Method POST -ContentType "multipart/form-data"

# Clean up
Remove-Item -Path $tempPath


#--------------------------------------------------
# WebJob: tomorrow-events 

$minLength = 15 ## characters
$maxLength = 40 ## characters
$length = Get-Random -Minimum $minLength -Maximum $maxLength
$nonAlphaChars = 5
$token = [System.Web.Security.Membership]::GeneratePassword($length, $nonAlphaChars)
$token = $token -replace "[&#?=]","" # avoid problematic caracters in url

$webjobname = "tomorrow-events"
$tempPath = "${env:TEMP}\$webjobname.ps1"
$script = @"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
Invoke-WebRequest -Uri `"https://$AppName.azurewebsites.net/tomorrow_events?token=$token`"
"@
Set-Content -Path $tempPath $script
Write-Host "$tempPath created"

$Header = @{
'Content-Disposition'="attachment; filename=$webjobname.ps1"
'Authorization'=$accessToken
}

Write-Host "Create the webjob: $webjobname"
$apiUrl = "https://$AppName.scm.azurewebsites.net/api/triggeredwebjobs/$webjobname"
Invoke-RestMethod -Uri $apiUrl -Headers $Header -Method PUT -InFile $tempPath -ContentType 'application/text'
Remove-Item -Path $tempPath

$schedule = @{
  # Every 30s
  #"schedule" = "*/30 * * * * *"
  
  # At 15H UTC every day:
  "schedule" = "0 0 15 * * *"
} | ConvertTo-Json
Invoke-RestMethod -Uri "$apiUrl/settings" -Headers $Header -Method PUT -ContentType 'application/json' -Body $schedule

Write-Host "Add the following line to your secrets.py"
Write-Host "DAILY_CHECK = '$token'"

#--------------------------------------------------

Write-Host "The End"