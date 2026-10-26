const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../db/prisma');

const router = express.Router();

router.post('/register', async (req, res, next) => {
  const { name, email, password } = req.body || {};
  const normalizedName = typeof name === 'string' ? name.trim() : '';
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

  if (
    !normalizedName ||
    normalizedName.length > 100 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) ||
    normalizedEmail.length > 254 ||
    typeof password !== 'string' ||
    password.length === 0
  ) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Name, a valid email, and password are required' }
    });
  }

  try {
    const passwordHash = await bcrypt.hash(password, Number(process.env.BCRYPT_COST || 12));
    const user = await prisma.user.create({
      data: { name: normalizedName, email: normalizedEmail, passwordHash },
      select: { id: true, name: true, email: true, createdAt: true }
    });

    return res.status(201).json({ user });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: { code: 'EMAIL_ALREADY_EXISTS', message: 'An account with this email already exists' }
      });
    }
    return next(error);
  }
});

router.post('/login', async (req, res, next) => {
  const { email, password } = req.body || {};
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

  if (!normalizedEmail || typeof password !== 'string' || password.length === 0) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Email and password are required' }
    });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    const passwordMatches = user ? await bcrypt.compare(password, user.passwordHash) : false;

    if (!passwordMatches) {
      return res.status(401).json({
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
      });
    }

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt
    };
    return res.status(200).json({ user: safeUser });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
