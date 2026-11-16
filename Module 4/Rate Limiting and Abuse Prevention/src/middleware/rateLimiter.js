/* eslint-disable no-undef */
'use strict';


const rateLimit = require('express-rate-limit');


const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,


  // For multiple server instances, use rate-limit-redis
  // with a shared Redis store. The in-memory store keeps
  // separate counts on each instance, so a load balancer
  // could distribute requests and bypass the intended limit.
});


module.exports = limiter;