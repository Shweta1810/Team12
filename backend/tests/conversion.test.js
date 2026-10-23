const {
  connect,
  disconnect,
  clearDatabase,
  createUser,
  createLead,
  createCustomer,
  api,
  Lead,
  Customer,
} = require("./helpers");

describe("Epic 2 - Conversion", () => {
  let sales;
  let otherSales;
  let admin;

  before(connect);
  after(disconnect);

  beforeEach(async () => {
    await clearDatabase();
    sales = await createUser("Sales Staff");
    otherSales = await createUser("Sales Staff");
    admin = await createUser("Admin");
  });

  const qualifiedLead = async (actor, data = {}) => {
    const created = await createLead(actor, data);
    const id = created.body.lead._id;

    await api()
      .put(`/api/leads/${id}`)
      .set("Authorization", actor.auth)
      .send({ status: "Qualified" });

    return created.body.lead;
  };

  const convert = (actor, id) =>
    api()
      .post(`/api/leads/${id}/convert`)
      .set("Authorization", actor.auth);

  describe("Lead-to-customer conversion (Issue #12)", () => {
    it("TC-CONV-01: A Qualified lead converts to a customer without re-entering data", async () => {
      const lead = await qualifiedLead(sales, {
        name: "Meera Nair",
        email: "meera@example.com",
        phone: "9333333333",
        source: "Referral",
        notes: "Interested in premium plan",
      });

      const res = await convert(sales, lead._id);

      expect(res.status).toBe(201);
      expect(res.body.linked).toBe(false);
      expect(res.body.customer.name).toBe("Meera Nair");
      expect(res.body.customer.email).toBe("meera@example.com");
      expect(res.body.customer.phone).toBe("9333333333");
      expect(res.body.customer.source).toBe("Referral");
      expect(res.body.customer.status).toBe("Active");
      expect(res.body.customer.notes).toBe(
        "Interested in premium plan"
      );
      expect(res.body.customer.assignedTo._id).toBe(
        sales.user._id.toString()
      );
      expect(res.body.lead.status).toBe("Converted");

      // Both changes are stored in the database
      const savedLead = await Lead.findById(lead._id);
      expect(savedLead.status).toBe("Converted");
      expect(savedLead.convertedCustomer.toString()).toBe(
        res.body.customer._id
      );
      expect(await Customer.countDocuments()).toBe(1);
    });

    it("TC-CONV-02: Leads that are not Qualified cannot be converted", async () => {
      const fresh = await createLead(sales);
      const freshRes = await convert(sales, fresh.body.lead._id);
      expect(freshRes.status).toBe(400);
      expect(freshRes.body.message).toMatch(/Qualified/);

      const contacted = await createLead(sales, { status: "Contacted" });
      const contactedRes = await convert(
        sales,
        contacted.body.lead._id
      );
      expect(contactedRes.status).toBe(400);

      const lostLead = await qualifiedLead(sales);
      await api()
        .put(`/api/leads/${lostLead._id}`)
        .set("Authorization", sales.auth)
        .send({ status: "Lost", lostReason: "No budget" });
      const lostRes = await convert(sales, lostLead._id);
      expect(lostRes.status).toBe(400);

      expect(await Customer.countDocuments()).toBe(0);
      expect(
        (await Lead.findById(fresh.body.lead._id)).status
      ).toBe("New");
    });

    it("TC-CONV-03: An already converted lead cannot be converted again and cannot be edited", async () => {
      const lead = await qualifiedLead(sales);

      expect((await convert(sales, lead._id)).status).toBe(201);

      const again = await convert(sales, lead._id);
      expect(again.status).toBe(400);
      expect(again.body.message).toMatch(/already been converted/);

      const edit = await api()
        .put(`/api/leads/${lead._id}`)
        .set("Authorization", sales.auth)
        .send({ name: "Changed" });
      expect(edit.status).toBe(400);

      expect(await Customer.countDocuments()).toBe(1);
    });

    it("TC-CONV-04: Two simultaneous conversions create exactly one customer", async () => {
      const lead = await qualifiedLead(sales);

      const results = await Promise.all([
        convert(sales, lead._id),
        convert(sales, lead._id),
        convert(sales, lead._id),
      ]);

      const successes = results.filter((r) =>
        [200, 201].includes(r.status)
      );

      expect(successes).toHaveLength(1);
      expect(await Customer.countDocuments()).toBe(1);
    });

    it("TC-CONV-05: If the person is already a customer, the lead is linked instead of duplicated", async () => {
      const existing = await createCustomer(sales, {
        email: "repeat@example.com",
      });
      const lead = await qualifiedLead(sales, {
        email: "repeat@example.com",
        confirmDuplicate: true,
      });

      const res = await convert(sales, lead._id);

      expect(res.status).toBe(200);
      expect(res.body.linked).toBe(true);
      expect(res.body.customer._id).toBe(
        existing.body.customer._id
      );
      expect(await Customer.countDocuments()).toBe(1);

      const savedLead = await Lead.findById(lead._id);
      expect(savedLead.status).toBe("Converted");
      expect(savedLead.convertedCustomer.toString()).toBe(
        existing.body.customer._id
      );
    });

    it("TC-CONV-06: Matching by phone number also links to the existing customer", async () => {
      const existing = await createCustomer(sales, {
        phone: "9555555555",
      });
      const lead = await qualifiedLead(sales, {
        email: "other@example.com",
        phone: "9555555555",
        confirmDuplicate: true,
      });

      const res = await convert(sales, lead._id);

      expect(res.status).toBe(200);
      expect(res.body.customer._id).toBe(
        existing.body.customer._id
      );
    });

    it("TC-CONV-07: Staff cannot link to a customer owned by someone else; Admin can", async () => {
      await createCustomer(otherSales, { email: "shared@example.com" });
      const lead = await qualifiedLead(sales, {
        email: "shared@example.com",
        confirmDuplicate: true,
      });

      const blocked = await convert(sales, lead._id);
      expect(blocked.status).toBe(409);
      expect((await Lead.findById(lead._id)).status).toBe("Qualified");

      const byAdmin = await convert(admin, lead._id);
      expect(byAdmin.status).toBe(200);
      expect(byAdmin.body.linked).toBe(true);
    });

    it("TC-CONV-08: Staff cannot convert another staff member's lead; Admin can convert any", async () => {
      const lead = await qualifiedLead(otherSales);

      const denied = await convert(sales, lead._id);
      expect(denied.status).toBe(404);

      const allowed = await convert(admin, lead._id);
      expect(allowed.status).toBe(201);
      // The customer keeps the lead's owner
      expect(allowed.body.customer.assignedTo._id).toBe(
        otherSales.user._id.toString()
      );
    });

    it("TC-CONV-09: Converting a missing lead or using a bad id gives 404", async () => {
      const missing = await convert(
        sales,
        "64b0f0f0f0f0f0f0f0f0f0f0"
      );
      expect(missing.status).toBe(404);

      const bad = await convert(sales, "nope");
      expect(bad.status).toBe(404);
    });

    it("TC-CONV-10: The newly converted customer can be found through customer search", async () => {
      const lead = await qualifiedLead(sales, { name: "Zoya Khan" });
      await convert(sales, lead._id);

      const customers = await api()
        .get("/api/customers?search=zoya")
        .set("Authorization", sales.auth);

      expect(customers.body.count).toBe(1);
      expect(customers.body.customers[0].name).toBe("Zoya Khan");
    });
  });
});
