# Epic 2 - Lead & Customer Management: Test Report

**Issues covered:** #11 Lead creation and management, #12 Lead-to-customer conversion, #13 Customer profile management, #14 Customer assignment to sales staff, #15 Test lead and customer management features.

**Result:** 44 of 44 automated test cases passed, 0 failed.

| Item | Value |
| --- | --- |
| Test level | Integration / API testing (HTTP requests through Express, real MongoDB, real JWT authentication) |
| Tools | Mocha, Supertest, expect |
| Environment | Node.js v22, MongoDB 7.0.34, Mongoose 9 |
| Run date | 23-10-2026 |
| Test data | Dummy staff (Admin, Sales Staff, Support Staff), leads and customers created by the tests; the test database is emptied before every test |

## How to run

1. Start MongoDB locally (the default is `mongodb://127.0.0.1:27017`).
2. In `backend/` run `npm install`, then `npm test`.
3. To use a different database, set `MONGO_URI_TEST`. The name must contain the word `test`, because the database is wiped before each test. The tests refuse to run otherwise.

## Test cases and results

Requirement IDs follow SRS v1.1 (Section 4). Test case IDs are prefixed to match the Test Plan RTM style (TC-LEAD, TC-CONV, TC-CUST).

| Test ID | Issue | Requirement | Description | Result |
| --- | --- | --- | --- | --- |
| TC-LEAD-01 | #11 | CRM-F-011 | Sales Staff creates a lead; it starts as New and is owned by the creator | Pass |
| TC-LEAD-02 | #11 | CRM-F-011 | Lead is persisted and retrievable by id | Pass |
| TC-LEAD-03 | #11 | CRM-F-011 | Invalid input is rejected with 400 | Pass |
| TC-LEAD-04 | #11 | CRM-F-012 | Duplicate email/phone gives a warning; the user can continue | Pass |
| TC-LEAD-04b | #11 | CRM-F-012 | A lead matching an existing customer also triggers the warning | Pass |
| TC-LEAD-05 | #11 | CRM-F-013 | Admin must choose a valid, active staff member as owner | Pass |
| TC-LEAD-06 | #11 | CRM-F-013 | Updated lead details are saved and visible on reload | Pass |
| TC-LEAD-07 | #11 | CRM-F-013 | Lead moves New -> Contacted -> Qualified and the status persists | Pass |
| TC-LEAD-08 | #11 | CRM-F-013 | Status cannot be set to Converted or an unknown value through update | Pass |
| TC-LEAD-09 | #11 | CRM-F-021 | Marking Lost needs a reason; Lost leads leave the active list but keep the reason | Pass |
| TC-LEAD-10 | #11 | CRM-F-021 | A Lost lead can be reopened and its lost reason is cleared | Pass |
| TC-LEAD-11 | #11 | CRM-F-012 | Changing a contact detail to one used by another record warns first | Pass |
| TC-LEAD-12 | #11 | CRM-F-012 | Saving a lead without changing its own email does not trigger a duplicate warning | Pass |
| TC-LEAD-13 | #11 | CRM-F-011 | Search matches name, email and phone, case-insensitively | Pass |
| TC-LEAD-14 | #11 | CRM-F-011 | Status and source filters return only matching leads | Pass |
| TC-LEAD-15 | #11 | CRM-SR-003 | Special characters in search are treated as text, not as a pattern | Pass |
| TC-LEAD-16 | #11 | CRM-SR-003 | Staff only see and edit their own leads; Admin sees all | Pass |
| TC-LEAD-17 | #11 | CRM-SR-003 | Requests without a valid token are rejected with 401 | Pass |
| TC-LEAD-18 | #11 | CRM-SR-003 | A malformed id returns 404 instead of a server error | Pass |
| TC-CONV-01 | #12 | CRM-F-020 | A Qualified lead converts to a customer without re-entering data | Pass |
| TC-CONV-02 | #12 | CRM-F-020 | Leads that are not Qualified cannot be converted | Pass |
| TC-CONV-03 | #12 | CRM-F-020 | An already converted lead cannot be converted again and cannot be edited | Pass |
| TC-CONV-04 | #12 | CRM-F-020 | Two simultaneous conversions create exactly one customer | Pass |
| TC-CONV-05 | #12 | CRM-F-020 | If the person is already a customer, the lead is linked instead of duplicated | Pass |
| TC-CONV-06 | #12 | CRM-F-020 | Matching by phone number also links to the existing customer | Pass |
| TC-CONV-07 | #12 | CRM-F-020 | Staff cannot link to a customer owned by someone else; Admin can | Pass |
| TC-CONV-08 | #12 | CRM-F-020 | Staff cannot convert another staff member's lead; Admin can convert any | Pass |
| TC-CONV-09 | #12 | CRM-F-020 | Converting a missing lead or using a bad id gives 404 | Pass |
| TC-CONV-10 | #12 | CRM-F-024 | The newly converted customer can be found through customer search | Pass |
| TC-CUST-01 | #13 | CRM-F-022 | A valid customer profile is saved and can be retrieved | Pass |
| TC-CUST-02 | #13 | CRM-F-023 | Updated profile values are saved and shown after reload | Pass |
| TC-CUST-03 | #13 | CRM-F-024 | Search and filter by name, phone, email, status and source | Pass |
| TC-CUST-04 | #13 | CRM-F-022 / 023 | Invalid customer data is rejected with 400 | Pass |
| TC-CUST-05 | #13 | CRM-F-012 | Duplicate email/phone gives a warning on create and update | Pass |
| TC-CUST-06 | #13 | CRM-SR-003 | Staff only reach their own customers; Admin reaches all | Pass |
| TC-CUST-07 | #13 | CRM-SR-003 | Customer routes reject requests without a valid token | Pass |
| TC-CUST-08 | #13 | CRM-F-023 | Customer assigned owner cannot be changed through the profile update | Pass |
| TC-ASSIGN-01 | #14 | CRM-F-013 | Admin assigns a customer to a staff member; the new owner sees it and the old owner no longer does | Pass |
| TC-ASSIGN-02 | #14 | CRM-F-013 | Admin assigns a lead to a staff member and the change is saved | Pass |
| TC-ASSIGN-03 | #14 | CRM-F-013 | Only Admin can assign; staff get 403 and nothing changes | Pass |
| TC-ASSIGN-04 | #14 | CRM-F-013 | Invalid assignees are rejected (missing, unknown, inactive, Admin account) | Pass |
| TC-ASSIGN-05 | #14 | CRM-F-013 | Assigning a missing record or using a bad id returns 404 | Pass |
| TC-ASSIGN-06 | #14 | CRM-F-013 | Admin can filter the lead and customer lists by assigned staff member | Pass |
| TC-ASSIGN-07 | #14 | CRM-F-013 | A converted lead's customer follows the lead's current owner | Pass |

## Behaviour implemented for Epic 2

| Area | Behaviour |
| --- | --- |
| Lead creation (#11) | Required name and valid email, optional valid phone, source from the configured list, default status New. Staff own the leads they create; Admin must pick an active staff member. |
| Lead update (#11) | Edit contact details, source and notes. Status moves between New, Contacted and Qualified. Lost requires a reason and removes the lead from the active list; a Lost lead can be reopened. Converted leads are locked. |
| Duplicate warning (#11, #13) | If the email or phone matches an existing lead or customer, the API answers 409 with `duplicate: true` and the matches. The user may cancel or continue (`confirmDuplicate: true`). |
| Search and filter (#11, #13) | `GET /api/leads` and `GET /api/customers` accept `search` (name, email, phone), `status`, `source` and, for Admin, `assignedTo`. Lost leads are hidden unless `status=Lost` or `status=all`. |
| Conversion (#12) | Only Qualified leads convert. The customer is created from the lead data (including source and notes). If a customer with the same email or phone already exists, the lead is linked to it instead of duplicating it. The status change is claimed atomically, so simultaneous requests create exactly one customer. |
| Customer profiles (#13) | Create, read, update (name, email, phone, source, status, notes) with the same validation and ownership rules. New `source` field on customers (SRS CRM-F-022). |
| Assignment (#14) | `PATCH /api/leads/:id/assign` and `PATCH /api/customers/:id/assign`, Admin only. The assignee must exist, be Active and be Sales or Support Staff. |
| Access control | Staff reach only their own leads and customers; Admin reaches all. Missing or invalid tokens give 401; non-Admin assignment gives 403; malformed ids give 404 instead of a server error. |

## Deviations and decisions to review

1. **Conversion now requires status Qualified.** The previous code allowed converting New and Contacted leads. SRS Section 7.2 says a lead can be converted only when it is Qualified, so the code now follows the SRS.
2. **Existing customer on conversion is linked, not rejected.** The previous code returned an error. The SRS flow (7.2) says to link to the existing customer. Staff cannot link to a customer owned by another staff member (409, contact an Admin).
3. **Assignment is Admin only.** Staff only see their own records, so letting staff hand records away would make them disappear from the sender. The SRS does not name the role that assigns, so confirm this with your team.
4. **Requirement IDs differ between documents.** The Test Plan RTM uses CRM-F-020 for lead create/update and CRM-F-030 for conversion, but SRS v1.1 uses CRM-F-011 and CRM-F-013 for lead create/update, CRM-F-020 for conversion and CRM-F-022 to 024 for customer profiles. This report uses the SRS IDs. The Test Plan RTM should be updated to match.
5. **Lost leads are hidden from the default list** (SRS AC-021). Use the status filter to see them.

## Documentation updates suggested

- **Architecture and Design Specification, Section 4.3 (API design):** add `PUT /api/leads/:id`, `PATCH /api/leads/:id/assign`, `PUT /api/customers/:id` and `PATCH /api/customers/:id/assign`, and the 409 duplicate-warning behaviour.
- **Test Plan, Section 13 (RTM):** add the test IDs above and align the requirement IDs with the SRS.

## Not covered by these tests

- Browser behaviour of the React pages (forms, dropdowns, confirm dialogs) was type-checked, linted and built, but not clicked through. A short manual check is recommended before the demo.
- Load and response-time requirements (CRM-NF-001, CRM-NF-006) belong to the NFR issues (#29 to #34).
- Audit logging of lead conversion and customer changes (CRM-F-062) is covered by issue #25 and is not implemented here.
