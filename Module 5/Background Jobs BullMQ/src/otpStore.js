/* eslint-disable no-undef */

const crypto = require('crypto');


const store = new Map();
const verified = new Set();


function generateOTP() {
  return String(crypto.randomInt(100000, 1000000)); // always 6 digits
}


function storeOTP(email, otp) {
  store.set(email, {
    otp,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    attempts: 0,
  });
}


function verifyOTP(email, code) {
  const entry = store.get(email);


  if (!entry) return { ok: false, reason: 'not_found' };                       // 401
  if (Date.now() > entry.expiresAt) return { ok: false, reason: 'expired' };   // 410
  if (entry.attempts >= 3) return { ok: false, reason: 'too_many_attempts' };  // 429


  if (entry.otp !== code) {
    entry.attempts += 1;
    return { ok: false, reason: 'wrong_code' };                                // 401
  }


  store.delete(email); // single-use
  return { ok: true };
}


function markVerified(email) {
  verified.add(email);
}


module.exports = { generateOTP, storeOTP, verifyOTP, markVerified, _store: store };