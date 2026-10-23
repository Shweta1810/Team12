# CRM Application

This repository contains the CRM frontend and backend source code.

## Project structure

- `frontend/` — React, TypeScript, and Vite user interface
- `backend/` — Node.js, Express, and Mongoose API
- `backend/models/` — MongoDB/Mongoose data models
- `backend/routes/` — API route handlers
- `backend/middleware/` — shared backend middleware

## Prerequisites

Install a supported Node.js version and make a MongoDB database available. The backend reads its connection string and JWT secret from environment variables.

## Setup

### 1. Backend

Open a terminal in `backend/` and run:

```bash
npm install
```

Copy `.env.example` to `.env`, then edit `.env` with your own local configuration. Do not commit `.env`.

Start the backend with:

```bash
node server.js
```

The API uses port `5000` by default.

### 2. Frontend

Open another terminal in `frontend/` and run:

```bash
npm install
npm run dev
```

Use the local URL printed by Vite in the terminal.

## Team Git workflow

1. Clone the repository.
2. Create a separate feature branch for your assigned task.
3. Commit and push your changes to that branch.
4. Open a pull request into `main` for review.

Do not commit passwords, database credentials, JWT secrets, or real user data.
