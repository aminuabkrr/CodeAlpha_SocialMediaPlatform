Auth.requireAuth();

const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');
const resultsContainer = document.getElementById('resultsContainer');

let currentUser = null;
let currentQuery = '';
let currentPage = 1;
let totalPages = 1;
let debounceTimer = null;

function initSearch() {
  renderNavbar('search');
  currentUser = Auth.getCachedUser();
  resultsContainer.innerHTML = renderEmptyState('Search for people by name or username.');
}

async function runSearch(query, page = 1) {
  if (!query.trim()) {
    resultsContainer.innerHTML = renderEmptyState('Search for people by name or username.');
    return;
  }

  currentQuery = query;
  resultsContainer.innerHTML = renderLoadingState();

  try {
    const data = await api.searchUsers(query, page);
    currentPage = data.pagination.page;
    totalPages = data.pagination.pages;

    if (data.users.length === 0) {
      resultsContainer.innerHTML = renderEmptyState(`No users found for "${escapeHtml(query)}".`);
      return;
    }

    resultsContainer.innerHTML = data.users.map(renderUserResultCard).join('');

    resultsContainer.querySelectorAll('.follow-btn').forEach((btn) => {
      attachFollowHandler(btn, btn.dataset.userId);
    });

    if (currentPage < totalPages) {
      resultsContainer.insertAdjacentHTML(
        'beforeend',
        `<button class="btn btn-secondary btn-block" id="searchLoadMoreBtn" style="margin-top:12px;">Load more</button>`
      );
      document.getElementById('searchLoadMoreBtn').addEventListener('click', () => {
        loadMoreResults();
      });
    }
  } catch (err) {
    resultsContainer.innerHTML = renderEmptyState(`Search failed: ${err.message}`);
  }
}

async function loadMoreResults() {
  try {
    const data = await api.searchUsers(currentQuery, currentPage + 1);
    currentPage = data.pagination.page;
    totalPages = data.pagination.pages;

    const loadMoreBtn = document.getElementById('searchLoadMoreBtn');
    if (loadMoreBtn) loadMoreBtn.remove();

    resultsContainer.insertAdjacentHTML('beforeend', data.users.map(renderUserResultCard).join(''));
    resultsContainer.querySelectorAll('.follow-btn:not([data-wired])').forEach((btn) => {
      btn.dataset.wired = 'true';
      attachFollowHandler(btn, btn.dataset.userId);
    });

    if (currentPage < totalPages) {
      resultsContainer.insertAdjacentHTML(
        'beforeend',
        `<button class="btn btn-secondary btn-block" id="searchLoadMoreBtn" style="margin-top:12px;">Load more</button>`
      );
      document.getElementById('searchLoadMoreBtn').addEventListener('click', loadMoreResults);
    }
  } catch (err) {
    alert(err.message || 'Could not load more results');
  }
}

function renderUserResultCard(user) {
  const avatar = user.profileImage
    ? `<img class="avatar" src="${escapeHtml(user.profileImage)}" alt="${escapeHtml(user.name)}" />`
    : `<div class="avatar">${initials(user.name)}</div>`;

  return `
    <div class="user-result-card">
      <a href="profile.html?username=${user.username}" class="user-result-link">
        ${avatar}
        <div>
          <div class="post-author-name">${escapeHtml(user.name)}</div>
          <div class="post-author-username">@${escapeHtml(user.username)}</div>
        </div>
      </a>
      ${renderFollowButton(user._id, user.isFollowing)}
    </div>
  `;
}

// Debounced live search as the user types, plus explicit form submit.
searchInput.addEventListener('input', () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => runSearch(searchInput.value), 400);
});

searchForm.addEventListener('submit', (e) => {
  e.preventDefault();
  clearTimeout(debounceTimer);
  runSearch(searchInput.value);
});

initSearch();
