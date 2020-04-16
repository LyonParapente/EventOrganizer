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
$result = Invoke-RestMethod -Uri $apiUrl -Headers $Header -Method Put -InFile $tempPath -ContentType 'application/text'

Write-Host "Run the webjob: $webjobname"
$resp = Invoke-WebRequest -Uri "$apiUrl/run" -Headers $Header -Method Post -ContentType "multipart/form-data"

# Clean up
Remove-Item -Path $tempPath

Write-Host "The End"