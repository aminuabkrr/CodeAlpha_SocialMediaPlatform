Auth.requireAuth();

const feedContainer = document.getElementById('feedContainer');
const loadMoreBtn = document.getElementById('loadMoreBtn');
let currentPage = 1;
let totalPages = 1;
let currentUser = null;

async function initFeed() {
  renderNavbar('feed');
  currentUser = Auth.getCachedUser();

  feedContainer.innerHTML = renderLoadingState();
  await loadFeedPage(1);
}

async function loadFeedPage(page) {
  try {
    const data = await api.getFeed(page);
    currentPage = data.pagination.page;
    totalPages = data.pagination.pages;

    if (page === 1) feedContainer.innerHTML = '';

    if (data.posts.length === 0 && page === 1) {
      feedContainer.innerHTML = renderEmptyState(
        'Your feed is empty. Follow some people or create your first post!'
      );
      loadMoreBtn.style.display = 'none';
      return;
    }

    data.posts.forEach((post) => {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = renderPostCard(post, currentUser.username);
      const cardEl = wrapper.firstElementChild;
      feedContainer.appendChild(cardEl);
      wireUpPostCard(cardEl);
    });

    loadMoreBtn.style.display = currentPage < totalPages ? 'block' : 'none';
  } catch (err) {
    feedContainer.innerHTML = renderEmptyState(`Could not load feed: ${err.message}`);
    loadMoreBtn.style.display = 'none';
  }
}

function wireUpPostCard(cardEl) {
  attachLikeHandler(cardEl);
  attachCommentHandlers(cardEl, currentUser.username);

  const deleteBtn = cardEl.querySelector('.delete-post-btn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', async () => {
      if (!confirm('Delete this post? This cannot be undone.')) return;
      try {
        await api.deletePost(cardEl.dataset.postId);
        cardEl.remove();
      } catch (err) {
        alert(err.message || 'Could not delete post');
      }
    });
  }

  const editBtn = cardEl.querySelector('.edit-post-btn');
  if (editBtn) {
    editBtn.addEventListener('click', () => {
      const contentEl = cardEl.querySelector('.post-content');
      const currentText = contentEl.textContent;
      const newText = prompt('Edit your post:', currentText);
      if (newText === null || newText.trim() === '' || newText === currentText) return;

      api
        .updatePost(cardEl.dataset.postId, { content: newText.trim() })
        .then(() => {
          contentEl.textContent = newText.trim();
        })
        .catch((err) => alert(err.message || 'Could not update post'));
    });
  }
}

loadMoreBtn.addEventListener('click', () => loadFeedPage(currentPage + 1));

initFeed();
