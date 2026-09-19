Auth.requireAuth();

const params = new URLSearchParams(window.location.search);
const targetUsername = params.get('username');

const profileHeader = document.getElementById('profileHeader');
const postsContainer = document.getElementById('postsContainer');
const loadMoreBtn = document.getElementById('loadMoreBtn');

let currentUser = null;
let profileUser = null;
let currentPage = 1;
let totalPages = 1;

async function initProfile() {
  renderNavbar('profile');
  currentUser = Auth.getCachedUser();

  if (!targetUsername) {
    profileHeader.innerHTML = renderEmptyState('No user specified.');
    return;
  }

  profileHeader.innerHTML = renderLoadingState();

  try {
    const data = await api.getProfile(targetUsername);
    profileUser = data.user;
    renderProfileHeader(data.user, data.isFollowing);
    await loadUserPosts(1);
  } catch (err) {
    profileHeader.innerHTML = renderEmptyState(`Could not load profile: ${err.message}`);
  }
}

function renderProfileHeader(user, isFollowing) {
  const isOwnProfile = user.username === currentUser.username;
  const avatar = user.profileImage
    ? `<img class="avatar profile-avatar-lg" src="${escapeHtml(user.profileImage)}" alt="${escapeHtml(user.name)}" />`
    : `<div class="avatar profile-avatar-lg">${initials(user.name)}</div>`;

  profileHeader.innerHTML = `
    <div class="profile-card">
      ${avatar}
      <div class="profile-info">
        <h1>${escapeHtml(user.name)}</h1>
        <p class="post-author-username">@${escapeHtml(user.username)}</p>
        ${user.bio ? `<p class="profile-bio">${escapeHtml(user.bio)}</p>` : ''}
        <div class="profile-stats">
          <span><strong>${user.followersCount}</strong> Followers</span>
          <span><strong>${user.followingCount}</strong> Following</span>
        </div>
      </div>
      <div class="profile-actions">
        ${
          isOwnProfile
            ? `<button class="btn btn-secondary" id="editProfileBtn">Edit Profile</button>`
            : renderFollowButton(user._id, isFollowing)
        }
      </div>
    </div>

    ${isOwnProfile ? renderEditProfileForm(user) : ''}
  `;

  if (isOwnProfile) {
    wireUpEditProfile(user);
  } else {
    const followBtn = profileHeader.querySelector('.follow-btn');
    attachFollowHandler(followBtn, user._id, (nowFollowing) => {
      const statEl = profileHeader.querySelector('.profile-stats span:first-child strong');
      const current = parseInt(statEl.textContent, 10);
      statEl.textContent = nowFollowing ? current + 1 : current - 1;
    });
  }
}

function renderEditProfileForm(user) {
  return `
    <form id="editProfileForm" class="edit-profile-form" style="display:none;">
      <div class="form-group">
        <label for="editName">Name</label>
        <input type="text" id="editName" value="${escapeHtml(user.name)}" required />
      </div>
      <div class="form-group">
        <label for="editBio">Bio</label>
        <textarea id="editBio" maxlength="160" rows="3">${escapeHtml(user.bio || '')}</textarea>
      </div>
      <div class="form-group">
        <label for="editProfileImage">Profile Image URL</label>
        <input type="text" id="editProfileImage" value="${escapeHtml(user.profileImage || '')}" placeholder="https://..." />
      </div>
      <div id="editProfileAlert" class="alert alert-error" style="display:none;"></div>
      <div style="display:flex; gap:8px;">
        <button type="submit" class="btn btn-primary">Save Changes</button>
        <button type="button" class="btn btn-secondary" id="cancelEditBtn">Cancel</button>
      </div>
    </form>
  `;
}

function wireUpEditProfile(user) {
  const editBtn = document.getElementById('editProfileBtn');
  const form = document.getElementById('editProfileForm');
  const cancelBtn = document.getElementById('cancelEditBtn');
  const alertBox = document.getElementById('editProfileAlert');

  editBtn.addEventListener('click', () => {
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
  });

  cancelBtn.addEventListener('click', () => {
    form.style.display = 'none';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    alertBox.style.display = 'none';

    const payload = {
      name: document.getElementById('editName').value.trim(),
      bio: document.getElementById('editBio').value.trim(),
      profileImage: document.getElementById('editProfileImage').value.trim(),
    };

    try {
      const data = await api.updateProfile(payload);
      // Keep localStorage's cached user in sync so the navbar/name stays correct.
      Auth.saveSession(Auth.getToken(), data.user);
      form.style.display = 'none';
      renderProfileHeader(data.user, false);
      renderNavbar('profile');
    } catch (err) {
      alertBox.textContent = err.message;
      alertBox.style.display = 'block';
    }
  });
}

async function loadUserPosts(page) {
  try {
    const data = await api.getUserPosts(targetUsername, page);
    currentPage = data.pagination.page;
    totalPages = data.pagination.pages;

    if (page === 1) postsContainer.innerHTML = '';

    if (data.posts.length === 0 && page === 1) {
      postsContainer.innerHTML = renderEmptyState('No posts yet.');
      loadMoreBtn.style.display = 'none';
      return;
    }

    data.posts.forEach((post) => {
      // getUserPosts doesn't include isLiked (it's an unauthenticated-friendly
      // endpoint) - default to false; the like button still works correctly
      // on click, it just won't show a pre-filled heart until the next feed visit.
      const wrapper = document.createElement('div');
      wrapper.innerHTML = renderPostCard({ ...post, isLiked: false }, currentUser.username);
      const cardEl = wrapper.firstElementChild;
      postsContainer.appendChild(cardEl);
      attachLikeHandler(cardEl);
      attachCommentHandlers(cardEl, currentUser.username);

      const deleteBtn = cardEl.querySelector('.delete-post-btn');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
          if (!confirm('Delete this post?')) return;
          try {
            await api.deletePost(cardEl.dataset.postId);
            cardEl.remove();
          } catch (err) {
            alert(err.message || 'Could not delete post');
          }
        });
      }
    });

    loadMoreBtn.style.display = currentPage < totalPages ? 'block' : 'none';
  } catch (err) {
    postsContainer.innerHTML = renderEmptyState(`Could not load posts: ${err.message}`);
  }
}

loadMoreBtn.addEventListener('click', () => loadUserPosts(currentPage + 1));

initProfile();
