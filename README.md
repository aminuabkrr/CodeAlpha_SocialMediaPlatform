# CodeAlpha_SocialMediaPlatform

A full-stack mini social media platform built for **CodeAlpha's Full Stack Development Internship — Task 2**. Users can register, build a profile, post updates, follow other users, like and comment on posts, and browse a personalized feed — all backed by a real REST API and MongoDB database, with a framework-free HTML/CSS/JavaScript frontend.

This is the second project in the internship series, following [CodeAlpha_EcommerceStore](../CodeAlpha_EcommerceStore) (Task 1).

---

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Folder Structure](#folder-structure)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [MongoDB Setup](#mongodb-setup)
- [Running Locally](#running-locally)
- [Seeding the Database](#seeding-the-database)
- [API Endpoints](#api-endpoints)
- [Authentication](#authentication)
- [Testing](#testing)
- [Deployment](#deployment)
- [Screenshots](#screenshots)

---

## Features

- **Authentication** — register, login, JWT-based sessions, protected routes
- **User profiles** — bio, profile image, editable by the owner only
- **Posts** — create, edit, delete (author-only), with optional image URL
- **Feed** — reverse-chronological posts from the user and everyone they follow, paginated
- **Likes** — one like per user per post, enforced at the database level
- **Comments** — add, view, delete own comments
- **Follow system** — follow/unfollow, follower/following counts, no self-follow, no duplicate follows
- **Search** — find users by name or username, with live follow state
- **Security** — hashed passwords, JWT auth, server-side ownership checks on every mutating action, input validation on every endpoint

## Technology Stack

**Frontend:** HTML5, CSS3, Vanilla JavaScript (no frameworks)
**Backend:** Node.js, Express.js
**Database:** MongoDB with Mongoose
**Auth:** JSON Web Tokens (JWT), bcryptjs
**Other:** dotenv, cors, express-validator, morgan

## Architecture

A classic three-tier REST architecture:

```
Client (static HTML/CSS/JS)
        │  fetch() + Bearer token
        ▼
Express REST API
  routes → middleware (auth, validation) → controllers → Mongoose models
        │
        ▼
MongoDB (User, Post, Comment, Like, Follow collections)
```

- The API is **stateless** — every request authenticates via a JWT in the `Authorization` header, no server-side sessions.
- `Like` and `Follow` are separate collections with **compound unique indexes**, not embedded arrays, so duplicate prevention is guaranteed by the database itself, not just application logic.
- Denormalized counters (`likeCount`, `commentCount`, `followersCount`, `followingCount`) are kept in sync via MongoDB transactions on every mutating action, so a partial failure never leaves counts out of sync with the underlying relationship documents.
- All ownership checks (editing a profile, post, or deleting a comment) compare the resource's stored owner ID against the ID decoded from the requester's JWT — never an ID supplied in the request body or URL — preventing users from manipulating each other's resources.

## Folder Structure

```
CodeAlpha_SocialMediaPlatform/
├── client/
│   ├── index.html, login.html, register.html
│   ├── feed.html, profile.html, create-post.html, search.html
│   ├── css/style.css
│   └── js/
│       ├── api.js         # fetch wrapper, all API calls
│       ├── auth.js        # session state, route guards
│       ├── nav.js         # shared navbar, escaping, time formatting
│       ├── posts.js       # post card rendering
│       ├── likes.js       # like/unlike UI logic
│       ├── comments.js    # comment UI logic
│       ├── follows.js     # follow/unfollow UI logic
│       ├── feed.js, profile.js, search.js, create-post.js
├── server/
│   ├── config/db.js
│   ├── controllers/       # auth, user, post, like, comment, follow, feed, search
│   ├── middleware/        # auth (protect/optionalAuth), validate, errorHandler
│   ├── models/            # User, Post, Comment, Like, Follow
│   ├── routes/
│   ├── seed/seed.js
│   ├── utils/              # response envelope, JWT helper
│   └── server.js
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Installation

```bash
git clone <your-repo-url>
cd CodeAlpha_SocialMediaPlatform
npm install
cp .env.example .env
```

Then edit `.env` with your own MongoDB URI and JWT secret (see below).

## Environment Variables

| Variable         | Description                                   | Example                                              |
|------------------|------------------------------------------------|-------------------------------------------------------|
| `PORT`           | Port the Express server listens on            | `5000`                                                 |
| `NODE_ENV`       | Environment mode                               | `development`                                          |
| `MONGO_URI`      | MongoDB connection string                      | `mongodb://127.0.0.1:27017/codealpha_social_media`     |
| `JWT_SECRET`     | Secret used to sign JWTs — keep this private    | a long random string                                   |
| `JWT_EXPIRES_IN` | Token lifetime                                 | `7d`                                                    |
| `CLIENT_ORIGIN`  | Allowed CORS origin                            | `http://localhost:5000`                                 |

Never commit your real `.env` file — only `.env.example` is tracked in git.

## MongoDB Setup

**Local:** install MongoDB Community Edition and run it as a **replica set** (required for the multi-document transactions used in follow/like/comment counters):

```bash
mongod --replSet rs0 --dbpath /path/to/data
# then, in a mongo shell, one-time:
rs.initiate()
```

**Atlas (recommended for simplicity):** create a free cluster at mongodb.com/atlas — Atlas clusters support transactions out of the box, no extra config needed. Copy the connection string into `MONGO_URI`.

## Running Locally

```bash
npm run dev     # nodemon, auto-restarts on changes
# or
npm start       # plain node
```

The server serves both the API (`/api/*`) and the static frontend from the same port — visit `http://localhost:5000`.

## Seeding the Database

```bash
npm run seed
```

Creates 6 realistic users (all sharing the password `password123`), a follow graph, staggered posts, randomized likes, and randomized comments — see [`server/seed/README.md`](server/seed/README.md) for details. Safe to re-run at any time; it wipes and recreates all collections.

## API Endpoints

All responses follow a consistent envelope:
```json
{ "success": true, "data": {}, "message": "..." }
{ "success": false, "message": "...", "errors": [] }
```

**Auth**
| Method | Endpoint             | Auth | Description               |
|--------|-----------------------|------|----------------------------|
| POST   | `/api/auth/register`  | No   | Create an account          |
| POST   | `/api/auth/login`     | No   | Log in, receive a JWT      |
| GET    | `/api/auth/me`        | Yes  | Get the current user       |

**Users**
| Method | Endpoint                        | Auth      | Description                          |
|--------|----------------------------------|-----------|----------------------------------------|
| GET    | `/api/users/search?q=`          | Optional  | Search users by name/username         |
| PUT    | `/api/users/profile`            | Yes       | Update your own profile               |
| POST   | `/api/users/:userId/follow`     | Yes       | Follow a user                          |
| DELETE | `/api/users/:userId/follow`     | Yes       | Unfollow a user                        |
| GET    | `/api/users/:userId/followers`  | No        | List a user's followers               |
| GET    | `/api/users/:userId/following`  | No        | List who a user follows               |
| GET    | `/api/users/:username/posts`    | No        | List a user's posts (paginated)       |
| GET    | `/api/users/:username`          | Optional  | Get a user's profile                  |

**Posts**
| Method | Endpoint               | Auth | Description                        |
|--------|--------------------------|------|--------------------------------------|
| GET    | `/api/posts/feed`       | Yes  | Personalized feed (paginated)       |
| GET    | `/api/posts`            | No   | All posts (paginated)               |
| POST   | `/api/posts`            | Yes  | Create a post                       |
| GET    | `/api/posts/:id`        | No   | Get a single post                   |
| PUT    | `/api/posts/:id`        | Yes  | Edit your own post                  |
| DELETE | `/api/posts/:id`        | Yes  | Delete your own post                |

**Likes**
| Method | Endpoint                      | Auth | Description             |
|--------|---------------------------------|------|---------------------------|
| POST   | `/api/posts/:postId/like`      | Yes  | Like a post              |
| DELETE | `/api/posts/:postId/like`      | Yes  | Unlike a post             |
| GET    | `/api/posts/:postId/likes`     | No   | List who liked a post    |

**Comments**
| Method | Endpoint                          | Auth | Description               |
|--------|--------------------------------------|------|-----------------------------|
| GET    | `/api/posts/:postId/comments`       | No   | List comments (paginated)  |
| POST   | `/api/posts/:postId/comments`       | Yes  | Add a comment              |
| DELETE | `/api/comments/:id`                 | Yes  | Delete your own comment    |

## Authentication

1. Register or log in → receive a JWT.
2. Store it (the frontend uses `localStorage`).
3. Send it on every protected request: `Authorization: Bearer <token>`.
4. The server verifies the token, loads the user, and attaches it as `req.user` — no session state is kept server-side.

Passwords are hashed with bcrypt before storage and are never included in any API response (enforced both by `select: false` on the schema and a `toJSON` transform).

## Testing

No automated test suite is included by default — the project was verified through manual/curl testing at each stage of development. To add automated coverage, Jest + Supertest against the controllers is recommended, prioritizing the authorization and duplicate-prevention edge cases (editing another user's post, double-liking, self-following, etc.), which are the highest-risk areas in a social app.

## Deployment

Not yet deployed. Suggested path: host the API on Render/Railway/Fly.io with an Atlas-hosted MongoDB, set the production environment variables there, and either serve the static `client/` folder from the same Express app (as configured) or deploy it separately to a static host (Netlify/Vercel) with `CLIENT_ORIGIN` and `API_BASE_URL` updated accordingly.

**Live demo:** _(add link once deployed)_
**GitHub repository:** _(add link)_

## Screenshots

_(add screenshots of the feed, profile, and search pages here once available)_
