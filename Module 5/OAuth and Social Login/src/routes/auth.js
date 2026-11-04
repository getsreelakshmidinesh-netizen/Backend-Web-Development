'use strict';

// routes/auth.js — OAuth entry points

const router = require('express').Router();

const { passport } = require('../auth/passport');
const { signToken } = require('../utils/jwt');

// Route 1 — GET /auth/google
// Triggers the Google OAuth flow.
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['openid', 'email', 'profile'],
    session: false,
  }),
);

// Route 2 — GET /auth/google/callback
// Handles Google's response and returns your app's JWT.
router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: '/auth/failure',
  }),
  (req, res) => {
    const token = signToken({
      sub: req.user.id,
      role: req.user.role,
    });

    res.json({ token });
  },
);

// Route 3 — GET /auth/failure
// Shown when Google authentication fails.
router.get('/failure', (_req, res) => {
  res.status(401).json({
    error: {
      code: 'OAUTH_FAILED',
      message: 'Google login failed or was denied',
    },
  });
});

module.exports = router;