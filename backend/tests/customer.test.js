const {
  connect,
  disconnect,
  clearDatabase,
  createUser,
  createCustomer,
  api,
  Customer,
} = require("./helpers");

describe("Epic 2 - Customers", () => {
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

  describe("Customer profiles (Issue #13)", () => {
    it("TC-CUST-01: A valid customer profile is saved and can be retrieved", async () => {
      const created = await createCustomer(sales, {
        name: "  Kiran Das ",
        email: "KIRAN@Example.com",
        phone: "9444444444",
        source: "Social Media",
        notes: "VIP",
      });

      expect(created.status).toBe(201);
      expect(created.body.customer.name).toBe("Kiran Das");
      expect(created.body.customer.email).toBe("kiran@example.com");
      expect(created.body.customer.source).toBe("Social Media");
      expect(created.body.customer.status).toBe("Active");

      const res = await api()
        .get(`/api/customers/${created.body.customer._id}`)
        .set("Authorization", sales.auth);

      expect(res.status).toBe(200);
      expect(res.body.customer.phone).toBe("9444444444");
    });

    it("TC-CUST-02: Updated profile values are saved and shown after reload", async () => {
      const created = await createCustomer(sales);
      const id = created.body.customer._id;

      const res = await api()
        .put(`/api/customers/${id}`)
        .set("Authorization", sales.auth)
        .send({
          name: "New Name",
          email: "new@example.com",
          phone: "+91 90000 11111",
          source: "Campaign",
          status: "Inactive",
          notes: "Moved to inactive",
        });

      expect(res.status).toBe(200);

      const reload = await api()
        .get(`/api/customers/${id}`)
        .set("Authorization", sales.auth);

      expect(reload.body.customer.name).toBe("New Name");
      expect(reload.body.customer.email).toBe("new@example.com");
      expect(reload.body.customer.phone).toBe("+91 90000 11111");
      expect(reload.body.customer.source).toBe("Campaign");
      expect(reload.body.customer.status).toBe("Inactive");
      expect(reload.body.customer.notes).toBe("Moved to inactive");
    });

    it("TC-CUST-03: Search and filter by name, phone, email, status and source", async () => {
      await createCustomer(sales, {
        name: "Anil Kumar",
        email: "anil@alpha.com",
        phone: "9100000001",
        source: "Website",
      });
      await createCustomer(sales, {
        name: "Bela Singh",
        email: "bela@beta.com",
        phone: "9100000002",
        source: "Referral",
        status: "Inactive",
      });

      const get = (qs) =>
        api().get(`/api/customers${qs}`).set("Authorization", sales.auth);

      expect((await get("?search=anil")).body.count).toBe(1);
      expect((await get("?search=BETA.com")).body.count).toBe(1);
      expect((await get("?search=9100000002")).body.count).toBe(1);
      expect((await get("?status=Inactive")).body.count).toBe(1);
      expect((await get("?source=Website")).body.count).toBe(1);
      expect((await get("?search=a&status=Active")).body.count).toBe(1);
      expect((await get("?search=nobody")).body.count).toBe(0);
      expect((await get("")).body.count).toBe(2);

      const special = await get("?search=.*(");
      expect(special.status).toBe(200);
      expect(special.body.count).toBe(0);
    });

    it("TC-CUST-04: Invalid customer data is rejected with 400", async () => {
      expect((await createCustomer(sales, { name: "" })).status).toBe(400);
      expect(
        (await createCustomer(sales, { email: "bad" })).status
      ).toBe(400);
      expect(
        (await createCustomer(sales, { phone: "12" })).status
      ).toBe(400);
      expect(
        (await createCustomer(sales, { status: "Gone" })).status
      ).toBe(400);
      expect(
        (await createCustomer(sales, { source: "Nowhere" })).status
      ).toBe(400);

      expect(await Customer.countDocuments()).toBe(0);

      const created = await createCustomer(sales);
      const bad = await api()
        .put(`/api/customers/${created.body.customer._id}`)
        .set("Authorization", sales.auth)
        .send({ email: "nope" });
      expect(bad.status).toBe(400);
    });

    it("TC-CUST-05: Duplicate email/phone gives a warning on create and update", async () => {
      await createCustomer(sales, {
        email: "same@example.com",
        phone: "9777777777",
      });

      const dup = await createCustomer(sales, {
        email: "same@example.com",
      });
      expect(dup.status).toBe(409);
      expect(dup.body.duplicate).toBe(true);

      const confirmed = await createCustomer(sales, {
        email: "same@example.com",
        confirmDuplicate: true,
      });
      expect(confirmed.status).toBe(201);

      const other = await createCustomer(sales);
      const warned = await api()
        .put(`/api/customers/${other.body.customer._id}`)
        .set("Authorization", sales.auth)
        .send({ phone: "9777777777" });
      expect(warned.status).toBe(409);

      // Editing without changing contact details is fine
      const plain = await api()
        .put(`/api/customers/${other.body.customer._id}`)
        .set("Authorization", sales.auth)
        .send({
          email: other.body.customer.email,
          notes: "ok",
        });
      expect(plain.status).toBe(200);
    });

    it("TC-CUST-06: Staff only reach their own customers; Admin reaches all", async () => {
      const mine = await createCustomer(sales);
      const theirs = await createCustomer(otherSales);

      const list = await api()
        .get("/api/customers")
        .set("Authorization", sales.auth);
      expect(list.body.count).toBe(1);

      expect(
        (
          await api()
            .get(`/api/customers/${theirs.body.customer._id}`)
            .set("Authorization", sales.auth)
        ).status
      ).toBe(404);

      expect(
        (
          await api()
            .put(`/api/customers/${theirs.body.customer._id}`)
            .set("Authorization", sales.auth)
            .send({ name: "Hacked" })
        ).status
      ).toBe(404);

      const adminList = await api()
        .get("/api/customers")
        .set("Authorization", admin.auth);
      expect(adminList.body.count).toBe(2);

      const adminEdit = await api()
        .put(`/api/customers/${mine.body.customer._id}`)
        .set("Authorization", admin.auth)
        .send({ notes: "checked" });
      expect(adminEdit.status).toBe(200);
    });

    it("TC-CUST-07: Customer routes reject requests without a valid token", async () => {
      const calls = [
        api().get("/api/customers"),
        api().post("/api/customers").send({}),
        api().put("/api/customers/123").send({}),
        api().patch("/api/customers/123/assign").send({}),
      ];

      for (const call of calls) {
        expect((await call).status).toBe(401);
      }
    });

    it("TC-CUST-08: Customer assigned owner cannot be changed through the profile update", async () => {
      const created = await createCustomer(sales);

      const res = await api()
        .put(`/api/customers/${created.body.customer._id}`)
        .set("Authorization", sales.auth)
        .send({ assignedTo: otherSales.user._id.toString() });

      expect(res.status).toBe(200);
      expect(res.body.customer.assignedTo._id).toBe(
        sales.user._id.toString()
      );
    });
  });
});
