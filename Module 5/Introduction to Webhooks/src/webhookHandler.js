/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
'use strict';

const crypto = require('node:crypto');
const { handleEvent } = require('./eventHandlers');

// Store processed event IDs
const _processedIds = new Set();

async function handleWebhook(req, res) {
  // STEP 1: Verify HMAC-SHA256 signature
  const signature = req.headers['x-webhook-signature'];

  if (!signature || !signature.startsWith('sha256=')) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const received = signature.slice(7);

  const expected = crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET)
    .update(req.body)
    .digest('hex');

  // Validate signature format and length before comparison
  if (!/^[0-9a-f]{64}$/i.test(received)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const expectedBuffer = Buffer.from(expected, 'hex');
  const receivedBuffer = Buffer.from(received, 'hex');

  const isValid = crypto.timingSafeEqual(
    expectedBuffer,
    receivedBuffer
  );

  if (!isValid) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // STEP 2: Parse request body
  let event;

  try {
    event = JSON.parse(req.body);
  } catch (error) {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  // STEP 3: Check idempotency
  if (_processedIds.has(event.id)) {
    return res.status(200).json({
      status: 'already_processed'
    });
  }

  // STEP 4: Mark event as processed
  _processedIds.add(event.id);

  // STEP 5: Acknowledge immediately
  res.status(200).json({
    status: 'received'
  });

  // Process event after sending the response
  setImmediate(async () => {
    try {
      await handleEvent(event);
    } catch (error) {
      console.error('Webhook processing failed:', error);
    }
  });
}

module.exports = {
  handleWebhook,
  _processedIds
};