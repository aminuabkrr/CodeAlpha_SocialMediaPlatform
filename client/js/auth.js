const Auth = {
  getToken() {
    return localStorage.getItem('token');
  },

  isLoggedIn() {
    return !!this.getToken();
  },

  saveSession(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },

  getCachedUser() {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
  },

  // Call at the top of any page that requires a logged-in user.
  requireAuth() {
    if (!this.isLoggedIn()) {
      window.location.href = 'login.html';
    }
  },

  // Call at the top of login/register so an already-logged-in user
  // doesn't see the auth forms again.
  redirectIfLoggedIn() {
    if (this.isLoggedIn()) {
      window.location.href = 'feed.html';
    }
  },
};
