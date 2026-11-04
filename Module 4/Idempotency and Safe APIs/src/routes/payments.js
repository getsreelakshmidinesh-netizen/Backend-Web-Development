/* eslint-disable no-undef */
'use strict';
const router = require('express').Router();
const { charges, idempotency, nextChargeId } = require('../store');
router.post('/', (req, res) => {
const key = req.headers['idempotency-key'];
// Rule 1: missing key
if (!key) {
return res.status(400).json({
error: {
code: 'IDEMPOTENCY_KEY_REQUIRED',
message: 'Idempotency-Key header is required'
}
});
}
// Rule 2: repeat key -> replay stored response
if (idempotency.has(key)) {
const stored = idempotency.get(key);
return res.status(stored.status).json(stored.body);
}
// Rule 3: new key -> charge once, store, return
const amount = req.body && req.body.amount;
const charge = { id: nextChargeId(), amount, status: 'succeeded' };
charges.push(charge);
const body = { id: charge.id, amount: charge.amount, status: charge.status };
idempotency.set(key, { status: 201, body });
return res.status(201).json(body);
});
module.exports = router;