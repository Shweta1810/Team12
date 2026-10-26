import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

process.env.JWT_SECRET ||= 'integration-test-secret-that-is-not-used-in-production';
const { default: app } = await import('../src/app.js');
const { default: User } = await import('../src/models/User.js');
const { default: Customer } = await import('../src/models/Customer.js');
const { default: Feedback } = await import('../src/models/Feedback.js');
const { default: RetentionActivity } = await import('../src/models/RetentionActivity.js');
const { default: AuditLog } = await import('../src/models/AuditLog.js');

test('feedback and retention APIs validate input, persist records, and enforce ownership', {
  skip: !process.env.TEST_MONGODB_URI
}, async (t) => {
  const uri = process.env.TEST_MONGODB_URI;
  const dbName = decodeURIComponent(new URL(uri).pathname.slice(1));
  assert.match(dbName, /^team12_crm_auth_test_[a-z0-9_-]+$/i,
    'TEST_MONGODB_URI must target a dedicated test database');

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  await Promise.all([User.init(), Customer.init(), Feedback.init(), RetentionActivity.init(), AuditLog.init()]);
  const server = await new Promise((resolve) => {
    const listeningServer = app.listen(0, () => resolve(listeningServer));
  });
  t.after(async () => {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await Promise.all([
      User.deleteMany({}), Customer.deleteMany({}), Feedback.deleteMany({}),
      RetentionActivity.deleteMany({}), AuditLog.deleteMany({})
    ]);
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
      method: 'POST', body: { email, password: 'Integration-pass-123' }
    });
    assert.equal(response.status, 200);
    return (await response.json()).token;
  };

  await addUser('eng-admin@test.example', 'Admin');
  const sales = await addUser('eng-sales@test.example', 'Sales Staff');
  const otherStaff = await addUser('eng-support@test.example', 'Support Staff');
  const adminToken = await signIn('eng-admin@test.example');
  const salesToken = await signIn('eng-sales@test.example');
  const otherToken = await signIn('eng-support@test.example');
  const customer = await Customer.create({
    name: 'Engagement Test Customer', email: 'customer-engagement@test.example',
    assignedTo: sales._id, status: 'Active'
  });

  assert.equal((await request('/api/customers')).status, 401);
  const customerList = await request('/api/customers', { token: salesToken });
  assert.equal(customerList.status, 200);
  assert.equal((await customerList.json()).customers.length, 1);

  const invalidFeedback = await request('/api/feedback', {
    method: 'POST', token: salesToken,
    body: { customer: customer._id.toString(), type: 'Not a type', subject: '', description: 'test' }
  });
  assert.equal(invalidFeedback.status, 400);

  const createdFeedbackResponse = await request('/api/feedback', {
    method: 'POST', token: salesToken,
    body: { customer: customer._id.toString(), type: 'Complaint', subject: 'Delivery delay', description: 'Package arrived late', priority: 'High' }
  });
  assert.equal(createdFeedbackResponse.status, 201);
  const createdFeedback = (await createdFeedbackResponse.json()).feedback;
  assert.equal(createdFeedback.status, 'Open');
  assert.equal(createdFeedback.customer.name, 'Engagement Test Customer');

  const invalidFeedbackStatus = await request(`/api/feedback/${createdFeedback._id}/status`, {
    method: 'PUT', token: salesToken, body: { status: 'Unknown' }
  });
  assert.equal(invalidFeedbackStatus.status, 400);
  const updatedFeedbackResponse = await request(`/api/feedback/${createdFeedback._id}/status`, {
    method: 'PUT', token: salesToken, body: { status: 'Resolved' }
  });
  assert.equal(updatedFeedbackResponse.status, 200);
  assert.equal((await updatedFeedbackResponse.json()).feedback.status, 'Resolved');
  assert.equal((await request(`/api/feedback/${createdFeedback._id}/status`, {
    method: 'PUT', token: otherToken, body: { status: 'Closed' }
  })).status, 404);

  const invalidRetention = await request('/api/retention', {
    method: 'POST', token: salesToken,
    body: { customer: customer._id.toString(), type: 'Unsupported', description: 'check-in' }
  });
  assert.equal(invalidRetention.status, 400);

  const createdActivityResponse = await request('/api/retention', {
    method: 'POST', token: salesToken,
    body: { customer: customer._id.toString(), type: 'Check-in', description: 'Discuss renewal', date: '2026-10-26T10:00:00.000Z' }
  });
  assert.equal(createdActivityResponse.status, 201);
  const createdActivity = (await createdActivityResponse.json()).activity;
  assert.equal(createdActivity.status, 'Planned');
  const updatedActivityResponse = await request(`/api/retention/${createdActivity._id}/status`, {
    method: 'PUT', token: salesToken, body: { status: 'Completed' }
  });
  assert.equal(updatedActivityResponse.status, 200);
  assert.equal((await updatedActivityResponse.json()).activity.status, 'Completed');
  assert.equal((await request(`/api/retention/${createdActivity._id}/status`, {
    method: 'PUT', token: otherToken, body: { status: 'Cancelled' }
  })).status, 404);

  const adminFeedback = await request('/api/feedback', { token: adminToken });
  assert.equal(adminFeedback.status, 200);
  assert.equal((await adminFeedback.json()).count, 1);
  const otherStaffActivities = await request('/api/retention', { token: otherToken });
  assert.equal(otherStaffActivities.status, 200);
  assert.equal((await otherStaffActivities.json()).count, 0);
  assert.ok(await User.findById(otherStaff._id));
});
