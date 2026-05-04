(function () {
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
