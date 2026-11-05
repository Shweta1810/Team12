
import { useEffect, useState } from "react";
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
  Trash2,
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

function Dashboard({ user, onNavigate }: DashboardProps) {
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

  useEffect(() => {
    let cancelled = false;

    const loadDashboardData = async () => {
      try {
        // Support Staff only receive the customer records they are permitted to view.
        if (user?.role === "Support Staff") {
          const response = await fetch(
            "http://localhost:5000/api/customers",
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (!response.ok) {
            throw new Error("Failed to load assigned customers.");
          }

          const data = await response.json();

          if (!cancelled) {
            setDashboardData({
              totalLeads: 0,
              totalCustomers: data.count ?? data.customers?.length ?? 0,
              totalRevenue: 0,
              totalFollowUps: 0,
            });
          }

          return;
        }

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

        if (!cancelled) {
          setDashboardData({
            totalLeads: data.summary?.totalLeads ?? 0,
            totalCustomers: data.summary?.totalCustomers ?? 0,
            totalRevenue: data.sales?.totalRevenue ?? 0,
            totalFollowUps: data.summary?.totalFollowUps ?? 0,
          });
        }
      } catch (error) {
        console.error("Dashboard data error:", error);
      } finally {
        if (!cancelled) {
          setDashboardLoading(false);
        }
      }
    };

    void loadDashboardData();

    return () => {
      cancelled = true;
    };
  }, [token, user?.role]);

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

          <button
            onClick={() => onNavigate("dashboard")}
            className="mb-1 flex w-full items-center gap-3 rounded-xl bg-blue-50 px-3 py-3 text-sm font-semibold text-blue-600 transition hover:-translate-y-0.5 hover:shadow-sm"
          >
            <LayoutDashboard size={19} />
            Dashboard
          </button>

          {user?.role === "Support Staff" ? (
            <>
              <button
                onClick={() => onNavigate("customers")}
                className="mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:-translate-y-0.5 hover:bg-slate-50 hover:text-blue-600 hover:shadow-sm"
              >
                <Users size={19} />
                Customers
              </button>

              <button
                onClick={() => onNavigate("followups")}
                className="mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:-translate-y-0.5 hover:bg-slate-50 hover:text-blue-600 hover:shadow-sm"
              >
                <CalendarCheck size={19} />
                Follow-ups
              </button>

              <button
                onClick={() => onNavigate("sales")}
                className="mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:-translate-y-0.5 hover:bg-slate-50 hover:text-blue-600 hover:shadow-sm"
              >
                <ShoppingCart size={19} />
                Sales / Payments
              </button>

              <button
                onClick={() => onNavigate("feedback")}
                className="mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:-translate-y-0.5 hover:bg-slate-50 hover:text-blue-600 hover:shadow-sm"
              >
                <MessageCircle size={19} />
                Feedback
              </button>

              <button
                onClick={() => onNavigate("retention")}
                className="mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:-translate-y-0.5 hover:bg-slate-50 hover:text-blue-600 hover:shadow-sm"
              >
                <HeartHandshake size={19} />
                Retention
              </button>

              <button
                onClick={() => onNavigate("support")}
                className="mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:-translate-y-0.5 hover:bg-slate-50 hover:text-blue-600 hover:shadow-sm"
              >
                <Headphones size={19} />
                Issues
              </button>

              <button
                onClick={() => onNavigate("loyalty")}
                className="mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:-translate-y-0.5 hover:bg-slate-50 hover:text-blue-600 hover:shadow-sm"
              >
                <Gift size={19} />
                Loyalty
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onNavigate("leads")}
                className="mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:-translate-y-0.5 hover:bg-slate-50 hover:text-blue-600 hover:shadow-sm"
              >
                <UserPlus size={19} />
                Leads
              </button>

              <button
                onClick={() => onNavigate("customers")}
                className="mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:-translate-y-0.5 hover:bg-slate-50 hover:text-blue-600 hover:shadow-sm"
              >
                <Users size={19} />
                Customers
              </button>

              <button
                onClick={() => onNavigate("interactions")}
                className="mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:-translate-y-0.5 hover:bg-slate-50 hover:text-blue-600 hover:shadow-sm"
              >
                <MessageSquare size={19} />
                Interactions
              </button>

              <button
                onClick={() => onNavigate("followups")}
                className="mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:-translate-y-0.5 hover:bg-slate-50 hover:text-blue-600 hover:shadow-sm"
              >
                <CalendarCheck size={19} />
                Follow-ups
              </button>

              <button
                onClick={() => onNavigate("sales")}
                className="mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:-translate-y-0.5 hover:bg-slate-50 hover:text-blue-600 hover:shadow-sm"
              >
                <ShoppingCart size={19} />
                Sales
              </button>

              <button
                onClick={() => onNavigate("feedback")}
                className="mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:-translate-y-0.5 hover:bg-slate-50 hover:text-blue-600 hover:shadow-sm"
              >
                <MessageCircle size={19} />
                Feedback
              </button>

              <button
                onClick={() => onNavigate("retention")}
                className="mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:-translate-y-0.5 hover:bg-slate-50 hover:text-blue-600 hover:shadow-sm"
              >
                <HeartHandshake size={19} />
                Retention
              </button>

              <button
                onClick={() => onNavigate("support")}
                className="mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:-translate-y-0.5 hover:bg-slate-50 hover:text-blue-600 hover:shadow-sm"
              >
                <Headphones size={19} />
                Support
              </button>

              <button
                onClick={() => onNavigate("loyalty")}
                className="mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:-translate-y-0.5 hover:bg-slate-50 hover:text-blue-600 hover:shadow-sm"
              >
                <Gift size={19} />
                Loyalty
              </button>

              <button
                onClick={() => onNavigate("reports")}
                className="mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:-translate-y-0.5 hover:bg-slate-50 hover:text-blue-600 hover:shadow-sm"
              >
                <BarChart3 size={19} />
                Reports
              </button>
            </>
          )}

          {/* Admin-only navigation */}
          {user?.role === "Admin" && (
            <>
              <div className="my-5 border-t border-slate-100" />

              <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Administration
              </p>

              <button
                onClick={() => onNavigate("user-management")}
                className="mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:-translate-y-0.5 hover:bg-slate-50 hover:text-blue-600 hover:shadow-sm"
              >
                <UserCog size={19} />
                User Management
              </button>

              <button
                onClick={() => onNavigate("deletion-requests")}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:-translate-y-0.5 hover:bg-slate-50 hover:text-blue-600 hover:shadow-sm"
              >
                <Trash2 size={19} />
                Deletion Requests
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
            {user?.role !== "Support Staff" && (
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
            )}

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
                    {dashboardLoading
                      ? "..."
                      : dashboardData.totalCustomers}
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

            {user?.role !== "Support Staff" && (
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
            )}

            {user?.role !== "Support Staff" && (
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
                    {dashboardLoading
                      ? "..."
                      : dashboardData.totalFollowUps}
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
            )}
          </div>

          {/* Lifecycle */}
          {user?.role !== "Support Staff" && (
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
              {[
                {
                  number: "01",
                  title: "Reach",
                  description: "Capture new leads",
                  page: "leads",
                },
                {
                  number: "02",
                  title: "Acquire",
                  description: "Qualify and manage leads",
                  page: "leads",
                },
                {
                  number: "03",
                  title: "Convert",
                  description: "Convert leads to customers",
                  page: "leads",
                },
                {
                  number: "04",
                  title: "Retain",
                  description: "Track customer retention",
                  page: "retention",
                },
                {
                  number: "05",
                  title: "Loyalty",
                  description: "Reward repeat customers",
                  page: "loyalty",
                },
              ].map((item) => (
                <button
                  key={item.number}
                  onClick={() => onNavigate(item.page)}
                  className="group rounded-xl border border-slate-100 bg-slate-50 p-5 text-left transition hover:-translate-y-1 hover:border-blue-200 hover:bg-blue-50 hover:shadow-md"
                >
                  <p className="text-sm font-semibold text-blue-600">
                    {item.number}
                  </p>

                  <h4 className="mt-2 font-bold text-slate-800">
                    {item.title}
                  </h4>

                  <p className="mt-1 text-xs text-slate-500">
                    {item.description}
                  </p>

                  <ArrowRight
                    size={16}
                    className="mt-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-600"
                  />
                </button>
              ))}
            </div>
          </div>
          )}

          {/* Quick Actions and Recent Activity */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md">
              <h3 className="text-xl font-bold text-slate-800">
                Quick Actions
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Common CRM tasks
              </p>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  {
                    title: "Add Lead",
                    description: "Create a new lead",
                    page: "leads",
                    Icon: UserPlus,
                    color: "text-blue-600",
                  },
                  {
                    title: "View Customers",
                    description: "Manage customer profiles",
                    page: "customers",
                    Icon: Users,
                    color: "text-green-600",
                  },
                  {
                    title: "Record Interaction",
                    description: "Log a customer interaction",
                    page: "interactions",
                    Icon: MessageSquare,
                    color: "text-purple-600",
                  },
                  {
                    title: "Schedule Follow-up",
                    description: "Plan the next activity",
                    page: "followups",
                    Icon: CalendarCheck,
                    color: "text-orange-600",
                  },
                  {
                    title: "Retention Activity",
                    description: "Retain customer relationships",
                    page: "retention",
                    Icon: HeartHandshake,
                    color: "text-indigo-600",
                  },
                  {
                    title: "Sales / Payments",
                    description: "View sales and update payment records",
                    page: "sales",
                    Icon: ShoppingCart,
                    color: "text-purple-600",
                  },
                ]
                  .filter(({ page }) =>
                    user?.role !== "Support Staff" ||
                    ["customers", "followups", "feedback", "retention"].includes(page)
                  )
                  .map(({ title, description, page, Icon, color }) => (
                  <button
                    key={title}
                    onClick={() => onNavigate(page)}
                    className="flex items-center gap-3 rounded-xl border border-slate-100 p-4 text-left transition hover:-translate-y-1 hover:bg-blue-50 hover:shadow-md"
                  >
                    <Icon size={20} className={color} />

                    <div>
                      <p className="font-semibold text-slate-700">
                        {title}
                      </p>

                      <p className="text-xs text-slate-500">
                        {description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {user?.role !== "Support Staff" && (
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
                {[
                  {
                    title: "Customer interactions",
                    description:
                      "Record calls, emails and meetings from the Interactions module.",
                    color: "bg-blue-500",
                  },
                  {
                    title: "Customer management",
                    description:
                      "View and manage customer records stored in the CRM.",
                    color: "bg-green-500",
                  },
                  {
                    title: "Lead conversion",
                    description:
                      "Convert qualified leads into customer records.",
                    color: "bg-purple-500",
                  },
                  {
                    title: "Customer retention",
                    description:
                      "Plan activities to maintain long-term customer relationships.",
                    color: "bg-indigo-500",
                  },
                ].map((activity) => (
                  <div
                    key={activity.title}
                    className="flex items-start gap-3 rounded-xl bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:shadow-sm"
                  >
                    <div
                      className={`mt-1 h-2.5 w-2.5 rounded-full ${activity.color}`}
                    />

                    <div>
                      <p className="text-sm font-semibold text-slate-700">
                        {activity.title}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {activity.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;

