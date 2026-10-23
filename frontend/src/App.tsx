import { useState } from "react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Leads from "./pages/Leads";
import Customers from "./pages/Customers";
import UserManagement from "./pages/UserManagement";
import Interactions from "./pages/Interactions";
import FollowUps from "./pages/FollowUps";
import Feedback from "./pages/Feedback";
import Retention from "./pages/Retention";
import Loyalty from "./pages/Loyalty";
import Reports from "./pages/Reports";
import Sales from "./pages/Sales";

interface User {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Sales Staff" | "Support Staff";
}

function App() {
  const storedUser = sessionStorage.getItem("user");
  const storedToken = sessionStorage.getItem("token");

  const [user, setUser] = useState<User | null>(
    storedUser ? JSON.parse(storedUser) : null
  );

  const [loggedIn, setLoggedIn] = useState(
    Boolean(storedToken && storedUser)
  );

  const [currentPage, setCurrentPage] = useState("dashboard");

  const handleLogin = (loggedInUser: User) => {
    const token =
      localStorage.getItem("token");

    sessionStorage.setItem(
      "user",
      JSON.stringify(loggedInUser)
    );

    /*
     * Keep the token in localStorage as well because
     * the existing CRM pages use localStorage to send
     * the Authorization header.
     *
     * sessionStorage controls whether the application
     * remains logged in after a page refresh.
     */
    if (token) {
      sessionStorage.setItem("token", token);
    }

    setUser(loggedInUser);
    setLoggedIn(true);
    setCurrentPage("dashboard");
  };

  if (!loggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  if (currentPage === "leads") {
    return (
      <div className="min-h-screen bg-slate-50">
        <Leads
          onBack={() =>
            setCurrentPage("dashboard")
          }
        />
      </div>
    );
  }

  if (currentPage === "customers") {
    return (
      <div className="min-h-screen bg-slate-50">
        <Customers
          onBack={() =>
            setCurrentPage("dashboard")
          }
        />
      </div>
    );
  }

  if (currentPage === "user-management") {
    return (
      <div className="min-h-screen bg-slate-50">
        <UserManagement
          onBack={() =>
            setCurrentPage("dashboard")
          }
        />
      </div>
    );
  }

  if (currentPage === "interactions") {
    return (
      <div className="min-h-screen bg-slate-50">
        <Interactions
          onBack={() =>
            setCurrentPage("dashboard")
          }
        />
      </div>
    );
  }

  if (currentPage === "followups") {
    return (
      <div className="min-h-screen bg-slate-50">
        <FollowUps
          onBack={() =>
            setCurrentPage("dashboard")
          }
        />
      </div>
    );
  }

  if (currentPage === "feedback") {
    return (
      <div className="min-h-screen bg-slate-50">
        <Feedback
          onBack={() =>
            setCurrentPage("dashboard")
          }
        />
      </div>
    );
  }

  if (currentPage === "retention") {
    return (
      <div className="min-h-screen bg-slate-50">
        <Retention
          onBack={() =>
            setCurrentPage("dashboard")
          }
        />
      </div>
    );
  }

  if (currentPage === "loyalty") {
    return (
      <div className="min-h-screen bg-slate-50">
        <Loyalty
          onBack={() =>
            setCurrentPage("dashboard")
          }
        />
      </div>
    );
  }

  if (currentPage === "reports") {
    return (
      <div className="min-h-screen bg-slate-50">
        <Reports
          onBack={() =>
            setCurrentPage("dashboard")
          }
        />
      </div>
    );
  }

  if (currentPage === "sales") {
    return (
      <div className="min-h-screen bg-slate-50">
        <Sales
          onBack={() =>
            setCurrentPage("dashboard")
          }
        />
      </div>
    );
  }

  return (
    <Dashboard
      user={user}
      onNavigate={setCurrentPage}
    />
  );
}

export default App;