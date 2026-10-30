# Team12 CRM — Customer Relationship Management System

A web-based Customer Relationship Management (CRM) application developed by **Team 12** to support customer information management, staff access control, feedback collection, and customer-retention activities.

The project uses a React + TypeScript frontend and an Express + MongoDB backend. It includes authenticated staff access, role-based permissions, and API endpoints for the currently integrated CRM features.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Repository Structure](#repository-structure)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Environment Configuration](#environment-configuration)
- [Admin Account Setup](#admin-account-setup)
- [Running the Application](#running-the-application)
- [API Overview](#api-overview)
- [Authentication and Security](#authentication-and-security)
- [Testing](#testing)
- [Project Documentation](#project-documentation)
- [Troubleshooting](#troubleshooting)
- [Contributors](#contributors)

---

## Project Overview

The Team12 CRM project is designed to provide a central application for managing customer-related activities and supporting interactions between an organisation and its customers.

The current application includes:

- A staff login flow.
- An authenticated dashboard.
- Administrative staff-account management.
- Customer information APIs.
- Feedback management.
- Customer-retention activity APIs.
- Backend health-check functionality.

The repository also contains additional CRM modules and supporting documentation from the wider project. Some modules are present as earlier or separately developed code and are not necessarily exposed by the currently mounted API. Refer to the [Architecture](#architecture) and [API Overview](#api-overview) sections for the currently integrated scope.

## Features

### 1. Authentication and access control

- Staff login using email and password.
- Authenticated session using a JWT.
- Token-based API requests using the Bearer authorization scheme.
- Authenticated user lookup and logout.
- No public self-registration flow in the current frontend.

### 2. Staff management

Administrators can manage staff accounts through the application.

- Create staff accounts.
- View staff accounts.
- Edit staff details.
- Deactivate staff accounts.
- Assign supported roles.

Supported roles in the current application:

- **Admin**
- **Sales Staff**
- **Support Staff**

Administrative actions are protected by backend authorization checks.

### 3. Customer management

The backend includes customer model and API functionality for storing and retrieving customer information.

### 4. Feedback management

The application includes a feedback screen and backend endpoints for feedback-related operations.

### 5. Customer retention

The application includes a retention screen and backend support for retention activities.

### 6. Dashboard and system health

- Authenticated dashboard interface.
- Backend health endpoint.
- Database connection status included in the health response.

---

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, TypeScript, Vite |
| Backend | Node.js, Express.js |
| Database | MongoDB |
| ODM | Mongoose |
| Authentication | JSON Web Tokens (JWT) |
| Security middleware | Helmet, CORS, express-rate-limit |
| Testing | Tests and integration-test files under the backend test directories |

---

## Repository Structure

```text
Team12/
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   └── ...
│   ├── .env.example
│   └── ...
│
├── backend/
│   ├── src/
│   │   ├── app.js
│   │   ├── server.js
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   └── scripts/
│   ├── test/
│   ├── tests/
│   ├── .env.example
│   └── ...
│
├── docs/
├── CRM_SRS (1).docx
├── CRM_Software_Architecture_and_Design_Specification.docx
├── CRM_Software_Test_Plan.docx
└── README.md
```

> The repository may contain additional files and older or separately developed modules. The structure above highlights the main application areas.

---

## Architecture

The project follows a frontend/backend architecture:

```text
┌──────────────────────────────┐
│       React Frontend         │
│      TypeScript + Vite       │
│                              │
│ Login | Dashboard | Admin    │
│ Feedback | Retention         │
└──────────────┬───────────────┘
               │ HTTP / JSON
               │ Bearer JWT
               ▼
┌──────────────────────────────┐
│       Express Backend        │
│                              │
│ Authentication middleware    │
│ Route handlers               │
│ Validation and error handling│
└──────────────┬───────────────┘
               │ Mongoose
               ▼
┌──────────────────────────────┐
│           MongoDB            │
│ Users | Customers | Feedback │
│ Retention Activities | Logs  │
└──────────────────────────────┘
```

### Backend API modules currently mounted

The active Express application registers the following API groups:

- `/api/auth`
- `/api/users`
- `/api/customers`
- `/api/feedback`
- `/api/retention`
- `/api/health`

Additional route and model files exist elsewhere in the backend repository. Their presence does not necessarily mean they are currently mounted or reachable through the running application.

---

## Getting Started

### Prerequisites

Install the following before running the project:

- **Node.js** (use a current LTS release).
- **npm** (included with Node.js).
- **MongoDB Community Server** or an accessible MongoDB instance.
- **Git**.

Verify your installations:

```bash
node --version
npm --version
mongod --version
git --version
```

### 1. Clone the repository

```bash
git clone https://github.com/Shweta1810/Team12.git
cd Team12
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Configure backend environment variables

Create a `.env` file inside the `backend/` directory by copying the example:

**Windows PowerShell**
```powershell
Copy-Item .env.example .env
```

**macOS / Linux**
```bash
cp .env.example .env
```

Edit `backend/.env` and provide the required values. See [Environment Configuration](#environment-configuration).

### 4. Install frontend dependencies

Open a second terminal from the repository root:

```bash
cd frontend
npm install
```

Create the frontend environment file:

**Windows PowerShell**
```powershell
Copy-Item .env.example .env
```

**macOS / Linux**
```bash
cp .env.example .env
```

The default frontend API URL is:

```env
VITE_API_URL=http://localhost:4000
```

---

## Environment Configuration

### Backend — `backend/.env`

Use the following as a reference:

```env
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/team12_crm
JWT_SECRET=replace_with_a_long_random_secret_at_least_32_characters
JWT_EXPIRES_IN=30m
CLIENT_ORIGIN=http://localhost:5173
ADMIN_NAME=CRM Administrator
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=replace_with_a_strong_admin_password
```

| Variable | Purpose |
|---|---|
| `PORT` | Port used by the backend server. Defaults to `4000` in the example. |
| `MONGODB_URI` | MongoDB connection string. |
| `JWT_SECRET` | Secret used to sign JWTs. The server requires at least 32 characters. |
| `JWT_EXPIRES_IN` | JWT expiration duration. |
| `CLIENT_ORIGIN` | Allowed frontend origin for CORS. |
| `ADMIN_NAME` | Admin display name used by the admin setup script. |
| `ADMIN_EMAIL` | Email address used by the admin setup script. |
| `ADMIN_PASSWORD` | Password used by the admin setup script. |

**Important:** Generate a unique, unpredictable JWT secret for your local or deployed environment. Never commit `.env` files, database credentials, passwords, or real secrets to Git.

### Frontend — `frontend/.env`

```env
VITE_API_URL=http://localhost:4000
```

Vite exposes variables prefixed with `VITE_` to frontend code. Do not put private credentials or server-side secrets in frontend environment variables.

---

## Admin Account Setup

The backend includes an admin seed/setup script at:

```text
backend/src/scripts/seedAdmin.js
```

The script uses `MONGODB_URI`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` from the backend environment.

Before running it:

1. Make sure MongoDB is running and `MONGODB_URI` is correct.
2. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `backend/.env`.
3. Use a strong password with at least 12 characters and no more than 72 UTF-8 bytes.
4. Check the scripts section of `backend/package.json` for the exact command configured to run the seed script.

**Important behaviour:** The current seed script updates the password for an existing admin account; it does not create an admin account if one cannot be found. Follow the project's documented/admin-provisioning process if the account does not already exist.

---

## Running the Application

Start MongoDB first.

Then start the backend and frontend in separate terminals, using the development scripts defined in their respective `package.json` files.

Typical Vite frontend development command:

```bash
cd frontend
npm run dev
```

For the backend, inspect `backend/package.json` and use its configured development or start script. The backend server entry point is:

```text
backend/src/server.js
```

The backend defaults to port `4000` when configured accordingly, and the frontend example points to `http://localhost:4000`.

Once both services are running, open the local URL printed by Vite in your browser. Sign in with an administrator or staff account provisioned for your local database.

---

## API Overview

The currently mounted API groups are:

| Base path | Purpose |
|---|---|
| `/api/auth` | Login, current-user/session and logout operations. |
| `/api/users` | Staff account management and user-related operations. |
| `/api/customers` | Customer-related operations. |
| `/api/feedback` | Feedback-related operations. |
| `/api/retention` | Customer-retention activity operations. |
| `/api/health` | Backend and database health information. |

The exact HTTP methods, request bodies, response formats, and authorization requirements are defined in the route files under `backend/src/routes/`. Check those files before integrating another client with the API.

### Authenticated requests

For protected endpoints, include the JWT in the request header:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

Do not hard-code real tokens in source code or commit them to the repository.

### Health check

The backend exposes:

```text
GET /api/health
```

Use this endpoint to check whether the API is responding and to inspect the database status reported by the application.

---

## Authentication and Security

The backend includes several security controls:

- JWT-based authentication.
- Authentication and authorization middleware for protected routes.
- Password hashing through the backend authentication implementation.
- Helmet security headers.
- CORS configuration using `CLIENT_ORIGIN`.
- Login rate limiting (10 attempts per 15 minutes in the current application configuration).
- JSON request-body size limit of 20 KB.
- Backend validation for important account and request fields.

### Security checklist

Before publishing or deploying the project:

- Keep `.env` files out of version control.
- Commit `.env.example` files with placeholder values only.
- Use a strong, unique `JWT_SECRET` of at least 32 characters.
- Never publish real passwords, tokens, API keys, or database credentials.
- Use HTTPS in production.
- Restrict CORS to the actual production frontend origin.
- Use a dedicated production MongoDB user with only the permissions it needs.
- Review logs and error responses to ensure sensitive information is not exposed.

---

## Testing

The backend repository contains test files under:

```text
backend/test/
backend/tests/
```

The test coverage includes areas such as authentication, middleware, customer and lead workflows, engagement, conversion, and assignment behaviour.

To identify the exact available test commands, inspect the scripts defined in:

```text
backend/package.json
frontend/package.json
```

Run the project's configured test scripts from the corresponding directory. Ensure the required test environment variables and database configuration are available before running integration tests.

---

## Project Documentation

The repository includes supporting project documents:

- **Software Requirements Specification (SRS)** — project requirements and expected system behaviour.
- **Software Architecture and Design Specification** — system structure and design.
- **Software Test Plan** — planned testing approach and test coverage.
- **Test reports** — supporting reports for implemented features, where available.

These documents provide additional detail beyond this README.

---

## Troubleshooting

### Backend cannot connect to MongoDB

- Confirm that MongoDB is installed and running.
- Check the `MONGODB_URI` value in `backend/.env`.
- Confirm the database host and port are reachable.
- Review the backend terminal for the connection error.

### Frontend cannot reach the backend

- Confirm the backend is running.
- Check `VITE_API_URL` in `frontend/.env`.
- Confirm `CLIENT_ORIGIN` in `backend/.env` matches the frontend origin.
- Restart the Vite development server after changing environment variables.

### JWT secret configuration error

The backend requires `JWT_SECRET` to be at least 32 characters long. Set a strong value in `backend/.env` and restart the backend.

### Login does not work

- Confirm that an administrator or staff account exists in the database.
- Verify the email and password.
- Check the backend logs and browser network response.
- Confirm the frontend is calling the correct backend URL.
- Remember that the current application does not provide public self-registration.

---

## Contributors

**Team 12** — Customer Relationship Management System

Add or update contributor names and individual responsibilities here before the final project submission.

---

## Disclaimer

This project is an academic software project. Features and API availability should be verified against the current source code before production use. The presence of a module in the repository does not imply that it is fully integrated into the active application.

