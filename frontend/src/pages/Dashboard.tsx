import { useCallback, useEffect, useState } from "react";

import {
  LayoutDashboard,
  Users,
  MessageSquare,
  CalendarCheck,
  ShoppingCart,
  MessageCircle,
  Headphones,
  Gift,
  BarChart3,
  UserCog,
  LogOut,
  UserPlus,
  ArrowRight,
  Clock3,
  TrendingUp,
  HeartHandshake,
} from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Sales Staff" | "Support Staff";
}

interface DashboardProps {
  user: User | null;
  onNavigate: (page: string) => void;
}

function Dashboard({
  user,
  onNavigate,
}: DashboardProps) {
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    window.location.reload();
  };

  const [dashboardData, setDashboardData] = useState({
    totalLeads: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    totalFollowUps: 0,
  });

  const [dashboardLoading, setDashboardLoading] = useState(true);

  const token =
    sessionStorage.getItem("token") ||
    localStorage.getItem("token");

  const loadDashboardData = useCallback(async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/reports",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to load dashboard data.");
      }

      const data = await response.json();

      setDashboardData({
        totalLeads: data.summary?.totalLeads ?? 0,
        totalCustomers: data.summary?.totalCustomers ?? 0,
        totalRevenue: data.sales?.totalRevenue ?? 0,
        totalFollowUps: data.summary?.totalFollowUps ?? 0,
      });
    } catch (error) {
      console.error("Dashboard data error:", error);
    } finally {
      setDashboardLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDashboardData();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadDashboardData]);

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white md:flex">
        {/* Logo */}
        <div className="border-b border-slate-100 px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
              <Users size={21} />
            </div>

            <div>
              <h1 className="text-lg font-bold text-slate-900">
                CRM
              </h1>

              <p className="text-xs text-slate-500">
                Customer Relationship
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-5">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Main Menu
          </p>

          {/* Dashboard */}
          <button
            onClick={() => onNavigate("dashboard")}
            className="mb-1 flex w-full items-center gap-3 rounded-xl bg-blue-50 px-3 py-3 text-sm font-semibold text-blue-600 transition hover:-translate-y-0.5 hover:shadow-sm"
          >
            <LayoutDashboard size={19} />
            Dashboard
          </button>

          {/* Leads */}
          <button
            onClick={() => onNavigate("leads")}
            className="mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:-translate-y-0.5 hover:bg-slate-50 hover:text-blue-600 hover:shadow-sm"
          >
            <UserPlus size={19} />
            Leads
          </button>

          {/* Customers */}
          <button
            onClick={() => onNavigate("customers")}
            className="mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:-translate-y-0.5 hover:bg-slate-50 hover:text-blue-600 hover:shadow-sm"
          >
            <Users size={19} />
            Customers
          </button>

          {/* Interactions */}
          <button
            onClick={() => onNavigate("interactions")}
            className="mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:-translate-y-0.5 hover:bg-slate-50 hover:text-blue-600 hover:shadow-sm"
          >
            <MessageSquare size={19} />
            Interactions
          </button>

          {/* Follow-ups */}
          <button
            onClick={() => onNavigate("followups")}
            className="mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:-translate-y-0.5 hover:bg-slate-50 hover:text-blue-600 hover:shadow-sm"
          >
            <CalendarCheck size={19} />
            Follow-ups
          </button>

          {/* Sales */}
          <button
            onClick={() => onNavigate("sales")}
            className="mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:-translate-y-0.5 hover:bg-slate-50 hover:text-blue-600 hover:shadow-sm"
          >
            <ShoppingCart size={19} />
            Sales
          </button>

          {/* Feedback */}
          <button
            onClick={() => onNavigate("feedback")}
            className="mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:-translate-y-0.5 hover:bg-slate-50 hover:text-blue-600 hover:shadow-sm"
          >
            <MessageCircle size={19} />
            Feedback
          </button>

          {/* Retention */}
          <button
            onClick={() => onNavigate("retention")}
            className="mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:-translate-y-0.5 hover:bg-slate-50 hover:text-blue-600 hover:shadow-sm"
          >
            <HeartHandshake size={19} />
            Retention
          </button>

          {/* Support */}
          <button
            onClick={() => onNavigate("support")}
            className="mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:-translate-y-0.5 hover:bg-slate-50 hover:text-blue-600 hover:shadow-sm"
          >
            <Headphones size={19} />
            Support
          </button>

          {/* Loyalty */}
          <button
            onClick={() => onNavigate("loyalty")}
            className="mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:-translate-y-0.5 hover:bg-slate-50 hover:text-blue-600 hover:shadow-sm"
          >
            <Gift size={19} />
            Loyalty
          </button>

          {/* Reports */}
          <button
            onClick={() => onNavigate("reports")}
            className="mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:-translate-y-0.5 hover:bg-slate-50 hover:text-blue-600 hover:shadow-sm"
          >
            <BarChart3 size={19} />
            Reports
          </button>

          {/* Admin Only */}
          {user?.role === "Admin" && (
            <>
              <div className="my-5 border-t border-slate-100" />

              <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Administration
              </p>

              <button
                onClick={() =>
                  onNavigate("user-management")
                }
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:-translate-y-0.5 hover:bg-slate-50 hover:text-blue-600 hover:shadow-sm"
              >
                <UserCog size={19} />
                User Management
              </button>
            </>
          )}
        </nav>

        {/* User section */}
        <div className="border-t border-slate-100 p-4">
          <div className="mb-3 rounded-xl bg-slate-50 p-3">
            <p className="truncate text-sm font-semibold text-slate-800">
              {user?.name}
            </p>

            <p className="truncate text-xs text-slate-500">
              {user?.email}
            </p>

            <span className="mt-2 inline-block rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
              {user?.role}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-red-600 transition hover:-translate-y-0.5 hover:bg-red-50 hover:shadow-sm"
          >
            <LogOut size={19} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="min-w-0 flex-1">
        {/* Top Header */}
        <header className="border-b border-slate-200 bg-white px-6 py-5 md:px-8">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-medium text-blue-600">
                CRM Dashboard
              </p>

              <h2 className="mt-1 text-2xl font-bold text-slate-900">
                Welcome back,{" "}
                {user?.name?.split(" ")[0] || "User"} 👋
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Manage your customer relationships from one place.
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <p className="text-xs text-slate-500">
                Logged in as
              </p>

              <p className="text-sm font-semibold text-slate-700">
                {user?.role}
              </p>
            </div>
          </div>
        </header>

        {/* Dashboard Body */}
        <div className="p-6 md:p-8">
          {/* Statistics */}
          <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {/* Leads */}
            <button
              onClick={() => onNavigate("leads")}
              className="rounded-2xl bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">
                    Total Leads
                  </p>

                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {dashboardLoading ? "..." : dashboardData.totalLeads}
                  </p>

                  <p className="mt-2 flex items-center gap-1 text-xs font-medium text-green-600">
                    <TrendingUp size={14} />
                    Lead pipeline
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <UserPlus size={22} />
                </div>
              </div>
            </button>

            {/* Customers */}
            <button
              onClick={() => onNavigate("customers")}
              className="rounded-2xl bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">
                    Total Customers
                  </p>

                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {dashboardLoading ? "..." : dashboardData.totalCustomers}
                  </p>

                  <p className="mt-2 text-xs font-medium text-green-600">
                    Active relationships
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-600">
                  <Users size={22} />
                </div>
              </div>
            </button>

            {/* Revenue */}
            <div className="rounded-2xl bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">
                    Revenue
                  </p>

                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {dashboardLoading
                      ? "..."
                      : `₹${dashboardData.totalRevenue.toLocaleString("en-IN")}`}
                  </p>

                  <p className="mt-2 text-xs font-medium text-slate-500">
                    Current CRM records
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                  <ShoppingCart size={22} />
                </div>
              </div>
            </div>

            {/* Follow-ups */}
            <button
              onClick={() => onNavigate("followups")}
              className="rounded-2xl bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">
                    Follow-ups
                  </p>

                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {dashboardLoading ? "..." : dashboardData.totalFollowUps}
                  </p>

                  <p className="mt-2 flex items-center gap-1 text-xs font-medium text-orange-600">
                    <Clock3 size={14} />
                    Need attention
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                  <CalendarCheck size={22} />
                </div>
              </div>
            </button>
          </div>

          {/* Lifecycle */}
          <div className="mb-8 rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-800">
                CRM Lifecycle
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Reach → Acquire → Convert → Retain → Loyalty
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
              {/* Reach */}
              <button
                onClick={() => onNavigate("leads")}
                className="group rounded-xl border border-slate-100 bg-slate-50 p-5 text-left transition hover:-translate-y-1 hover:border-blue-200 hover:bg-blue-50 hover:shadow-md"
              >
                <p className="text-sm font-semibold text-blue-600">
                  01
                </p>

                <h4 className="mt-2 font-bold text-slate-800">
                  Reach
                </h4>

                <p className="mt-1 text-xs text-slate-500">
                  Capture new leads
                </p>

                <ArrowRight
                  size={16}
                  className="mt-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-600"
                />
              </button>

              {/* Acquire */}
              <button
                onClick={() => onNavigate("leads")}
                className="group rounded-xl border border-slate-100 bg-slate-50 p-5 text-left transition hover:-translate-y-1 hover:border-blue-200 hover:bg-blue-50 hover:shadow-md"
              >
                <p className="text-sm font-semibold text-blue-600">
                  02
                </p>

                <h4 className="mt-2 font-bold text-slate-800">
                  Acquire
                </h4>

                <p className="mt-1 text-xs text-slate-500">
                  Qualify and manage leads
                </p>

                <ArrowRight
                  size={16}
                  className="mt-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-600"
                />
              </button>

              {/* Convert */}
              <button
                onClick={() => onNavigate("leads")}
                className="group rounded-xl border border-slate-100 bg-slate-50 p-5 text-left transition hover:-translate-y-1 hover:border-blue-200 hover:bg-blue-50 hover:shadow-md"
              >
                <p className="text-sm font-semibold text-blue-600">
                  03
                </p>

                <h4 className="mt-2 font-bold text-slate-800">
                  Convert
                </h4>

                <p className="mt-1 text-xs text-slate-500">
                  Convert leads to customers
                </p>

                <ArrowRight
                  size={16}
                  className="mt-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-600"
                />
              </button>

              {/* Retain */}
              <button
                onClick={() => onNavigate("retention")}
                className="group rounded-xl border border-slate-100 bg-slate-50 p-5 text-left transition hover:-translate-y-1 hover:border-blue-200 hover:bg-blue-50 hover:shadow-md"
              >
                <p className="text-sm font-semibold text-blue-600">
                  04
                </p>

                <h4 className="mt-2 font-bold text-slate-800">
                  Retain
                </h4>

                <p className="mt-1 text-xs text-slate-500">
                  Track customer retention
                </p>

                <ArrowRight
                  size={16}
                  className="mt-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-600"
                />
              </button>

              {/* Loyalty */}
              <button
                onClick={() => onNavigate("loyalty")}
                className="group rounded-xl border border-slate-100 bg-slate-50 p-5 text-left transition hover:-translate-y-1 hover:border-blue-200 hover:bg-blue-50 hover:shadow-md"
              >
                <p className="text-sm font-semibold text-blue-600">
                  05
                </p>

                <h4 className="mt-2 font-bold text-slate-800">
                  Loyalty
                </h4>

                <p className="mt-1 text-xs text-slate-500">
                  Reward repeat customers
                </p>

                <ArrowRight
                  size={16}
                  className="mt-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-600"
                />
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Quick Actions */}
            <div className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md">
              <h3 className="text-xl font-bold text-slate-800">
                Quick Actions
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Common CRM tasks
              </p>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* Add Lead */}
                <button
                  onClick={() => onNavigate("leads")}
                  className="flex items-center gap-3 rounded-xl border border-slate-100 p-4 text-left transition hover:-translate-y-1 hover:bg-blue-50 hover:shadow-md"
                >
                  <UserPlus
                    size={20}
                    className="text-blue-600"
                  />

                  <div>
                    <p className="font-semibold text-slate-700">
                      Add Lead
                    </p>

                    <p className="text-xs text-slate-500">
                      Create a new lead
                    </p>
                  </div>
                </button>

                {/* View Customers */}
                <button
                  onClick={() =>
                    onNavigate("customers")
                  }
                  className="flex items-center gap-3 rounded-xl border border-slate-100 p-4 text-left transition hover:-translate-y-1 hover:bg-blue-50 hover:shadow-md"
                >
                  <Users
                    size={20}
                    className="text-green-600"
                  />

                  <div>
                    <p className="font-semibold text-slate-700">
                      View Customers
                    </p>

                    <p className="text-xs text-slate-500">
                      Manage customer profiles
                    </p>
                  </div>
                </button>

                {/* Record Interaction */}
                <button
                  onClick={() =>
                    onNavigate("interactions")
                  }
                  className="flex items-center gap-3 rounded-xl border border-slate-100 p-4 text-left transition hover:-translate-y-1 hover:bg-blue-50 hover:shadow-md"
                >
                  <MessageSquare
                    size={20}
                    className="text-purple-600"
                  />

                  <div>
                    <p className="font-semibold text-slate-700">
                      Record Interaction
                    </p>

                    <p className="text-xs text-slate-500">
                      Log a customer interaction
                    </p>
                  </div>
                </button>

                {/* Schedule Follow-up */}
                <button
                  onClick={() =>
                    onNavigate("followups")
                  }
                  className="flex items-center gap-3 rounded-xl border border-slate-100 p-4 text-left transition hover:-translate-y-1 hover:bg-blue-50 hover:shadow-md"
                >
                  <CalendarCheck
                    size={20}
                    className="text-orange-600"
                  />

                  <div>
                    <p className="font-semibold text-slate-700">
                      Schedule Follow-up
                    </p>

                    <p className="text-xs text-slate-500">
                      Plan the next activity
                    </p>
                  </div>
                </button>

                {/* Retention */}
                <button
                  onClick={() =>
                    onNavigate("retention")
                  }
                  className="flex items-center gap-3 rounded-xl border border-slate-100 p-4 text-left transition hover:-translate-y-1 hover:bg-blue-50 hover:shadow-md"
                >
                  <HeartHandshake
                    size={20}
                    className="text-indigo-600"
                  />

                  <div>
                    <p className="font-semibold text-slate-700">
                      Retention Activity
                    </p>

                    <p className="text-xs text-slate-500">
                      Retain customer relationships
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">
                    Recent Activity
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    CRM activity overview
                  </p>
                </div>

                <MessageSquare
                  size={22}
                  className="text-slate-400"
                />
              </div>

              <div className="mt-5 space-y-4">
                <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:shadow-sm">
                  <div className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-500" />

                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      Customer interactions
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Record calls, emails and meetings from the Interactions module.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:shadow-sm">
                  <div className="mt-1 h-2.5 w-2.5 rounded-full bg-green-500" />

                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      Customer management
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      View and manage customer records stored in the CRM.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:shadow-sm">
                  <div className="mt-1 h-2.5 w-2.5 rounded-full bg-purple-500" />

                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      Lead conversion
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Convert qualified leads into customer records.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:shadow-sm">
                  <div className="mt-1 h-2.5 w-2.5 rounded-full bg-indigo-500" />

                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      Customer retention
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Plan activities to maintain long-term customer relationships.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;