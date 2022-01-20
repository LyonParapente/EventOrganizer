var csrf: string;
var csrf_cookies = document.cookie.split('; ')
  .map(x => x.split('='))
  .filter(x => x[0] === 'csrf_access_token');
if (csrf_cookies.length)
{
  csrf = csrf_cookies[0][1];
}

export default function requestJson (method: string, url: string, params: QueryParameters, successCallback: (res: JSON, xhr: XMLHttpRequest)=>void, failureCallback: (err: string, xhr: XMLHttpRequest)=>void): void
{
  method = method.toUpperCase();
  var body = null;
  if (method === 'GET')
  {
    url = injectQueryStringParams(url, params);
  }
  else
  {
    body = JSON.stringify(params);
  }
  var xhr = new XMLHttpRequest();
  xhr.open(method, url, true);
  if (method !== 'GET')
  {
    xhr.setRequestHeader('Content-Type', 'application/json');
    if (csrf)
    {
      xhr.setRequestHeader('X-CSRF-TOKEN', csrf);
    }
  }
  xhr.onload = function ()
  {
    if (xhr.status >= 200 && xhr.status < 400)
    {
      var res;
      try
      {
        res = JSON.parse(xhr.responseText) as JSON;
      }
      catch (err)
      {
        failureCallback('Failure parsing JSON: '+(err as ErrorEvent).message, xhr);
      }
      if (res)
      {
        successCallback(res, xhr);
      }
    }
    else
    {
      failureCallback('Request failed', xhr);
    }
  };
  xhr.onerror = function ()
  {
    failureCallback('Request failed', xhr);
  };
  xhr.send(body);
}

function injectQueryStringParams (url: string, params: QueryParameters): string
{
  var parameters = encodeParams(params);
  if (parameters)
  {
    return url + (url.indexOf('?') === -1 ? '?' : '&') + parameters;
  }
  return url;
}

function encodeParams (params: QueryParameters): string
{
  var parts = [];
  for (var key in params)
  {
    if (Object.prototype.hasOwnProperty.call(params, key))
    {
      parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(params[key]));
    }
  }
  return parts.join('&');
}
