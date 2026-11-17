/* eslint-disable no-undef */
'use strict';

const { Worker } = require('bullmq');
const { connection } = require('./queue');
const { transporter } = require('./email');

const worker = new Worker(
  'email',
  async (job) => {
    if (job.name === 'otp') {
      const { email, otp } = job.data;

      await transporter.sendMail({
        to: email,
        subject: 'Your Verification OTP',
        text: `Your OTP is ${otp}. It expires in 10 minutes.`,
      });

      console.log(`OTP email sent to ${email}`);
    } else {
      throw new Error(`Unknown job type: ${job.name}`);
    }
  },
  {
    connection,
  }
);

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed: ${err.message}`);
});

module.exports = worker;