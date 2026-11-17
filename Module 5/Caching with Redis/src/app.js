/* eslint-disable no-undef */
'use strict';

// Load environment variables
require('dotenv').config();

const express = require('express');
const db = require('./db');

// Import Redis cache functions
const { cacheGet, cacheSet, cacheDel } = require('./cache');

const app = express();
app.use(express.json());

const FEED_KEY = 'feed:trending';
const FEED_TTL = 60; // seconds

// Health check route
app.get('/health', (req, res) => res.json({ ok: true }));

// GET /feed - Cache-aside pattern
app.get('/feed', async (req, res) => {
  try {
    const t0 = Date.now();

    // 1. Check Redis cache
    const cached = await cacheGet(FEED_KEY);

    // 2. Cache HIT
    if (cached !== null) {
      const ms = Date.now() - t0;

      console.log(`[feed] HIT ${ms}ms`);

      return res
        .set('X-Cache', 'HIT')
        .json(cached);
    }

    // 3. Cache MISS - Query database
    const posts = await db.getTrendingPosts();

    // 4. Store data in Redis for 60 seconds
    await cacheSet(FEED_KEY, posts, FEED_TTL);

    const ms = Date.now() - t0;

    console.log(`[feed] MISS ${ms}ms`);

    // 5. Return database data
    return res
      .set('X-Cache', 'MISS')
      .json(posts);

  } catch (err) {
    console.error('[feed] error:', err);

    return res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// POST /posts - Create post and invalidate cache
app.post('/posts', async (req, res) => {
  try {
    const post = await db.createPost(req.body);

    // Delete stale cached feed
    await cacheDel(FEED_KEY);

    return res.status(201).json(post);

  } catch (err) {
    console.error('[posts] error:', err);

    return res.status(500).json({
      error: 'Internal server error'
    });
  }
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server on http://localhost:${PORT}`);
  });
}

module.exports = { app };