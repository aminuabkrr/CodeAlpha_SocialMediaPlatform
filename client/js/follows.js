/**
 * Wires up a follow/unfollow button. Used on profile pages and
 * (in Stage 13) inside search results.
 */
function attachFollowHandler(btnEl, userId, onChange) {
  btnEl.addEventListener('click', async () => {
    const isFollowing = btnEl.dataset.following === 'true';
    btnEl.disabled = true;

    try {
      if (isFollowing) {
        await api.unfollowUser(userId);
        btnEl.dataset.following = 'false';
        btnEl.textContent = 'Follow';
        btnEl.classList.remove('btn-secondary');
        btnEl.classList.add('btn-primary');
      } else {
        await api.followUser(userId);
        btnEl.dataset.following = 'true';
        btnEl.textContent = 'Following';
        btnEl.classList.remove('btn-primary');
        btnEl.classList.add('btn-secondary');
      }
      if (onChange) onChange(btnEl.dataset.following === 'true');
    } catch (err) {
      alert(err.message || 'Could not update follow status');
    } finally {
      btnEl.disabled = false;
    }
  });
}

function renderFollowButton(userId, isFollowing) {
  return `
    <button
      class="btn ${isFollowing ? 'btn-secondary' : 'btn-primary'} follow-btn"
      data-following="${!!isFollowing}"
      data-user-id="${userId}"
    >${isFollowing ? 'Following' : 'Follow'}</button>
  `;
}
