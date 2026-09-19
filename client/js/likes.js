/**
 * Wires up the like button inside a single post card element.
 * Optimistic UI: flips instantly, rolls back on API failure.
 */
function attachLikeHandler(cardEl) {
  const postId = cardEl.dataset.postId;
  const likeBtn = cardEl.querySelector('.like-btn');

  likeBtn.addEventListener('click', async () => {
    const wasLiked = likeBtn.dataset.liked === 'true';
    const countEl = likeBtn.querySelector('.like-count');
    const iconEl = likeBtn.querySelector('.like-icon');
    const currentCount = parseInt(countEl.textContent, 10);

    // Optimistic update
    likeBtn.dataset.liked = String(!wasLiked);
    likeBtn.classList.toggle('liked', !wasLiked);
    iconEl.textContent = !wasLiked ? '♥' : '♡';
    countEl.textContent = wasLiked ? currentCount - 1 : currentCount + 1;
    likeBtn.disabled = true;

    try {
      if (wasLiked) {
        await api.unlikePost(postId);
      } else {
        await api.likePost(postId);
      }
    } catch (err) {
      // Roll back on failure (e.g. 409 from a race, or network error)
      likeBtn.dataset.liked = String(wasLiked);
      likeBtn.classList.toggle('liked', wasLiked);
      iconEl.textContent = wasLiked ? '♥' : '♡';
      countEl.textContent = currentCount;
      alert(err.message || 'Could not update like');
    } finally {
      likeBtn.disabled = false;
    }
  });
}
