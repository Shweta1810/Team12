import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

process.env.JWT_SECRET ||= 'integration-test-secret-that-is-not-used-in-production';
const { default: app } = await import('../src/app.js');
const { default: User } = await import('../src/models/User.js');
const { default: AuditLog } = await import('../src/models/AuditLog.js');

test('authentication and account-management API integration', {
  skip: !process.env.TEST_MONGODB_URI
}, async (t) => {
  const uri = process.env.TEST_MONGODB_URI;
  const dbName = decodeURIComponent(new URL(uri).pathname.slice(1));
  assert.match(dbName, /^team12_crm_auth_test_[a-z0-9_-]+$/i, 'TEST_MONGODB_URI must target a dedicated test database');

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  await Promise.all([User.init(), AuditLog.init()]);
  const server = await new Promise((resolve) => {
    const listeningServer = app.listen(0, () => resolve(listeningServer));
  });
  t.after(async () => {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await User.deleteMany({});
    await AuditLog.deleteMany({});
    await mongoose.disconnect();
  });

  const base = `http://127.0.0.1:${server.address().port}`;
  const request = (path, { method = 'GET', token, body } = {}) => fetch(`${base}${path}`, {
    method,
    headers: {
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });
  const addUser = async (email, role) => User.create({
    name: role,
    email,
    passwordHash: await bcrypt.hash('Integration-pass-123', 12),
    role
  });
  const signIn = async (email) => {
    const response = await request('/api/auth/login', {
      method: 'POST',
      body: { email, password: 'Integration-pass-123' }
    });
    assert.equal(response.status, 200);
    return (await response.json()).token;
  };

  const admin = await addUser('admin@test.example', 'Admin');
  const sales = await addUser('sales@test.example', 'Sales Staff');
  const support = await addUser('support@test.example', 'Support Staff');
  const adminToken = await signIn(admin.email);
  const salesToken = await signIn(sales.email);
  const supportToken = await signIn(support.email);

  const health = await request('/api/health');
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), { status: 'ok', database: 'connected' });
  assert.equal(health.headers.get('x-powered-by'), null);
  assert.equal(health.headers.get('x-content-type-options'), 'nosniff');
  const disallowedOrigin = await fetch(`${base}/api/health`, { headers: { Origin: 'https://untrusted.example' } });
  assert.notEqual(disallowedOrigin.headers.get('access-control-allow-origin'), 'https://untrusted.example');

  const missingFields = await request('/api/auth/login', { method: 'POST', body: { email: '', password: '' } });
  assert.equal(missingFields.status, 400);
  const wrongPassword = await request('/api/auth/login', {
    method: 'POST',
    body: { email: admin.email, password: 'incorrect' }
  });
  assert.equal(wrongPassword.status, 401);
  assert.equal((await wrongPassword.json()).message, 'Invalid email or password');
  const unknownAccount = await request('/api/auth/login', {
    method: 'POST',
    body: { email: 'missing@test.example', password: 'incorrect' }
  });
  assert.equal(unknownAccount.status, 401);
  assert.equal((await unknownAccount.json()).message, 'Invalid email or password');
  const malformedJson = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{invalid'
  });
  assert.equal(malformedJson.status, 400);

  const storedAdmin = await User.findById(admin._id).select('+passwordHash');
  assert.notEqual(storedAdmin.passwordHash, 'Integration-pass-123');
  assert.equal(await bcrypt.compare('Integration-pass-123', storedAdmin.passwordHash), true);

  const currentUser = await request('/api/auth/me', { token: salesToken });
  assert.equal(currentUser.status, 200);
  assert.equal((await currentUser.json()).user.role, 'Sales Staff');
  assert.equal((await request('/api/auth/me')).status, 401);
  const forgedToken = jwt.sign({ sub: admin._id.toString(), ver: 0 }, 'wrong-secret', { issuer: 'team12-crm' });
  assert.equal((await request('/api/auth/me', { token: forgedToken })).status, 401);
  const expiredToken = jwt.sign({ sub: admin._id.toString(), ver: 0 }, process.env.JWT_SECRET, {
    issuer: 'team12-crm',
    expiresIn: -1
  });
  assert.equal((await request('/api/auth/me', { token: expiredToken })).status, 401);
  const invalidSubjectToken = jwt.sign({ sub: 'not-an-object-id', ver: 0 }, process.env.JWT_SECRET, {
    issuer: 'team12-crm'
  });
  assert.equal((await request('/api/auth/me', { token: invalidSubjectToken })).status, 401);

  assert.equal((await request('/api/users', { token: salesToken })).status, 403);
  assert.equal((await request('/api/users', { token: supportToken })).status, 403);
  const userList = await request('/api/users', { token: adminToken });
  assert.equal(userList.status, 200);
  const listedUsers = (await userList.json()).users;
  assert.ok(listedUsers.every((user) => user.id && !('_id' in user) && !('passwordHash' in user)));

  const shortPassword = await request('/api/users', {
    method: 'POST',
    token: adminToken,
    body: { name: 'New Staff', email: 'new@test.example', password: 'short', role: 'Sales Staff' }
  });
  assert.equal(shortPassword.status, 400);
  const bcryptOverflowPassword = await request('/api/users', {
    method: 'POST',
    token: adminToken,
    body: { name: 'New Staff', email: 'new@test.example', password: 'x'.repeat(73), role: 'Sales Staff' }
  });
  assert.equal(bcryptOverflowPassword.status, 400);
  const invalidRole = await request('/api/users', {
    method: 'POST',
    token: adminToken,
    body: { name: 'New Staff', email: 'new@test.example', password: 'Valid-password-123', role: 'Owner' }
  });
  assert.equal(invalidRole.status, 400);
  const created = await request('/api/users', {
    method: 'POST',
    token: adminToken,
    body: { name: 'New Staff', email: 'new@test.example', password: 'Valid-password-123', role: 'Sales Staff' }
  });
  assert.equal(created.status, 201);
  const createdUser = (await created.json()).user;
  assert.ok(createdUser.id);
  assert.equal((await User.findById(createdUser.id).select('+passwordHash')).passwordHash === 'Valid-password-123', false);
  assert.equal((await request('/api/users', {
    method: 'POST',
    token: adminToken,
    body: { name: 'Duplicate', email: 'new@test.example', password: 'Valid-password-123', role: 'Sales Staff' }
  })).status, 409);

  assert.equal((await request(`/api/users/${admin.id}`, {
    method: 'PATCH',
    token: adminToken,
    body: { role: 'Sales Staff' }
  })).status, 400);
  assert.equal((await request(`/api/users/${sales.id}`, {
    method: 'PATCH',
    token: adminToken,
    body: { role: 'Owner' }
  })).status, 400);
  assert.equal((await request(`/api/users/${sales.id}`, {
    method: 'PATCH',
    token: adminToken,
    body: { passwordHash: 'attacker-controlled' }
  })).status, 400);
  assert.equal((await request(`/api/users/${sales.id}`, {
    method: 'PATCH',
    token: salesToken,
    body: { role: 'Admin' }
  })).status, 403);

  const updated = await request(`/api/users/${sales.id}`, {
    method: 'PATCH',
    token: adminToken,
    body: { role: 'Support Staff' }
  });
  assert.equal(updated.status, 200);
  assert.equal((await updated.json()).user.role, 'Support Staff');
  assert.equal((await request('/api/auth/me', { token: salesToken })).status, 401);

  const reactivatedToken = await signIn(sales.email);
  assert.equal((await request(`/api/users/${sales.id}`, {
    method: 'PATCH',
    token: adminToken,
    body: { isActive: false }
  })).status, 200);
  assert.equal((await request('/api/auth/me', { token: reactivatedToken })).status, 401);
  const inactiveLogin = await request('/api/auth/login', {
    method: 'POST',
    body: { email: sales.email, password: 'Integration-pass-123' }
  });
  assert.equal(inactiveLogin.status, 401);
  assert.equal((await inactiveLogin.json()).message, 'Invalid email or password');
  assert.equal((await request(`/api/users/${sales.id}`, {
    method: 'PATCH',
    token: adminToken,
    body: { isActive: true }
  })).status, 200);
  assert.equal((await request('/api/auth/login', {
    method: 'POST',
    body: { email: sales.email, password: 'Integration-pass-123' }
  })).status, 200);

  assert.equal((await request(`/api/users/${admin.id}`, {
    method: 'PATCH',
    token: adminToken,
    body: { isActive: false }
  })).status, 400);
  const logout = await request('/api/auth/logout', { method: 'POST', token: adminToken });
  assert.equal(logout.status, 200);
  assert.equal((await request('/api/auth/me', { token: adminToken })).status, 401);
});
