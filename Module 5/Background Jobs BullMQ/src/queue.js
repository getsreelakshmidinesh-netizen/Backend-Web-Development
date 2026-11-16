/* eslint-disable no-undef */
//queue.js


require('dotenv').config();
const { Queue } = require('bullmq');


const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
};


const emailQueue = new Queue('email', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
  },
});


module.exports = { emailQueue, connection };