/**
 * Builds a single post card's HTML. `currentUsername` decides whether
 * edit/delete controls render for this viewer.
 */
function renderPostCard(post, currentUsername) {
  const isOwner = post.author.username === currentUsername;
  const avatar = post.author.profileImage
    ? `<img class="avatar" src="${escapeHtml(post.author.profileImage)}" alt="${escapeHtml(post.author.name)}" />`
    : `<div class="avatar">${initials(post.author.name)}</div>`;

  return `
    <article class="post-card" data-post-id="${post._id}">
      <div class="post-header">
        ${avatar}
        <div>
          <div class="post-author-name">
            <a href="profile.html?username=${post.author.username}">${escapeHtml(post.author.name)}</a>
          </div>
          <div class="post-author-username">@${escapeHtml(post.author.username)} &middot; <span class="post-timestamp">${timeAgo(post.createdAt)}</span></div>
        </div>
        ${isOwner ? `
          <div style="margin-left:auto; display:flex; gap:8px;">
            <button class="post-action-btn edit-post-btn" title="Edit post">Edit</button>
            <button class="post-action-btn delete-post-btn" title="Delete post">Delete</button>
          </div>` : ''}
      </div>

      <div class="post-content">${escapeHtml(post.content)}</div>
      ${post.imageUrl ? `<img class="post-image" src="${escapeHtml(post.imageUrl)}" alt="Post image" />` : ''}

      <div class="post-actions">
        <button class="post-action-btn like-btn ${post.isLiked ? 'liked' : ''}" data-liked="${!!post.isLiked}">
          <span class="like-icon">${post.isLiked ? '♥' : '♡'}</span>
          <span class="like-count">${post.likeCount}</span>
        </button>
        <button class="post-action-btn toggle-comments-btn">
          💬 <span class="comment-count">${post.commentCount}</span>
        </button>
      </div>

      <div class="comments-section" style="display:none;">
        <div class="comments-list"></div>
        <form class="add-comment-form">
          <input type="text" class="comment-input" placeholder="Write a comment..." maxlength="300" />
          <button type="submit" class="btn btn-primary btn-sm">Post</button>
        </form>
      </div>
    </article>
  `;
}

function renderEmptyState(message) {
  return `<div class="empty-state">${escapeHtml(message)}</div>`;
}

function renderLoadingState() {
  return `<div class="loading-state"><span class="spinner"></span> Loading...</div>`;
}
