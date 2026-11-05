# CRM – Customer Relationship Management System

## 1. Project Overview

The Customer Relationship Management (CRM) System is a web-based application developed to help organisations manage customer information, staff activities, sales, leads, customer interactions, feedback, and customer-retention activities in one centralised platform.

The system provides different levels of access to three types of users: Admin, Sales Staff, and Support Staff. Each role has specific permissions to ensure that users can access only the features relevant to their responsibilities.

The application is developed using React, TypeScript, Node.js, Express.js, and MongoDB.

---

## 2. Main Features

### 2.1 User Authentication

* Secure login using email and password.
* Password hashing using bcrypt.
* JWT-based authentication.
* Token verification for protected routes.
* Automatic rejection of invalid or expired tokens.
* Logout functionality.
* Prevention of inactive users from accessing the application.

### 2.2 Staff Management

* Admin can create and manage staff accounts.
* View staff details.
* Edit staff information.
* Assign roles to staff members.
* Activate and deactivate staff accounts.
* Role-based access control.

### 2.3 Customer Management

* Add, view, and manage customer records.
* Store customer name, email, phone number, source, status, assigned staff member, and notes.
* Assign customers to Sales Staff.
* Sales Staff can access their assigned customers.
* Support Staff can view customer information according to their permissions.
* Input validation for customer details.
* Phone number validation to ensure correct input.
* Customer deletion request functionality for staff members who do not have direct deletion permission.

### 2.4 Lead Management

* Add and manage potential customers.
* Track lead information and status.
* Assign leads to staff members.
* Maintain lead details and notes.
* Track the progress of leads through the sales process.

### 2.5 Sales Management

* Record sales transactions.
* Associate sales with customers and salespersons.
* Maintain product or service information.
* Record quantity and sales amount.
* Track payment status.
* Maintain sales records for reporting.

### 2.6 Customer Interaction Tracking

* Record interactions with customers.
* Maintain communication history.
* Track customer-related activities.
* Help staff maintain a history of customer interactions.

### 2.7 Follow-up Management

* Create customer follow-up records.
* Maintain follow-up dates and details.
* Track pending and completed follow-up activities.
* Help staff maintain regular communication with customers.

### 2.8 Feedback Management

* Record customer feedback.
* Maintain feedback information.
* Track customer satisfaction-related information.
* Support better customer relationship management.

### 2.9 Customer Retention

* Maintain customer-retention activities.
* Track customer-related retention information.
* Support activities intended to improve customer relationships.

### 2.10 Loyalty Management

* Maintain customer loyalty accounts.
* Track loyalty points.
* Manage loyalty tiers.
* Record points earned and redeemed.

### 2.11 Dashboard and Reports

* Display important CRM information through dashboard views.
* Provide summaries of customers, leads, and sales.
* Display business-related statistics.
* Support reporting and monitoring of CRM activities.

### 2.12 Audit Logging

* Record important activities performed within the CRM.
* Maintain information about the user who performed an action.
* Store activity details and timestamps.
* Allow authorised administrators to review recorded activities.

### 2.13 Customer Deletion Requests

* Allow staff to submit customer deletion requests.
* Require a reason for deletion where configured.
* Allow Admin to review deletion requests.
* Support approval and rejection of requests.
* Maintain the status of deletion requests.

---

## 3. User Roles and Permissions

The CRM application supports three main roles.

| Role          | Responsibilities                                                                                                           |
| ------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Admin         | Manages staff accounts, assigns customers, monitors activities, reviews audit logs, and manages administrative operations. |
| Sales Staff   | Manages assigned customers, handles leads, records sales, and performs permitted customer-related activities.              |
| Support Staff | Views customer information and performs permitted support-related activities.                                              |

Role-based access control ensures that users can access only the features permitted for their assigned role.

---

## 4. Technology Stack

| Component            | Technology              |
| -------------------- | ----------------------- |
| Frontend             | React.js                |
| Programming Language | TypeScript / JavaScript |
| Styling              | Tailwind CSS            |
| Backend              | Node.js                 |
| Backend Framework    | Express.js              |
| Database             | MongoDB                 |
| ODM                  | Mongoose                |
| Authentication       | JSON Web Token (JWT)    |
| Password Security    | bcrypt / bcryptjs       |
| API Communication    | REST APIs               |

---

## 5. Project Architecture

The application follows a frontend-backend architecture.

### Frontend

The frontend provides the user interface for login, dashboards, customer management, staff management, sales, leads, reports, and other CRM functionalities.

### Backend

The backend handles authentication, authorization, business logic, validation, database operations, and API requests.

### Database

MongoDB stores application information, including user accounts, customers, leads, sales, interactions, feedback, follow-ups, and other CRM records.

### Architecture Diagram

```text
        ┌─────────────────────────────┐
        │       React Frontend        │
        │                             │
        │ Login                       │
        │ Dashboard                   │
        │ Customer Management         │
        │ Staff Management            │
        │ Lead Management             │
        │ Sales Management             │
        │ Reports and Audit Logs      │
        └──────────────┬──────────────┘
                       │
                       │ REST API
                       │ HTTP / JSON
                       ▼
        ┌─────────────────────────────┐
        │      Node.js Backend       │
        │        Express.js          │
        │                             │
        │ Authentication             │
        │ Authorization              │
        │ API Routes                 │
        │ Business Logic             │
        │ Validation                 │
        │ Audit Logging              │
        └──────────────┬──────────────┘
                       │
                       │ Mongoose
                       ▼
        ┌─────────────────────────────┐
        │          MongoDB            │
        │                             │
        │ Users                       │
        │ Customers                   │
        │ Leads                       │
        │ Sales                       │
        │ Interactions                │
        │ Feedback                    │
        │ Follow-ups                  │
        │ Retention                   │
        │ Loyalty                     │
        │ Audit Logs                  │
        └─────────────────────────────┘
```

---

## 6. Project Structure

The project is organised into frontend and backend directories.

```text
CRM/
│
├── backend/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── utils/
│   ├── server.js
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
│
├── README.md
└── ...
```

The backend contains database models, API routes, authentication middleware, and server configuration.

The frontend contains React components, pages, styling, and API integration.

---

## 7. Prerequisites

Before running the application, install:

* Node.js
* npm
* MongoDB Community Server
* Visual Studio Code

Verify Node.js and npm installation:

```bash
node --version
npm --version
```

---

## 8. Installation and Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/Shweta1810/Team12.git
```

Navigate into the project directory:

```bash
cd Team12
```

### Step 2: Install Backend Dependencies

```bash
cd backend
npm install
```

### Step 3: Configure Backend Environment Variables

Create a `.env` file inside the backend directory.

Example configuration:

```env
MONGO_URI=mongodb://127.0.0.1:27017/crm
PORT=5000
JWT_SECRET=replace_with_a_long_random_secret
```

**Note:** Environment variable names must match those used in the actual backend source code. If the cloned version uses `MONGODB_URI` instead of `MONGO_URI`, configure it accordingly.

Never upload actual passwords, database credentials, or JWT secrets to GitHub.

### Step 4: Install Frontend Dependencies

Open another terminal and navigate to the frontend directory:

```bash
cd frontend
npm install
```

If the frontend requires an API URL environment variable, configure it according to the frontend source code.

Example:

```env
VITE_API_URL=http://localhost:5000
```

---

## 9. Running the Application

### Start MongoDB

Ensure that MongoDB is running before starting the backend.

### Start the Backend

Open a terminal inside the backend directory:

```bash
node server.js
```

The backend should connect to MongoDB and start on the configured port.

### Start the Frontend

Open another terminal inside the frontend directory:

```bash
npm run dev
```

Vite will display the local frontend address.

Open that address in your browser to access the CRM application.

---

## 10. Database Configuration

The application uses MongoDB for storing CRM information.

Example local MongoDB connection:

```text
mongodb://127.0.0.1:27017/crm
```

The database name can be changed according to the environment configuration.

MongoDB creates the database and collections when the application first successfully inserts data.

Changing the database name does not automatically transfer records from another database.

---

## 11. Security Features

The CRM application includes security-related features such as:

* Password hashing using bcrypt.
* JWT-based authentication.
* Protected backend routes.
* Role-based authorization.
* Input validation.
* Safe error messages.
* Environment-variable-based secret configuration.
* Authentication checks for inactive accounts.
* Audit logging of selected application activities.

### Security Best Practices

* Never commit `.env` files to GitHub.
* Use strong and unique JWT secrets.
* Do not store passwords in plain text.
* Protect sensitive API routes.
* Validate user input on the backend.
* Avoid exposing internal server errors to users.

---

## 12. Testing and Verification

The following areas should be tested before considering the application ready.

| Test Area                 | Expected Result                                                        |
| ------------------------- | ---------------------------------------------------------------------- |
| User Login                | Valid users can log in successfully.                                   |
| Invalid Login             | Incorrect credentials are rejected.                                    |
| Authentication            | Protected routes reject unauthenticated requests.                      |
| Admin Permissions         | Admin can access administrative features.                              |
| Sales Staff Permissions   | Sales Staff can access assigned customer information.                  |
| Support Staff Permissions | Support Staff can access permitted customer information.               |
| Customer Management       | Customer records can be created and retrieved.                         |
| Input Validation          | Invalid information is rejected with clear messages.                   |
| Sales Management          | Sales records can be maintained.                                       |
| Audit Logging             | Supported activities are recorded.                                     |
| Database Persistence      | Records remain available after restarting the application.             |
| Responsive UI             | Pages remain usable on different screen sizes.                         |
| Error Handling            | Users receive clear error messages without internal technical details. |

Testing results should be recorded with actual observations and screenshots.

---

## 13. Project Documentation

The project includes supporting software engineering documentation:

* Software Requirements Specification (SRS).
* Software Architecture and Design Specification.
* Software Test Plan.
* Test reports and supporting evidence.

These documents describe the system requirements, architecture, design decisions, and testing activities.

---

## 14. Contributors

**Team 12**

Customer Relationship Management System

---

## 15. Conclusion

The CRM application provides a centralised platform for managing customer relationships and business activities. It supports multiple staff roles, customer management, lead tracking, sales management, feedback, retention, loyalty, reporting, and audit logging.

The system combines a React-based frontend, an Express backend, and MongoDB to provide a structured and role-based CRM solution.
