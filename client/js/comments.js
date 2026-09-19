/**
 * Wires up the comment toggle, list rendering, add, and delete
 * for a single post card element.
 */
function attachCommentHandlers(cardEl, currentUsername) {
  const postId = cardEl.dataset.postId;
  const toggleBtn = cardEl.querySelector('.toggle-comments-btn');
  const section = cardEl.querySelector('.comments-section');
  const listEl = cardEl.querySelector('.comments-list');
  const form = cardEl.querySelector('.add-comment-form');
  const input = cardEl.querySelector('.comment-input');
  const commentCountEl = cardEl.querySelector('.comment-count');

  let loaded = false;

  toggleBtn.addEventListener('click', async () => {
    const isHidden = section.style.display === 'none';
    section.style.display = isHidden ? 'block' : 'none';

    if (isHidden && !loaded) {
      listEl.innerHTML = renderLoadingState();
      try {
        const data = await api.getComments(postId);
        renderComments(data.comments);
        loaded = true;
      } catch (err) {
        listEl.innerHTML = renderEmptyState('Could not load comments.');
      }
    }
  });

  function renderComments(comments) {
    if (comments.length === 0) {
      listEl.innerHTML = renderEmptyState('No comments yet. Be the first!');
      return;
    }

    listEl.innerHTML = comments
      .map((c) => {
        const canDelete = c.author.username === currentUsername;
        return `
          <div class="comment-item" data-comment-id="${c._id}">
            <div class="comment-avatar">${initials(c.author.name)}</div>
            <div class="comment-body">
              <span class="comment-author">${escapeHtml(c.author.name)}</span>
              <span class="comment-text">${escapeHtml(c.content)}</span>
              <div class="comment-meta">
                ${timeAgo(c.createdAt)}
                ${canDelete ? '<button class="comment-delete-btn">Delete</button>' : ''}
              </div>
            </div>
          </div>
        `;
      })
      .join('');

    listEl.querySelectorAll('.comment-delete-btn').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const commentEl = e.target.closest('.comment-item');
        const commentId = commentEl.dataset.commentId;
        if (!confirm('Delete this comment?')) return;

        try {
          await api.deleteComment(commentId);
          commentEl.remove();
          commentCountEl.textContent = Math.max(0, parseInt(commentCountEl.textContent, 10) - 1);
          if (listEl.children.length === 0) {
            listEl.innerHTML = renderEmptyState('No comments yet. Be the first!');
          }
        } catch (err) {
          alert(err.message || 'Could not delete comment');
        }
      });
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const content = input.value.trim();
    if (!content) return;

    const submitBtn = form.querySelector('button');
    submitBtn.disabled = true;

    try {
      const data = await api.addComment(postId, content);

      if (listEl.querySelector('.empty-state')) {
        listEl.innerHTML = '';
      }
      const newComment = `
        <div class="comment-item" data-comment-id="${data.comment._id}">
          <div class="comment-avatar">${initials(data.comment.author.name)}</div>
          <div class="comment-body">
            <span class="comment-author">${escapeHtml(data.comment.author.name)}</span>
            <span class="comment-text">${escapeHtml(data.comment.content)}</span>
            <div class="comment-meta">
              just now
              <button class="comment-delete-btn">Delete</button>
            </div>
          </div>
        </div>
      `;
      listEl.insertAdjacentHTML('beforeend', newComment);

      const newEl = listEl.lastElementChild;
      newEl.querySelector('.comment-delete-btn').addEventListener('click', async () => {
        if (!confirm('Delete this comment?')) return;
        try {
          await api.deleteComment(data.comment._id);
          newEl.remove();
          commentCountEl.textContent = Math.max(0, parseInt(commentCountEl.textContent, 10) - 1);
        } catch (err) {
          alert(err.message || 'Could not delete comment');
        }
      });

      commentCountEl.textContent = parseInt(commentCountEl.textContent, 10) + 1;
      input.value = '';
      loaded = true;
    } catch (err) {
      alert(err.message || 'Could not post comment');
    } finally {
      submitBtn.disabled = false;
    }
  });
                           }
