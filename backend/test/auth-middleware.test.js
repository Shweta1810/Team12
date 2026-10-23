import test from 'node:test';
import assert from 'node:assert/strict';
import { allowRoles } from '../src/middleware/auth.js';

function response() {
  return { code: 200, body: null, status(n) { this.code = n; return this; }, json(b) { this.body = b; return this; } };
}

test('role middleware rejects missing user', () => {
  const res = response();
  let nextCalled = false;
  allowRoles('Admin')({}, res, () => { nextCalled = true; });
  assert.equal(res.code, 401);
  assert.equal(nextCalled, false);
});

test('role middleware rejects wrong role', () => {
  const res = response();
  let nextCalled = false;
  allowRoles('Admin')({ user: { role: 'Sales Staff' } }, res, () => { nextCalled = true; });
  assert.equal(res.code, 403);
  assert.equal(nextCalled, false);
});

test('role middleware accepts an allowed role', () => {
  const res = response();
  let nextCalled = false;
  allowRoles('Admin', 'Support Staff')({ user: { role: 'Support Staff' } }, res, () => { nextCalled = true; });
  assert.equal(nextCalled, true);
});
