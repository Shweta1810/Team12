const {
  connect,
  disconnect,
  clearDatabase,
  createUser,
  createLead,
  createCustomer,
  api,
  Lead,
} = require("./helpers");

describe("Epic 2 - Leads", () => {
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

  describe("Lead creation (Issue #11)", () => {
    it("TC-LEAD-01: Sales Staff creates a lead; it starts as New and is owned by the creator", async () => {
      const res = await createLead(sales, {
        name: "  Asha Rao ",
        email: "ASHA@Example.com",
      });

      expect(res.status).toBe(201);
      expect(res.body.lead.name).toBe("Asha Rao");
      expect(res.body.lead.email).toBe("asha@example.com");
      expect(res.body.lead.status).toBe("New");
      expect(res.body.lead.assignedTo._id).toBe(
        sales.user._id.toString()
      );

      const saved = await Lead.findById(res.body.lead._id);
      expect(saved).not.toBeNull();
    });

    it("TC-LEAD-02: Lead is persisted and retrievable by id", async () => {
      const created = await createLead(sales);

      const res = await api()
        .get(`/api/leads/${created.body.lead._id}`)
        .set("Authorization", sales.auth);

      expect(res.status).toBe(200);
      expect(res.body.lead.email).toBe(created.body.lead.email);
    });

    it("TC-LEAD-03: Invalid input is rejected with 400", async () => {
      const missing = await createLead(sales, { name: "" });
      expect(missing.status).toBe(400);

      const badEmail = await createLead(sales, { email: "not-an-email" });
      expect(badEmail.status).toBe(400);

      const badPhone = await createLead(sales, { phone: "abc" });
      expect(badPhone.status).toBe(400);

      const badSource = await createLead(sales, { source: "Telepathy" });
      expect(badSource.status).toBe(400);

      const badStatus = await createLead(sales, { status: "Converted" });
      expect(badStatus.status).toBe(400);

      expect(await Lead.countDocuments()).toBe(0);
    });

    it("TC-LEAD-04: Duplicate email/phone gives a warning; the user can continue", async () => {
      const first = await createLead(sales, {
        email: "dup@example.com",
        phone: "9000000001",
      });
      expect(first.status).toBe(201);

      const sameEmail = await createLead(sales, {
        email: "DUP@example.com",
        phone: "9000000099",
      });
      expect(sameEmail.status).toBe(409);
      expect(sameEmail.body.duplicate).toBe(true);
      expect(sameEmail.body.matches).toHaveLength(1);

      const samePhone = await createLead(sales, {
        email: "different@example.com",
        phone: "9000000001",
      });
      expect(samePhone.status).toBe(409);

      // Nothing was saved by the warned requests
      expect(await Lead.countDocuments()).toBe(1);

      const confirmed = await createLead(sales, {
        email: "dup@example.com",
        phone: "9000000099",
        confirmDuplicate: true,
      });
      expect(confirmed.status).toBe(201);
      expect(await Lead.countDocuments()).toBe(2);
    });

    it("TC-LEAD-04b: A lead matching an existing customer also triggers the warning", async () => {
      await createCustomer(sales, { email: "client@example.com" });

      const res = await createLead(sales, { email: "client@example.com" });

      expect(res.status).toBe(409);
      expect(res.body.matches[0].type).toBe("Customer");
    });

    it("TC-LEAD-05: Admin must choose a valid, active staff member as owner", async () => {
      const noOwner = await createLead(admin);
      expect(noOwner.status).toBe(400);

      const asAdminUser = await createLead(admin, {
        assignedTo: admin.user._id.toString(),
      });
      expect(asAdminUser.status).toBe(400);

      const ok = await createLead(admin, {
        assignedTo: sales.user._id.toString(),
      });
      expect(ok.status).toBe(201);
      expect(ok.body.lead.assignedTo._id).toBe(
        sales.user._id.toString()
      );
    });
  });

  describe("Lead update, qualification and Lost handling (Issue #11)", () => {
    it("TC-LEAD-06: Updated lead details are saved and visible on reload", async () => {
      const created = await createLead(sales);
      const id = created.body.lead._id;

      const res = await api()
        .put(`/api/leads/${id}`)
        .set("Authorization", sales.auth)
        .send({
          name: "Updated Name",
          phone: "+91 98765 43210",
          source: "Referral",
          notes: "Called back",
        });

      expect(res.status).toBe(200);

      const reload = await api()
        .get(`/api/leads/${id}`)
        .set("Authorization", sales.auth);

      expect(reload.body.lead.name).toBe("Updated Name");
      expect(reload.body.lead.phone).toBe("+91 98765 43210");
      expect(reload.body.lead.source).toBe("Referral");
      expect(reload.body.lead.notes).toBe("Called back");
    });

    it("TC-LEAD-07: Lead moves New -> Contacted -> Qualified and the status persists", async () => {
      const created = await createLead(sales);
      const id = created.body.lead._id;

      for (const status of ["Contacted", "Qualified"]) {
        const res = await api()
          .put(`/api/leads/${id}`)
          .set("Authorization", sales.auth)
          .send({ status });

        expect(res.status).toBe(200);
        expect(res.body.lead.status).toBe(status);
      }

      const saved = await Lead.findById(id);
      expect(saved.status).toBe("Qualified");
    });

    it("TC-LEAD-08: Status cannot be set to Converted or an unknown value through update", async () => {
      const created = await createLead(sales);
      const id = created.body.lead._id;

      const converted = await api()
        .put(`/api/leads/${id}`)
        .set("Authorization", sales.auth)
        .send({ status: "Converted" });
      expect(converted.status).toBe(400);

      const unknown = await api()
        .put(`/api/leads/${id}`)
        .set("Authorization", sales.auth)
        .send({ status: "Won" });
      expect(unknown.status).toBe(400);
    });

    it("TC-LEAD-09: Marking Lost needs a reason; Lost leads leave the active list but keep the reason", async () => {
      const created = await createLead(sales);
      const id = created.body.lead._id;

      const noReason = await api()
        .put(`/api/leads/${id}`)
        .set("Authorization", sales.auth)
        .send({ status: "Lost" });
      expect(noReason.status).toBe(400);

      const lost = await api()
        .put(`/api/leads/${id}`)
        .set("Authorization", sales.auth)
        .send({ status: "Lost", lostReason: "Chose a competitor" });
      expect(lost.status).toBe(200);
      expect(lost.body.lead.lostReason).toBe("Chose a competitor");

      const active = await api()
        .get("/api/leads")
        .set("Authorization", sales.auth);
      expect(active.body.count).toBe(0);

      const onlyLost = await api()
        .get("/api/leads?status=Lost")
        .set("Authorization", sales.auth);
      expect(onlyLost.body.count).toBe(1);
      expect(onlyLost.body.leads[0].lostReason).toBe(
        "Chose a competitor"
      );

      const all = await api()
        .get("/api/leads?status=all")
        .set("Authorization", sales.auth);
      expect(all.body.count).toBe(1);
    });

    it("TC-LEAD-10: A Lost lead can be reopened and its lost reason is cleared", async () => {
      const created = await createLead(sales);
      const id = created.body.lead._id;

      await api()
        .put(`/api/leads/${id}`)
        .set("Authorization", sales.auth)
        .send({ status: "Lost", lostReason: "No budget" });

      const reopened = await api()
        .put(`/api/leads/${id}`)
        .set("Authorization", sales.auth)
        .send({ status: "New" });

      expect(reopened.status).toBe(200);
      expect(reopened.body.lead.status).toBe("New");
      expect(reopened.body.lead.lostReason).toBeUndefined();

      const active = await api()
        .get("/api/leads")
        .set("Authorization", sales.auth);
      expect(active.body.count).toBe(1);
    });

    it("TC-LEAD-11: Changing a contact detail to one used by another record warns first", async () => {
      await createLead(sales, { email: "taken@example.com" });
      const second = await createLead(sales);

      const warned = await api()
        .put(`/api/leads/${second.body.lead._id}`)
        .set("Authorization", sales.auth)
        .send({ email: "taken@example.com" });
      expect(warned.status).toBe(409);
      expect(warned.body.duplicate).toBe(true);

      const confirmed = await api()
        .put(`/api/leads/${second.body.lead._id}`)
        .set("Authorization", sales.auth)
        .send({ email: "taken@example.com", confirmDuplicate: true });
      expect(confirmed.status).toBe(200);
    });

    it("TC-LEAD-12: Saving a lead without changing its own email does not trigger a duplicate warning", async () => {
      const created = await createLead(sales);

      const res = await api()
        .put(`/api/leads/${created.body.lead._id}`)
        .set("Authorization", sales.auth)
        .send({
          email: created.body.lead.email,
          phone: created.body.lead.phone,
          notes: "Edited",
        });

      expect(res.status).toBe(200);
    });
  });

  describe("Lead search and filters (Issue #11)", () => {
    beforeEach(async () => {
      await createLead(sales, {
        name: "Priya Sharma",
        email: "priya@example.com",
        phone: "9111111111",
        source: "Website",
      });
      await createLead(sales, {
        name: "Rahul Verma",
        email: "rahul@sample.org",
        phone: "9222222222",
        source: "Referral",
        status: "Contacted",
      });
    });

    it("TC-LEAD-13: Search matches name, email and phone, case-insensitively", async () => {
      const byName = await api()
        .get("/api/leads?search=priya")
        .set("Authorization", sales.auth);
      expect(byName.body.count).toBe(1);

      const byEmail = await api()
        .get("/api/leads?search=SAMPLE.org")
        .set("Authorization", sales.auth);
      expect(byEmail.body.count).toBe(1);
      expect(byEmail.body.leads[0].name).toBe("Rahul Verma");

      const byPhone = await api()
        .get("/api/leads?search=9222")
        .set("Authorization", sales.auth);
      expect(byPhone.body.count).toBe(1);
    });

    it("TC-LEAD-14: Status and source filters return only matching leads", async () => {
      const contacted = await api()
        .get("/api/leads?status=Contacted")
        .set("Authorization", sales.auth);
      expect(contacted.body.count).toBe(1);
      expect(contacted.body.leads[0].name).toBe("Rahul Verma");

      const referral = await api()
        .get("/api/leads?source=Referral")
        .set("Authorization", sales.auth);
      expect(referral.body.count).toBe(1);

      const none = await api()
        .get("/api/leads?search=priya&status=Contacted")
        .set("Authorization", sales.auth);
      expect(none.body.count).toBe(0);
    });

    it("TC-LEAD-15: Special characters in search are treated as text, not as a pattern", async () => {
      const res = await api()
        .get("/api/leads?search=.*(")
        .set("Authorization", sales.auth);

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(0);
    });
  });

  describe("Lead access control (Issue #11)", () => {
    it("TC-LEAD-16: Staff only see and edit their own leads; Admin sees all", async () => {
      const mine = await createLead(sales);
      const theirs = await createLead(otherSales);

      const list = await api()
        .get("/api/leads")
        .set("Authorization", sales.auth);
      expect(list.body.count).toBe(1);
      expect(list.body.leads[0]._id).toBe(mine.body.lead._id);

      const read = await api()
        .get(`/api/leads/${theirs.body.lead._id}`)
        .set("Authorization", sales.auth);
      expect(read.status).toBe(404);

      const edit = await api()
        .put(`/api/leads/${theirs.body.lead._id}`)
        .set("Authorization", sales.auth)
        .send({ name: "Hacked" });
      expect(edit.status).toBe(404);

      const adminList = await api()
        .get("/api/leads")
        .set("Authorization", admin.auth);
      expect(adminList.body.count).toBe(2);

      const adminEdit = await api()
        .put(`/api/leads/${theirs.body.lead._id}`)
        .set("Authorization", admin.auth)
        .send({ notes: "Reviewed by admin" });
      expect(adminEdit.status).toBe(200);
    });

    it("TC-LEAD-17: Requests without a valid token are rejected with 401", async () => {
      const calls = [
        api().get("/api/leads"),
        api().post("/api/leads").send({}),
        api().put("/api/leads/123").send({}),
        api().post("/api/leads/123/convert"),
        api().patch("/api/leads/123/assign").send({}),
      ];

      for (const call of calls) {
        expect((await call).status).toBe(401);
      }

      const badToken = await api()
        .get("/api/leads")
        .set("Authorization", "Bearer not.a.token");
      expect(badToken.status).toBe(401);
    });

    it("TC-LEAD-18: A malformed id returns 404 instead of a server error", async () => {
      const res = await api()
        .get("/api/leads/not-an-object-id")
        .set("Authorization", sales.auth);

      expect(res.status).toBe(404);
    });
  });
});
