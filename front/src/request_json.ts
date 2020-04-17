
export default function requestJson (method: string, url: string, params: object, successCallback, failureCallback) {
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

function injectQueryStringParams (url: string, params: object) {
  return url +
    (url.indexOf('?') === -1 ? '?' : '&') +
    encodeParams(params);
}
function encodeParams (params: object) {
  var parts = [];
  for (var key in params) {
    if (params.hasOwnProperty(key)) {
      parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(params[key]));
    }
  }
  return parts.join('&');
}
