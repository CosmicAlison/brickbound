import test from 'node:test';
import assert from 'node:assert/strict';
import { computeCanvasResolution } from '../src/render-scale.js';

test('mobile 3x density creates sharp backing store', () => {
  const r = computeCanvasResolution({cssWidth: 350,cssHeight: 350*610/420,devicePixelRatio:3});
  assert.equal(r.width,1050);
  assert.equal(r.height,1525);
  assert.equal(r.scaleX,2.5);
});

test('desktop 1x density does not waste pixels', () => {
  const r = computeCanvasResolution({cssWidth:420,cssHeight:610,devicePixelRatio:1});
  assert.deepEqual([r.width,r.height],[420,610]);
});

test('backing store is capped on extreme screens', () => {
  const r = computeCanvasResolution({cssWidth:2000,cssHeight:3000,devicePixelRatio:8});
  assert.ok(r.width*r.height<=4096*1024);
  assert.ok(r.scaleX>0&&r.scaleY>0);
});
