# CRM – Customer Relationship Management System

## 1. Project Overview

The **Customer Relationship Management (CRM) System** is a web-based application designed to help organizations manage customer relationships, sales activities, customer interactions, and support operations through a centralized platform.

The application provides role-based access for administrators, sales staff, and support staff. It helps streamline customer management, track sales performance, manage follow-ups, handle customer feedback, and improve customer retention.

The system is developed using React, TypeScript, Node.js, Express.js, and MongoDB.

---

## 2. Key Features

### Customer Management
- Add and manage customer records.
- View customer details and contact information.
- Assign customers to Sales Staff.
- Manage customer information based on user permissions.

### Lead Management
- Create and manage potential customer leads.
- Track lead status and progress.
- Assign leads to Sales Staff.
- Manage lead conversion into customers.

### Sales Management
- Record customer sales transactions.
- Track product or service details.
- Monitor sales amounts and payment status.
- Update payment records.

### Follow-up Management
- Schedule customer follow-ups.
- Track scheduled, completed, and overdue follow-ups.
- Complete or reschedule follow-up activities.

### Customer Interactions
- Record customer calls, emails, meetings, and other interactions.
- Maintain customer communication history.

### Feedback and Issue Management
- Record customer feedback, complaints, and issues.
- Set priority levels.
- Track issue status from Open to Resolved or Closed.

### Customer Retention
- Record customer retention activities.
- Manage customer engagement activities.
- Track retention-related actions.

### Loyalty Management
- Maintain customer loyalty accounts.
- Allocate and redeem loyalty points.
- Manage customer loyalty tiers.

### Reports and Dashboard
- Display important CRM statistics.
- Monitor customers, leads, sales, and follow-ups.
- Provide an overview of CRM activities.

### User Management
- Create and manage staff accounts.
- Assign roles to users.
- Link Support Staff with their responsible Sales Staff member.

### Customer Deletion Requests
- Allow Sales Staff to submit customer deletion requests.
- Allow administrators to review and approve or reject requests.

### Audit Logging
- Maintain records of important system activities for accountability.

---

## 3. User Roles and Permissions

The application supports three user roles.

| Feature | Admin | Sales Staff | Support Staff |
|---|---|---|---|
| Dashboard | Full access | Own data | Assigned data |
| Leads | Yes | Yes | No |
| Customers | All customers | Assigned customers | Customers of linked Sales Staff |
| Interactions | Yes | Yes | No |
| Follow-ups | Yes | Yes | Yes |
| Sales and Payments | Yes | Yes | Yes |
| Feedback and Issues | Yes | Yes | Yes |
| Retention | Yes | Yes | Yes |
| Loyalty | Yes | Yes | Yes |
| Reports | Yes | Yes | No |
| User Management | Yes | No | No |
| Deletion Requests | Yes | Submit requests | No |

**Admin:** Has administrative access to manage users, customers, sales, reports, and other CRM operations.

**Sales Staff:** Manages assigned leads and customers, records sales, and handles customer-related activities.

**Support Staff:** Works with customers assigned to their linked Sales Staff member and manages permitted support and customer engagement activities.

---

## 4. Technology Stack

### Frontend
- React.js
- TypeScript
- Tailwind CSS
- Lucide React
- Vite

### Backend
- Node.js
- Express.js
- JavaScript
- REST APIs

### Database
- MongoDB
- Mongoose ODM

### Authentication and Security
- JSON Web Tokens (JWT)
- bcrypt password hashing
- Role-based access control
- Protected API routes

### Development Tools
- Visual Studio Code
- Git and GitHub
- Postman

---

## 5. Project Structure

```text
CRM/
│
├── backend/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── .env.example
│   ├── package.json
│   ├── package-lock.json
│   ├── server.js
│   └── createAdmin.js
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── package-lock.json
│   └── vite.config.ts
│
├── docs/
│
└── README.md
```

---

## 6. Installation and Setup

### Prerequisites

Install the following before running the application:

- Node.js and npm
- MongoDB
- Visual Studio Code
- Git

### Step 1: Clone the Repository

```bash
git clone https://github.com/Shweta1810/Team12.git
```

Navigate to the project directory:

```bash
cd Team12/CRM
```

### Step 2: Backend Setup

Navigate to the backend folder:

```bash
cd backend
```

Install the dependencies:

```bash
npm install
```

Create a `.env` file using the provided `.env.example` file.

Configure the environment variables:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/team12_crm
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=30m
CLIENT_ORIGIN=http://localhost:5173
ADMIN_NAME=CRM Administrator
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_admin_password
```

**Note:** Use your actual secure credentials. Never upload your `.env` file to GitHub.

Start the backend server:

```bash
node server.js
```

### Step 3: Frontend Setup

Open another terminal and navigate to the frontend folder:

```bash
cd frontend
```

Install the dependencies:

```bash
npm install
```

Start the frontend development server:

```bash
npm run dev
```

### Step 4: Access the Application

Open your browser and navigate to:

```text
http://localhost:5173
```

The backend API runs at:

```text
http://localhost:5000
```

---

## 7. Database Configuration

The application uses MongoDB to store customer and CRM-related information.

Mongoose is used to define database schemas and interact with MongoDB.

The backend contains models for different CRM entities, including:

- User
- Customer
- Lead
- Sale
- Feedback
- Follow-up
- Retention Activity
- Loyalty Account
- Customer Deletion Request

---

## 8. Authentication and Authorization

The system uses JWT-based authentication to protect application routes and APIs.

After successful login:
- A JWT token is generated.
- Protected API requests require authentication.
- User roles determine access to different modules.
- Backend authorization ensures users can access only the records permitted for their roles.

Passwords are hashed using bcrypt before being stored in the database.

---

## 9. API Architecture

The backend follows a REST API architecture.

Major API route groups include:

| Route | Purpose |
|---|---|
| `/api/auth` | Authentication |
| `/api/users` | User management |
| `/api/leads` | Lead management |
| `/api/customers` | Customer management |
| `/api/interactions` | Customer interactions |
| `/api/followups` | Follow-up management |
| `/api/feedback` | Feedback and issue management |
| `/api/retention` | Customer retention |
| `/api/loyalty` | Loyalty management |
| `/api/sales` | Sales and payment records |
| `/api/reports` | CRM reports |
| `/api/audit-logs` | Audit activity records |

---

## 10. Future Enhancements

Potential future improvements include:

- Email and SMS notifications for scheduled follow-ups.
- Advanced sales analytics and visualization.
- Automated customer engagement recommendations.
- Improved reporting and export functionality.
- Cloud deployment and scalability improvements.
- Enhanced customer communication integrations.

---

## 11. Contributors

**Team 12**

This project was developed collaboratively as part of the Software Engineering project.

---

## 12. Repository

GitHub Repository:

https://github.com/Shweta1810/Team12

---

## License

This project is developed for academic and educational purposes.