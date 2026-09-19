function renderNavbar(activePage = '') {
  const user = Auth.getCachedUser();
  const navEl = document.getElementById('navbar');
  if (!navEl || !user) return;

  navEl.innerHTML = `
    <div class="brand">CodeAlpha Social</div>
    <nav>
      <a href="feed.html" class="${activePage === 'feed' ? 'active' : ''}">Feed</a>
      <a href="search.html" class="${activePage === 'search' ? 'active' : ''}">Search</a>
      <a href="create-post.html" class="${activePage === 'create' ? 'active' : ''}">Post</a>
      <a href="profile.html?username=${user.username}" class="${activePage === 'profile' ? 'active' : ''}">${escapeHtml(user.name)}</a>
      <button id="logoutBtn">Log out</button>
    </nav>
  `;

  document.getElementById('logoutBtn').addEventListener('click', () => Auth.logout());
}

// Shared escaping helper - used everywhere user-generated content is
// injected via innerHTML, to prevent stored XSS via post/comment/bio content.
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

function timeAgo(dateString) {
  const seconds = Math.floor((Date.now() - new Date(dateString)) / 1000);
  const intervals = [
    ['y', 31536000], ['mo', 2592000], ['d', 86400], ['h', 3600], ['m', 60],
  ];
  for (const [label, secs] of intervals) {
    const count = Math.floor(seconds / secs);
    if (count >= 1) return `${count}${label} ago`;
  }
  return 'just now';
}

function initials(name) {
  if (!name) return '?';
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
}
