import test from 'node:test';
import assert from 'node:assert/strict';
import { isRoomCleared } from './combat-rules.js';

test('defeating enemies alone never ends a room with bricks remaining', () => {
  assert.equal(isRoomCleared([], [{hp:2}]), false);
});
test('breaking bricks alone never ends a room with enemies remaining', () => {
  assert.equal(isRoomCleared([{hp:1}], []), false);
});
test('last enemy and last brick must both be removed', () => {
  assert.equal(isRoomCleared([], []), true);
});
test('splash-destroyed bricks with nonpositive HP do not block clear', () => {
  assert.equal(isRoomCleared([], [{hp:0},{hp:-1}]), true);
});
