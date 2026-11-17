/* eslint-disable no-undef */
'use strict';

const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  lazyConnect: true
});

async function cacheGet(key) {
  try {
    const value = await redis.get(key);

    if (value === null) {
      return null;
    }

    return JSON.parse(value);

  } catch (error) {
    console.error('Cache Get Error:', error);
    return null;
  }
}

async function cacheSet(key, data, ttlSeconds) {
  try {
    await redis.set(
      key,
      JSON.stringify(data),
      'EX',
      ttlSeconds
    );

  } catch (error) {
    console.error('Cache Set Error:', error);
  }
}

async function cacheDel(key) {
  try {
    await redis.del(key);

  } catch (error) {
    console.error('Cache Delete Error:', error);
  }
}

module.exports = { cacheGet, cacheSet, cacheDel };