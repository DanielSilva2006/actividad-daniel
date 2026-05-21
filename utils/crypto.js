const crypto = require('crypto');

/**
 * Encrypts a password using Node's native PBKDF2 cryptographic function.
 * Returns a string formatted as "salt:iterations:hash" for storage.
 * @param {string} password 
 * @returns {string}
 */
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const iterations = 10000;
  const keylen = 64;
  const digest = 'sha512';
  
  const hash = crypto.pbkdf2Sync(password, salt, iterations, keylen, digest).toString('hex');
  return `${salt}:${iterations}:${hash}`;
}

/**
 * Verifies a plain text password against a stored hashed password string.
 * @param {string} password 
 * @param {string} storedHash 
 * @returns {boolean}
 */
function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(':')) {
    return false;
  }
  
  const [salt, iterationsStr, hash] = storedHash.split(':');
  const iterations = parseInt(iterationsStr, 10);
  const keylen = 64;
  const digest = 'sha512';
  
  const verifyHash = crypto.pbkdf2Sync(password, salt, iterations, keylen, digest).toString('hex');
  return hash === verifyHash;
}

module.exports = {
  hashPassword,
  verifyPassword
};
