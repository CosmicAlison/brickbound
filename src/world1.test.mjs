import test from 'node:test';
import assert from 'node:assert/strict';
import { WORLD_ONE, bossPhase } from './world1.js';

test('all ten World 1 stages have authored, bounded, unique block layouts', () => {
  assert.equal(Object.keys(WORLD_ONE).length, 10);
  for (const [stage, entry] of Object.entries(WORLD_ONE)) {
    assert.ok(entry.blocks.length >= 3 && entry.blocks.length <= 14, `stage ${stage}`);
    assert.ok(entry.enemyHp > 0);
    const coordinates = new Set();
    for (const [c, r, kind, hp] of entry.blocks) {
      assert.ok(c >= 0 && c <= 5 && r >= 0 && r <= 4);
      assert.ok(hp > 0 && kind);
      const coord = `${c},${r}`;
      assert.ok(!coordinates.has(coord), `${stage}: duplicate ${coord}`);
      coordinates.add(coord);
    }
  }
});

test('Rootheart has four destructible root anchors', () => {
  assert.equal(WORLD_ONE[10].blocks.filter((b) => b[2] === 'root').length, 4);
});

test('boss phases respond to health thresholds', () => {
  assert.equal(bossPhase(1), 1);
  assert.equal(bossPhase(.7), 2);
  assert.equal(bossPhase(.35), 3);
});