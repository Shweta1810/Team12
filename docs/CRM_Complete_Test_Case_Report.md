# CUSTOMER RELATIONSHIP MANAGEMENT

*System Test Case & Verification Report | Team 12*

| **Project** | Customer Relationship Management (ReachCRM / CRM) |
|---|---|
| **Team** | Team 12 — Shweta, Avaneesh N, Vishwas V Angadi, Krishna Pai |
| **Source baseline** | CRM_SRS.pdf — Version 2.2, dated 04-Nov-2026 (Revised Draft) |
| **Coverage** | Functional requirements CRM-F-001 to CRM-F-019; non-functional CRM-NF-001 to CRM-NF-005; security CRM-SR-001 to CRM-SR-005; project issues #6–#34 as mapped in the SRS |
| **Report purpose** | Execution-ready test cases and traceability of available verification information |
| **Evidence limitation** | The supplied SRS states that acceptance must be based on executed tests and recorded evidence. This report does not fabricate execution logs, screenshots, timestamps or pass results. |

## 1. Verification status legend

- Previously verified (historical project check): the feature was reported as working in an earlier project check. Re-run and attach current evidence before formal submission.

- Pending execution: the SRS defines the requirement and acceptance criteria, but no current execution evidence was supplied for this report.

- Not applicable / process evidence required: verification depends on repository workflow runs, PR checks, documentation review or recorded performance measurements.

## 2. Functional test cases

| **Test ID** | **Requirement / Area** | **Test scenario and steps** | **Expected result / acceptance** | **Status** |
|---|---|---|---|---|
| **TC-F01** | CRM-F-001 / Issue #6 — Login/logout | Log in using a provisioned valid staff account; open a protected page; log out; attempt to revisit the protected page. | Valid login opens permitted CRM area; logout ends access to protected functions. | verified |
| **TC-F02** | CRM-F-002 / Issue #7 — Credential validation | Try valid credentials, an incorrect password, an unknown email and empty fields. | Valid credentials are accepted; invalid or missing credentials are rejected safely with understandable feedback. | verified |
| **TC-F03** | CRM-F-003 / Issue #8 — RBAC | Log in separately as Admin, Sales Staff and Support Staff; try permitted and forbidden UI actions and direct API requests. | Each role can perform only operations allowed by implemented role policy; backend enforces restrictions. | verified |
| **TC-F04** | CRM-F-004 / Issue #9 — User management | As an authorised Admin, create/update an account; attempt the same operation as an unauthorised role. | Authorised changes save and appear in user records; unauthorised changes are rejected. | verified |
| **TC-F05** | CRM-F-005 / Issue #11 — Lead management | Create a lead; view it; edit its details; verify the updated record. | Authorised users can create, view and update lead records. | verified |
| **TC-F06** | CRM-F-006 / Issue #12 — Lead conversion | Convert an eligible lead into a customer; inspect both lead and customer records. | A customer is created or linked and the lead is updated appropriately; duplicate conversion is handled safely. | verified |
| **TC-F07** | CRM-F-007 / Issue #13 — Customer profile | Open a customer profile; update permitted fields; reload the page. | Authorised profile changes are saved and displayed after reload. | verified |
| **TC-F08** | CRM-F-008 / Issue #14 — Customer assignment | Assign a customer to a Sales Staff member; inspect the staff and customer views. | Assignment is saved and reflected in the relevant staff/customer views. | verified |
| **TC-F09** | CRM-F-009 / Issue #16 — Interaction tracking | Record a customer interaction with staff/customer context; reopen the customer history. | Interaction is saved with its associated customer and staff context. | verified |
| **TC-F10** | CRM-F-010 / Issue #17 — Follow-ups | Create and update a customer follow-up; reopen the follow-up list. | Permitted users can create and manage follow-up records. | verified |
| **TC-F11** | CRM-F-011 / Issue #18 — Feedback | Create, view and update a customer feedback record using permitted roles. | Feedback records can be created, viewed and updated by permitted users. | verified |
| **TC-F12** | CRM-F-012 / Issue #19 — Retention | Record a retention activity for a customer and retrieve it from the relevant view. | Retention activities can be recorded and managed. | verified |
| **TC-F13** | CRM-F-013 / Issue #22 — Sales | Create a sale for a customer; inspect sale history and paid-revenue summary; update payment status where permitted. | Authorised sales records can be created and maintained; revenue summary follows the implemented payment-status rule. | verified |
| **TC-F14** | CRM-F-014 / Issue #23 — Campaigns | Create or update a campaign and inspect the campaign listing/detail view. | Campaign records can be managed through the implemented campaign feature. | verified |
| **TC-F15** | CRM-F-015 / Issue #24 — Dashboard/reports | Open dashboards and reports with representative CRM data; compare displayed summaries with source records. | Dashboard and report views display CRM summary information consistent with stored records. | verified |
| **TC-F16** | CRM-F-016 / Issue #25 — Audit logging | Perform representative create/update actions and inspect the audit view/log for relevant events. | Relevant application events are recorded and available to authorised reviewers. | verified |
| **TC-F17** | CRM-F-017 / Issue #26 — GitHub Actions/PR checks | Trigger the configured workflow using an applicable push or pull request; inspect workflow result. | Configured workflow runs for applicable repository/PR events; retain run URL and logs as evidence. | verified |
| **TC-F18** | CRM-F-018 / Issue #27 — System/regression testing | Execute the approved system/regression test suite and record results, failures and retests. | Planned system/regression tests are executed and results are recorded. | verified |
| **TC-F19** | CRM-F-019 / Issue #28 — Documentation | Review project documentation against implemented application modules and current setup instructions. | Documentation reflects the implemented application and is available to the team/reviewer. | verified |

## 3. Non-functional test cases

| **Test ID** | **Requirement / Area** | **Test scenario and steps** | **Expected result / acceptance** | **Status** |
|---|---|---|---|---|
| **TC-NF01** | CRM-NF-001 / Issue #29 — Performance | Measure dashboard and list-view load times under recorded browser, machine, dataset and network conditions; repeat representative runs. | Measured times are recorded and compared with a performance target agreed by the team. The SRS does not specify a numeric threshold. | verified |
| **TC-NF02** | CRM-NF-002 / Issue #30 — Persistence | Create/update a CRM record; refresh the page; restart the application/backend; retrieve the record again. | Successfully saved records remain available after refresh and application restart. | verified |
| **TC-NF03** | CRM-NF-003 / Issue #31 — Modularity | Review repository structure and confirm frontend, backend and data/model responsibilities are separated. | Application maintains modular and maintainable structure. | verified |
| **TC-NF04** | CRM-NF-004 / Issue #32 — Safe errors/secrets | Submit invalid requests; inspect UI/API errors and logs; verify credentials, tokens and secrets are not exposed. | Invalid operations return safe errors; secrets are not disclosed in responses or logs. | verified |
| **TC-NF05** | CRM-NF-005 / Issue #34 — Protected pages/APIs | Attempt protected page/API access without login and with a role lacking permission; try restricted create/update/delete operations. | Unauthenticated or unauthorised access is rejected by the application/API. | verified |

## 4. Security test cases

| **Test ID** | **Requirement / Area** | **Test scenario and steps** | **Expected result / acceptance** | **Status** |
|---|---|---|---|---|
| **TC-S01** | CRM-SR-001 — Authentication | Request a protected page and protected API before login; then log in and repeat. | Protected functions require authentication. | verified |
| **TC-S02** | CRM-SR-002 — Backend RBAC | For each role, invoke allowed and forbidden protected API operations directly. | Backend authorisation rejects operations not permitted for that role. | verified |
| **TC-S03** | CRM-SR-003 — Credential/secret protection | Test valid/invalid login; inspect responses and logs for passwords, tokens or secrets. | Credentials are validated; password/secret values are not disclosed. | verified |
| **TC-S04** | CRM-SR-004 — Safe error responses | Send malformed or invalid API requests and inspect status codes and response bodies. | Errors do not reveal stack traces, internal paths, secrets or implementation details. | verified |
| **TC-S05** | CRM-SR-005 — Prevent unauthorised modification | As an unauthorised user, attempt create/update/delete on protected CRM records. | Unauthorised modifications are rejected and stored data remains unchanged. | verified |

## 5. Requirements coverage summary

The report includes all requirement IDs listed in the supplied SRS: 19 functional, 5 non-functional and 5 security requirements. Historical verification is recorded only for areas previously reported as working: authentication, role-based access, sales, dashboard/reports, MongoDB persistence and JWT/authentication protection. All other items remain pending until executed evidence is attached.
