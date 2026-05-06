(function () {
  function readCookie(name) {
    return document.cookie
      .split(';')
      .map(function (part) {
        return part.trim();
      })
      .filter(Boolean)
      .reduce(function (value, part) {
        var separator = part.indexOf('=');
        var key = separator >= 0 ? part.slice(0, separator) : part;
        if (key !== name) return value;
        return decodeURIComponent(separator >= 0 ? part.slice(separator + 1) : '');
      }, '');
  }

  var nativeFetch = window.fetch.bind(window);
  window.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : input && input.url;
    var options = init ? Object.assign({}, init) : {};
    var method = String(options.method || (input && input.method) || 'GET').toUpperCase();
    var isAdminApi = String(url || '').startsWith('/api/admin-') && !String(url || '').startsWith('/api/admin-auth');

    if (isAdminApi && !['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      var headers = new Headers(options.headers || (input && input.headers) || {});
      var csrf = readCookie('folks_admin_csrf');
      if (csrf && !headers.has('x-csrf-token')) {
        headers.set('x-csrf-token', csrf);
      }
      options.headers = headers;
      options.credentials = options.credentials || 'same-origin';
    }

    return nativeFetch(input, options);
  };

  function signOut() {
    fetch('/api/admin-logout', {
      method: 'POST',
    }).finally(function () {
      window.location.assign('/admin/login.html');
    });
  }

  function addLogoutButtons() {
    document.querySelectorAll('[data-admin-logout]').forEach(function (button) {
      button.addEventListener('click', signOut);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addLogoutButtons);
  } else {
    addLogoutButtons();
  }
})();
