const {
  connect,
  disconnect,
  clearDatabase,
  createUser,
  createLead,
  createCustomer,
  api,
} = require("./helpers");

describe("Epic 2 - Assignment", () => {
  let sales;
  let otherSales;
  let support;
  let admin;

  before(connect);
  after(disconnect);

  beforeEach(async () => {
    await clearDatabase();
    sales = await createUser("Sales Staff");
    otherSales = await createUser("Sales Staff");
    support = await createUser("Support Staff");
    admin = await createUser("Admin");
  });

  describe("Customer and lead assignment (Issue #14)", () => {
    it("TC-ASSIGN-01: Admin assigns a customer to a staff member; the new owner sees it and the old owner no longer does", async () => {
      const created = await createCustomer(sales);
      const id = created.body.customer._id;

      const res = await api()
        .patch(`/api/customers/${id}/assign`)
        .set("Authorization", admin.auth)
        .send({ assignedTo: otherSales.user._id.toString() });

      expect(res.status).toBe(200);
      expect(res.body.customer.assignedTo._id).toBe(
        otherSales.user._id.toString()
      );

      const newOwner = await api()
        .get("/api/customers")
        .set("Authorization", otherSales.auth);
      expect(newOwner.body.count).toBe(1);

      const oldOwner = await api()
        .get("/api/customers")
        .set("Authorization", sales.auth);
      expect(oldOwner.body.count).toBe(0);
    });

    it("TC-ASSIGN-02: Admin assigns a lead to a staff member and the change is saved", async () => {
      const created = await createLead(sales);
      const id = created.body.lead._id;

      const res = await api()
        .patch(`/api/leads/${id}/assign`)
        .set("Authorization", admin.auth)
        .send({ assignedTo: support.user._id.toString() });

      expect(res.status).toBe(200);

      const reload = await api()
        .get(`/api/leads/${id}`)
        .set("Authorization", admin.auth);
      expect(reload.body.lead.assignedTo._id).toBe(
        support.user._id.toString()
      );
    });

    it("TC-ASSIGN-03: Only Admin can assign; staff get 403 and nothing changes", async () => {
      const lead = await createLead(sales);
      const customer = await createCustomer(sales);

      const leadRes = await api()
        .patch(`/api/leads/${lead.body.lead._id}/assign`)
        .set("Authorization", sales.auth)
        .send({ assignedTo: otherSales.user._id.toString() });
      expect(leadRes.status).toBe(403);

      const customerRes = await api()
        .patch(`/api/customers/${customer.body.customer._id}/assign`)
        .set("Authorization", sales.auth)
        .send({ assignedTo: otherSales.user._id.toString() });
      expect(customerRes.status).toBe(403);

      const still = await api()
        .get(`/api/customers/${customer.body.customer._id}`)
        .set("Authorization", sales.auth);
      expect(still.status).toBe(200);
    });

    it("TC-ASSIGN-04: Invalid assignees are rejected (missing, unknown, inactive, Admin account)", async () => {
      const created = await createCustomer(sales);
      const id = created.body.customer._id;
      const inactive = await createUser("Sales Staff", {
        status: "Inactive",
      });

      const attempts = [
        {},
        { assignedTo: "not-an-id" },
        { assignedTo: "64b0f0f0f0f0f0f0f0f0f0f0" },
        { assignedTo: inactive.user._id.toString() },
        { assignedTo: admin.user._id.toString() },
      ];

      for (const body of attempts) {
        const res = await api()
          .patch(`/api/customers/${id}/assign`)
          .set("Authorization", admin.auth)
          .send(body);

        expect(res.status).toBe(400);
      }

      const still = await api()
        .get(`/api/customers/${id}`)
        .set("Authorization", sales.auth);
      expect(still.status).toBe(200);
    });

    it("TC-ASSIGN-05: Assigning a missing record or using a bad id returns 404", async () => {
      const missing = await api()
        .patch("/api/customers/64b0f0f0f0f0f0f0f0f0f0f0/assign")
        .set("Authorization", admin.auth)
        .send({ assignedTo: sales.user._id.toString() });
      expect(missing.status).toBe(404);

      const bad = await api()
        .patch("/api/leads/xyz/assign")
        .set("Authorization", admin.auth)
        .send({ assignedTo: sales.user._id.toString() });
      expect(bad.status).toBe(404);
    });

    it("TC-ASSIGN-06: Admin can filter the lead and customer lists by assigned staff member", async () => {
      await createLead(sales);
      await createLead(otherSales);
      await createCustomer(sales);
      await createCustomer(otherSales);
      await createCustomer(otherSales);

      const leads = await api()
        .get(`/api/leads?assignedTo=${otherSales.user._id}`)
        .set("Authorization", admin.auth);
      expect(leads.body.count).toBe(1);

      const customers = await api()
        .get(`/api/customers?assignedTo=${otherSales.user._id}`)
        .set("Authorization", admin.auth);
      expect(customers.body.count).toBe(2);

      const bad = await api()
        .get("/api/leads?assignedTo=zzz")
        .set("Authorization", admin.auth);
      expect(bad.status).toBe(400);
    });

    it("TC-ASSIGN-07: A converted lead's customer follows the lead's current owner", async () => {
      const created = await createLead(sales, { status: "Qualified" });
      const id = created.body.lead._id;

      await api()
        .patch(`/api/leads/${id}/assign`)
        .set("Authorization", admin.auth)
        .send({ assignedTo: otherSales.user._id.toString() });

      const res = await api()
        .post(`/api/leads/${id}/convert`)
        .set("Authorization", otherSales.auth);

      expect(res.status).toBe(201);
      expect(res.body.customer.assignedTo._id).toBe(
        otherSales.user._id.toString()
      );
    });
  });
});
