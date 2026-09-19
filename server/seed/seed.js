require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Like = require('../models/Like');
const Follow = require('../models/Follow');

const SEED_PASSWORD = 'password123'; // same for every seeded user, printed at the end for convenience

const seedUsers = [
  {
    name: 'Ada Lovelace',
    username: 'ada',
    email: 'ada@example.com',
    bio: 'Mathematician. Wrote the first algorithm intended for a machine.',
  },
  {
    name: 'Grace Hopper',
    username: 'grace',
    email: 'grace@example.com',
    bio: 'Rear Admiral. Compilers, COBOL, and finding actual bugs.',
  },
  {
    name: 'Alan Turing',
    username: 'alan',
    email: 'alan@example.com',
    bio: 'Codebreaker and computer science pioneer.',
  },
  {
    name: 'Margaret Hamilton',
    username: 'margaret',
    email: 'margaret@example.com',
    bio: 'Led the software team for the Apollo missions.',
  },
  {
    name: 'Katherine Johnson',
    username: 'katherine',
    email: 'katherine@example.com',
    bio: 'NASA mathematician. Orbital mechanics by hand, then by code.',
  },
  {
    name: 'Dennis Ritchie',
    username: 'dennis',
    email: 'dennis@example.com',
    bio: 'Co-created C and Unix.',
  },
];

const samplePosts = [
  'Just pushed a refactor that cut our build time in half. Small wins add up.',
  "Reading through an old notebook of mine today - it's wild how much has changed.",
  'Hot take: the best documentation is the code you didn\'t have to write.',
  'Spent the afternoon debugging something that turned out to be a typo. Every time.',
  'Coffee, terminal, silence. Perfect morning.',
  'Shipped a small feature today that I think people are actually going to like.',
  'Anyone else find the best ideas show up right as you\'re falling asleep?',
  "Rewrote the same function three times before landing on something I'm happy with.",
  'Mentoring session today reminded me how much I still have to learn too.',
  'Finally closed that ticket that had been open for three weeks. Feels good.',
];

const sampleComments = [
  'This is great, thanks for sharing!',
  'Couldn\'t agree more.',
  'Ha, this happens to me constantly.',
  'Great point - hadn\'t thought about it that way.',
  'Saving this for later.',
  'So true.',
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    // Wipe existing data for a clean, repeatable seed.
    await Promise.all([
      User.deleteMany({}),
      Post.deleteMany({}),
      Comment.deleteMany({}),
      Like.deleteMany({}),
      Follow.deleteMany({}),
    ]);
    console.log('Cleared existing collections.');

    // --- Users ---
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(SEED_PASSWORD, salt);

    const createdUsers = await User.insertMany(
      seedUsers.map((u) => ({ ...u, passwordHash }))
    );
    console.log(`Created ${createdUsers.length} users.`);

    // --- Follows (a realistic-ish social graph, not everyone follows everyone) ---
    const follows = [];
    const followMap = {
      ada: ['grace', 'alan', 'margaret'],
      grace: ['ada', 'dennis'],
      alan: ['ada', 'katherine', 'margaret', 'dennis'],
      margaret: ['katherine', 'grace'],
      katherine: ['ada', 'alan', 'dennis'],
      dennis: ['alan'],
    };

    const userByUsername = Object.fromEntries(createdUsers.map((u) => [u.username, u]));

    for (const [followerUsername, followingUsernames] of Object.entries(followMap)) {
      for (const followingUsername of followingUsernames) {
        follows.push({
          follower: userByUsername[followerUsername]._id,
          following: userByUsername[followingUsername]._id,
        });
      }
    }

    await Follow.insertMany(follows);

    // Update denormalized follower/following counts to match.
    for (const user of createdUsers) {
      const followingCount = follows.filter((f) => String(f.follower) === String(user._id)).length;
      const followersCount = follows.filter((f) => String(f.following) === String(user._id)).length;
      await User.findByIdAndUpdate(user._id, { followingCount, followersCount });
    }
    console.log(`Created ${follows.length} follow relationships.`);

    // --- Posts (2-3 per user, staggered creation times so the feed has real order) ---
    const posts = [];
    let postIndex = 0;
    const now = Date.now();

    for (const user of createdUsers) {
      const postsForThisUser = 2 + (postIndex % 2); // alternate between 2 and 3 posts
      for (let i = 0; i < postsForThisUser; i++) {
        const content = samplePosts[postIndex % samplePosts.length];
        const hoursAgo = postIndex * 3; // spread posts across time so createdAt ordering is meaningful
        posts.push({
          author: user._id,
          content,
          createdAt: new Date(now - hoursAgo * 60 * 60 * 1000),
        });
        postIndex++;
      }
    }

    const createdPosts = await Post.insertMany(posts);
    console.log(`Created ${createdPosts.length} posts.`);

    // --- Likes (each user likes a handful of random posts, no self-likes required but allowed) ---
    const likes = [];
    const likeCountByPost = {};

    for (const user of createdUsers) {
      const numLikes = 3 + Math.floor(Math.random() * 4); // 3-6 likes per user
      const shuffled = [...createdPosts].sort(() => 0.5 - Math.random());
      const postsToLike = shuffled.slice(0, numLikes);

      for (const post of postsToLike) {
        const key = `${user._id}-${post._id}`;
        likes.push({ user: user._id, post: post._id });
        likeCountByPost[post._id] = (likeCountByPost[post._id] || 0) + 1;
      }
    }

    // De-duplicate in the unlikely event the shuffle produced overlaps across iterations
    // (it can't within one user's own slice, but guard anyway before insertMany).
    const uniqueLikes = [];
    const seenLikeKeys = new Set();
    for (const like of likes) {
      const key = `${like.user}-${like.post}`;
      if (!seenLikeKeys.has(key)) {
        seenLikeKeys.add(key);
        uniqueLikes.push(like);
      }
    }

    await Like.insertMany(uniqueLikes);

    for (const [postId, count] of Object.entries(likeCountByPost)) {
      await Post.findByIdAndUpdate(postId, { likeCount: count });
    }
    console.log(`Created ${uniqueLikes.length} likes.`);

    // --- Comments (1-3 random comments per post from random users) ---
    const comments = [];
    const commentCountByPost = {};

    for (const post of createdPosts) {
      const numComments = Math.floor(Math.random() * 3); // 0-2 comments
      for (let i = 0; i < numComments; i++) {
        const randomUser = createdUsers[Math.floor(Math.random() * createdUsers.length)];
        const content = sampleComments[Math.floor(Math.random() * sampleComments.length)];
        comments.push({
          post: post._id,
          author: randomUser._id,
          content,
        });
        commentCountByPost[post._id] = (commentCountByPost[post._id] || 0) + 1;
      }
    }

    await Comment.insertMany(comments);

    for (const [postId, count] of Object.entries(commentCountByPost)) {
      await Post.findByIdAndUpdate(postId, { commentCount: count });
    }
    console.log(`Created ${comments.length} comments.`);

    console.log('\nSeed complete!');
    console.log(`All seeded users share the password: ${SEED_PASSWORD}`);
    console.log('Usernames:', createdUsers.map((u) => u.username).join(', '));

    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seed();
