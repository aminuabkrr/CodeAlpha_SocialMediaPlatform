Auth.requireAuth();

const form = document.getElementById('createPostForm');
const contentInput = document.getElementById('postContent');
const imageUrlInput = document.getElementById('postImageUrl');
const charCount = document.getElementById('charCount');
const alertBox = document.getElementById('formAlert');
const submitBtn = document.getElementById('submitBtn');
const previewImg = document.getElementById('imagePreview');

renderNavbar('create');

contentInput.addEventListener('input', () => {
  charCount.textContent = `${contentInput.value.length} / 500`;
});

imageUrlInput.addEventListener('input', () => {
  const url = imageUrlInput.value.trim();
  if (url) {
    previewImg.src = url;
    previewImg.style.display = 'block';
    previewImg.onerror = () => { previewImg.style.display = 'none'; };
  } else {
    previewImg.style.display = 'none';
  }
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  alertBox.style.display = 'none';

  const content = contentInput.value.trim();
  if (!content) {
    alertBox.textContent = 'Post content is required.';
    alertBox.style.display = 'block';
    return;
  }

  const payload = { content };
  const imageUrl = imageUrlInput.value.trim();
  if (imageUrl) payload.imageUrl = imageUrl;

  submitBtn.disabled = true;
  submitBtn.textContent = 'Posting...';

  try {
    await api.createPost(payload);
    window.location.href = 'feed.html';
  } catch (err) {
    alertBox.textContent = err.message;
    alertBox.style.display = 'block';
    submitBtn.disabled = false;
    submitBtn.textContent = 'Post';
  }
});
