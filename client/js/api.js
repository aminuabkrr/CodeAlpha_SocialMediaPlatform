const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Core request wrapper. Automatically attaches the JWT (if present)
 * and normalizes the {success, data, message} / {success, errors} envelope.
 */
async function apiRequest(endpoint, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };

  if (auth) {
    const token = localStorage.getItem('token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    // Network failure (server down, no connection, CORS block, etc.)
    throw new ApiError('Network error - could not reach the server', 0, []);
  }

  let payload;
  try {
    payload = await response.json();
  } catch (err) {
    throw new ApiError('Unexpected server response', response.status, []);
  }

  if (!response.ok || payload.success === false) {
    throw new ApiError(payload.message || 'Request failed', response.status, payload.errors || []);
  }

  return payload.data;
}

class ApiError extends Error {
  constructor(message, status, errors) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

const api = {
  // Auth
  register: (data) => apiRequest('/auth/register', { method: 'POST', body: data, auth: false }),
  login: (data) => apiRequest('/auth/login', { method: 'POST', body: data, auth: false }),
  getMe: () => apiRequest('/auth/me'),

  // Users
  getProfile: (username) => apiRequest(`/users/${username}`, { auth: true }),
  updateProfile: (data) => apiRequest('/users/profile', { method: 'PUT', body: data }),
  getUserPosts: (username, page = 1) => apiRequest(`/users/${username}/posts?page=${page}`, { auth: false }),
  searchUsers: (q, page = 1) => apiRequest(`/users/search?q=${encodeURIComponent(q)}&page=${page}`, { auth: true }),

  // Follow
  followUser: (userId) => apiRequest(`/users/${userId}/follow`, { method: 'POST' }),
  unfollowUser: (userId) => apiRequest(`/users/${userId}/follow`, { method: 'DELETE' }),
  getFollowers: (userId) => apiRequest(`/users/${userId}/followers`, { auth: false }),
  getFollowing: (userId) => apiRequest(`/users/${userId}/following`, { auth: false }),

  // Posts
  getFeed: (page = 1) => apiRequest(`/posts/feed?page=${page}`),
  getPosts: (page = 1) => apiRequest(`/posts?page=${page}`, { auth: false }),
  getPost: (id) => apiRequest(`/posts/${id}`, { auth: false }),
  createPost: (data) => apiRequest('/posts', { method: 'POST', body: data }),
  updatePost: (id, data) => apiRequest(`/posts/${id}`, { method: 'PUT', body: data }),
  deletePost: (id) => apiRequest(`/posts/${id}`, { method: 'DELETE' }),

  // Likes
  likePost: (postId) => apiRequest(`/posts/${postId}/like`, { method: 'POST' }),
  unlikePost: (postId) => apiRequest(`/posts/${postId}/like`, { method: 'DELETE' }),

  // Comments
  getComments: (postId) => apiRequest(`/posts/${postId}/comments`, { auth: false }),
  addComment: (postId, content) => apiRequest(`/posts/${postId}/comments`, { method: 'POST', body: { content } }),
  deleteComment: (id) => apiRequest(`/comments/${id}`, { method: 'DELETE' }),
};
