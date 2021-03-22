var csrf: string;
var csrf_cookies = document.cookie.split('; ')
  .map(x => x.split('='))
  .filter(x => x[0] === 'csrf_access_token');
if (csrf_cookies.length)
{
  csrf = csrf_cookies[0][1];
}

export default function requestJson (method: string, url: string, params: object, successCallback: (res: any, xhr: any)=>void, failureCallback: (err: string, xhr: any)=>void): void {
  method = method.toUpperCase();
  var body = null;
  if (method === 'GET') {
    url = injectQueryStringParams(url, params);
  }
  else {
    body = JSON.stringify(params);
  }
  var xhr = new XMLHttpRequest();
  xhr.open(method, url, true);
  if (method !== 'GET') {
    xhr.setRequestHeader('Content-Type', 'application/json');
    if (csrf)
    {
      xhr.setRequestHeader('X-CSRF-TOKEN', csrf);
    }
  }
  xhr.onload = function () {
    if (xhr.status >= 200 && xhr.status < 400) {
      var res;
      try {
        res = JSON.parse(xhr.responseText);
      }
      catch (err) {
        failureCallback('Failure parsing JSON: '+err.message, xhr);
      }
      if (res)
      {
        successCallback(res, xhr);
      }
    }
    else {
      failureCallback('Request failed', xhr);
    }
  };
  xhr.onerror = function () {
    failureCallback('Request failed', xhr);
  };
  xhr.send(body);
}

function injectQueryStringParams (url: string, params: object): string {
  var parameters = encodeParams(params);
  if (parameters)
  {
    return url + (url.indexOf('?') === -1 ? '?' : '&') + parameters;
  }
  return url;
}

function encodeParams (params: object): string {
  var parts = [];
  for (var key in params) {
    if (params.hasOwnProperty(key)) {
      parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(params[key]));
    }
  }
  return parts.join('&');
}
