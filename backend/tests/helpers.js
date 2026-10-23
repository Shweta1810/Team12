/*
 * Shared helpers for the Epic 2 (Lead & Customer Management) tests.
 *
 * The tests run against a real MongoDB database. By default they use
 * mongodb://127.0.0.1:27017/crm_test; set MONGO_URI_TEST to override.
 * The database is emptied before every test, so NEVER point it at your
 * real CRM database.
 */
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";

const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const request = require("supertest");

const app = require("../server");
const User = require("../models/User");
const Lead = require("../models/LeadModel");
const Customer = require("../models/Customer");

const TEST_DB =
  process.env.MONGO_URI_TEST ||
  "mongodb://127.0.0.1:27017/crm_test";

const connect = async () => {
  if (!/test/i.test(TEST_DB)) {
    throw new Error(
      "Refusing to run tests: the test database name must contain 'test'."
    );
  }

  await mongoose.connect(TEST_DB);
};

const disconnect = async () => {
  await mongoose.disconnect();
};

const clearDatabase = async () => {
  await Promise.all([
    User.deleteMany({}),
    Lead.deleteMany({}),
    Customer.deleteMany({}),
  ]);
};

let counter = 0;

/*
 * Create a user directly in the database and return it with a valid token.
 */
const createUser = async (role = "Sales Staff", overrides = {}) => {
  counter += 1;

  const user = await User.create({
    name: `${role} ${counter}`,
    email: `user${counter}@crm.test`,
    password: "not-used-in-these-tests",
    role,
    status: "Active",
    ...overrides,
  });

  const token = jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  return { user, token, auth: `Bearer ${token}` };
};

const api = () => request(app);

/*
 * Create a lead through the API as the given user.
 */
const createLead = async (actor, data = {}) => {
  counter += 1;

  const res = await api()
    .post("/api/leads")
    .set("Authorization", actor.auth)
    .send({
      name: `Lead ${counter}`,
      email: `lead${counter}@example.com`,
      phone: `98765${String(10000 + counter)}`,
      source: "Website",
      ...data,
    });

  return res;
};

const createCustomer = async (actor, data = {}) => {
  counter += 1;

  return api()
    .post("/api/customers")
    .set("Authorization", actor.auth)
    .send({
      name: `Customer ${counter}`,
      email: `customer${counter}@example.com`,
      phone: `91234${String(10000 + counter)}`,
      ...data,
    });
};

module.exports = {
  connect,
  disconnect,
  clearDatabase,
  createUser,
  createLead,
  createCustomer,
  api,
  User,
  Lead,
  Customer,
};
