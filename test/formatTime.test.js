const assert = require('assert');
const { formatTime } = require('../timeFormat');

assert.strictEqual(formatTime(0), '00:00');
assert.strictEqual(formatTime(5), '00:05');
assert.strictEqual(formatTime(65), '01:05');
assert.strictEqual(formatTime(600), '10:00');
assert.strictEqual(formatTime(3600), '60:00');

console.log('All formatTime tests passed.');
