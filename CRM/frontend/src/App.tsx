import { useState } from "react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Leads from "./pages/Leads";
import Customers from "./pages/Customers";
import UserManagement from "./pages/UserManagement";
import DeletionRequests from "./pages/DeletionRequests";
import Interactions from "./pages/Interactions";
import FollowUps from "./pages/FollowUps";
import Feedback from "./pages/Feedback";
import Retention from "./pages/Retention";
import Loyalty from "./pages/Loyalty";
import Reports from "./pages/Reports";
import Sales from "./pages/Sales";
import Support from "./pages/Support";

interface User {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Sales Staff" | "Support Staff";
}

function App() {
  const storedUser = sessionStorage.getItem("user");
  const storedToken = sessionStorage.getItem("token");

  const [user, setUser] = useState<User | null>(() => {
    if (!storedUser) return null;

    try {
      return JSON.parse(storedUser) as User;
    } catch {
      return null;
    }
  });

  const [loggedIn, setLoggedIn] = useState(
    Boolean(storedToken && storedUser)
  );

  const [currentPage, setCurrentPage] = useState("dashboard");

  const handleLogin = (loggedInUser: User) => {
    const token =
      sessionStorage.getItem("token") ||
      localStorage.getItem("token");

    sessionStorage.setItem("user", JSON.stringify(loggedInUser));

    if (token) {
      sessionStorage.setItem("token", token);
    }

    setUser(loggedInUser);
    setLoggedIn(Boolean(token));
    setCurrentPage("dashboard");
  };

  const goToDashboard = () => {
    setCurrentPage("dashboard");
  };

  // Pages permitted for Support Staff
  const supportStaffPages = [
    "dashboard",
    "customers",
    "followups",
    "feedback",
    "retention",
    "loyalty",
    "sales",
    "support",
  ];

  // Check whether the logged-in user can access a page
  const canAccessPage = (page: string) => {
    if (user?.role !== "Support Staff") {
      return true;
    }

    return supportStaffPages.includes(page);
  };

  // Redirect unauthorized users to Dashboard
  const navigateToPage = (page: string) => {
    if (!canAccessPage(page)) {
      setCurrentPage("dashboard");
      return;
    }

    setCurrentPage(page);
  };

  if (!loggedIn || !user) {
    return <Login onLogin={handleLogin} />;
  }

  // Prevent unauthorized page access
  if (!canAccessPage(currentPage)) {
    return (
      <Dashboard
        user={user}
        onNavigate={navigateToPage}
      />
    );
  }

  if (currentPage === "deletion-requests") {
    if (user.role !== "Admin") {
      return (
        <Dashboard
          user={user}
          onNavigate={navigateToPage}
        />
      );
    }

    return <DeletionRequests onBack={goToDashboard} />;
  }

  if (currentPage === "user-management") {
    if (user.role !== "Admin") {
      return (
        <Dashboard
          user={user}
          onNavigate={navigateToPage}
        />
      );
    }

    return <UserManagement onBack={goToDashboard} />;
  }

  if (currentPage === "support") {
    return (
      <Support
        onBack={goToDashboard}
        onNavigate={navigateToPage}
      />
    );
  }

  if (currentPage === "leads") {
    return <Leads onBack={goToDashboard} />;
  }

  if (currentPage === "customers") {
    return <Customers onBack={goToDashboard} />;
  }

  if (currentPage === "interactions") {
    return <Interactions onBack={goToDashboard} />;
  }

  if (currentPage === "followups") {
    return <FollowUps onBack={goToDashboard} />;
  }

  if (currentPage === "feedback") {
    return <Feedback onBack={goToDashboard} />;
  }

  if (currentPage === "retention") {
    return <Retention onBack={goToDashboard} />;
  }

  if (currentPage === "loyalty") {
    return <Loyalty onBack={goToDashboard} />;
  }

  if (currentPage === "reports") {
    return <Reports onBack={goToDashboard} />;
  }

  if (currentPage === "sales") {
    return <Sales onBack={goToDashboard} />;
  }

  return (
    <Dashboard
      user={user}
      onNavigate={navigateToPage}
    />
  );
}

export default App;
