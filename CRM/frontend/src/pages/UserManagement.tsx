import { useEffect, useState } from "react";
import {
  ArrowLeft,
  UserPlus,
  Users,
  Search,
  Mail,
  Shield,
  X,
  RefreshCw,
  Trash2,
  UserRound,
} from "lucide-react";

interface SalesStaff {
  _id: string;
  name: string;
  email: string;
}

interface StaffUser {
  _id: string;
  name: string;
  email: string;
  role: "Sales Staff" | "Support Staff";
  status: "Active" | "Inactive";
  createdAt: string;
  reportsTo?: {
    _id: string;
    name: string;
    email?: string;
  } | null;
}

interface UserManagementProps {
  onBack: () => void;
}

function UserManagement({ onBack }: UserManagementProps) {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [salesStaff, setSalesStaff] = useState<SalesStaff[]>([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [role, setRole] = useState<
    "Sales Staff" | "Support Staff"
  >("Sales Staff");

  const [reportsTo, setReportsTo] = useState("");

  // Fetch all staff and active Sales Staff
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      const [usersResponse, salesResponse] = await Promise.all([
        fetch("http://localhost:5000/api/users", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),

        fetch("http://localhost:5000/api/users/sales-staff", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      const usersData = await usersResponse.json();
      const salesData = await salesResponse.json();

      if (!usersResponse.ok) {
        throw new Error(
          usersData.message || "Failed to load staff accounts."
        );
      }

      if (!salesResponse.ok) {
        throw new Error(
          salesData.message || "Failed to load Sales Staff."
        );
      }

      setUsers(usersData.users || []);

      // Accept both backend response formats
      const availableSalesStaff =
        salesData.users || salesData.salesStaff || [];

      setSalesStaff(availableSalesStaff);

    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load staff accounts."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchUsers();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  // Create staff account
  const handleCreateUser = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (role === "Support Staff" && !reportsTo) {
      setError("Please select a Sales Staff member.");
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:5000/api/users",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            password,
            role,
            reportsTo:
              role === "Support Staff" ? reportsTo : null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to create staff account."
        );
      }

      setName("");
      setEmail("");
      setPassword("");
      setRole("Sales Staff");
      setReportsTo("");
      setShowForm(false);

      setSuccess("Staff account created successfully.");

      await fetchUsers();

      window.setTimeout(() => setSuccess(""), 3000);

    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create staff account."
      );
    } finally {
      setSaving(false);
    }
  };

  // Change Support Staff assignment
  const handleAssignmentChange = async (
    supportUser: StaffUser,
    newSalesStaffId: string
  ) => {
    if (
      !newSalesStaffId ||
      newSalesStaffId === supportUser.reportsTo?._id
    ) {
      return;
    }

    setError("");
    setSuccess("");
    setUpdatingId(supportUser._id);

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:5000/api/users/${supportUser._id}/assignment`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            reportsTo: newSalesStaffId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to update assignment."
        );
      }

      setSuccess(
        `${supportUser.name}'s assignment was updated successfully.`
      );

      await fetchUsers();

      window.setTimeout(() => setSuccess(""), 3000);

    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update assignment."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // Delete staff account
  const handleDeleteUser = async (user: StaffUser) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${user.name} (${user.email})?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");
    setDeletingId(user._id);

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:5000/api/users/${user._id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to delete staff account."
        );
      }

      setUsers((previousUsers) =>
        previousUsers.filter(
          (existingUser) => existingUser._id !== user._id
        )
      );

      setSuccess(
        `${user.name}'s account was deleted successfully.`
      );

      window.setTimeout(() => setSuccess(""), 3000);

    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete staff account."
      );
    } finally {
      setDeletingId(null);
    }
  };

  // Search staff
  const filteredUsers = users.filter((user) => {
    const searchText = search.toLowerCase();

    return (
      user.name.toLowerCase().includes(searchText) ||
      user.email.toLowerCase().includes(searchText) ||
      user.role.toLowerCase().includes(searchText) ||
      (user.reportsTo?.name || "")
        .toLowerCase()
        .includes(searchText)
    );
  });

  const salesCount = users.filter(
    (user) => user.role === "Sales Staff"
  ).length;

  const supportCount = users.filter(
    (user) => user.role === "Support Staff"
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">

      {/* Back button */}
      <button
        onClick={onBack}
        className="mb-6 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-x-1 hover:bg-slate-50"
      >
        <ArrowLeft size={18} />
        Back to Dashboard
      </button>

      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-sm font-medium text-blue-600">
            Administration
          </p>

          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            User Management
          </h1>

          <p className="mt-2 text-slate-500">
            Create, search, and manage CRM staff accounts.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => void fetchUsers()}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              size={18}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>

          <button
            onClick={() => {
              setShowForm(true);
              setError("");
              setSuccess("");
            }}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <UserPlus size={18} />
            Add Staff User
          </button>
        </div>
      </div>

      {/* Success */}
      {success && (
        <div
          role="status"
          className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700"
        >
          {success}
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600"
        >
          {error}
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">

          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                Add Staff User
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Create a Sales Staff or Support Staff account.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowForm(false)}
              aria-label="Close form"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={20} />
            </button>
          </div>

          <form
            onSubmit={handleCreateUser}
            className="grid grid-cols-1 gap-5 md:grid-cols-2"
          >

            {/* Name */}
            <div>
              <label
                htmlFor="staff-name"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Full Name
              </label>

              <input
                id="staff-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter full name"
                required
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="staff-email"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Email Address
              </label>

              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="staff-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                  required
                  className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="staff-password"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Password
              </label>

              <input
                id="staff-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                minLength={6}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              />
            </div>

            {/* Role */}
            <div>
              <label
                htmlFor="staff-role"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Role
              </label>

              <div className="relative">
                <Shield
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <select
                  id="staff-role"
                  value={role}
                  onChange={(e) => {
                    setRole(
                      e.target.value as
                        | "Sales Staff"
                        | "Support Staff"
                    );
                    setReportsTo("");
                  }}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                >
                  <option value="Sales Staff">
                    Sales Staff
                  </option>

                  <option value="Support Staff">
                    Support Staff
                  </option>
                </select>
              </div>
            </div>

            {/* Sales Staff assignment */}
            {role === "Support Staff" && (
              <div className="md:col-span-2">
                <label
                  htmlFor="support-sales-staff"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Assign Support Staff To Sales Staff
                </label>

                <div className="relative">
                  <UserRound
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <select
                    id="support-sales-staff"
                    value={reportsTo}
                    onChange={(e) => setReportsTo(e.target.value)}
                    required
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                  >
                    <option value="">
                      Select a Sales Staff member
                    </option>

                    {salesStaff.map((staff) => (
                      <option
                        key={staff._id}
                        value={staff._id}
                      >
                        {staff.name} ({staff.email})
                      </option>
                    ))}
                  </select>
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  This Support Staff member will manage customers
                  assigned to the selected Sales Staff member.
                </p>

                {salesStaff.length === 0 && (
                  <p className="mt-2 text-sm text-red-500">
                    No active Sales Staff accounts found.
                  </p>
                )}
              </div>
            )}

            {/* Form actions */}
            <div className="flex justify-end gap-3 md:col-span-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={
                  saving ||
                  (role === "Support Staff" &&
                    salesStaff.length === 0)
                }
                className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Creating..." : "Create User"}
              </button>
            </div>

          </form>
        </div>
      )}

      {/* Statistics */}
      <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-3">

        <div className="rounded-2xl bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Users size={21} />
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Total Staff
              </p>

              <p className="text-2xl font-bold text-slate-800">
                {users.length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-600">
              <Users size={21} />
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Sales Staff
              </p>

              <p className="text-2xl font-bold text-slate-800">
                {salesCount}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <Shield size={21} />
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Support Staff
              </p>

              <p className="text-2xl font-bold text-slate-800">
                {supportCount}
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Search */}
      <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
        <div className="relative">
          <Search
            size={19}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search staff by name, email, or role..."
            className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
          />
        </div>
      </div>

      {/* Staff list */}
      <div className="rounded-2xl bg-white shadow-sm">

        <div className="border-b border-slate-100 px-6 py-5">
          <h2 className="text-lg font-bold text-slate-800">
            Staff Users
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Manage staff accounts and their assignments.
          </p>
        </div>

        {loading ? (
          <div className="px-6 py-12 text-center text-slate-500">
            Loading users...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <Users size={25} />
            </div>

            <p className="mt-4 font-semibold text-slate-700">
              No staff users found
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Click Add Staff User to create an account.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">

            {filteredUsers.map((user) => (
              <div
                key={user._id}
                className="flex flex-col gap-4 px-6 py-5 transition hover:bg-slate-50 md:flex-row md:items-center md:justify-between"
              >

                {/* User details */}
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600">
                    {user.name.charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-800">
                      {user.name}
                    </h3>

                    <div className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                      <Mail size={14} />
                      <span>{user.email}</span>
                    </div>

                    {user.role === "Support Staff" && (
                      <p className="mt-2 text-xs text-slate-500">
                        Assigned to:{" "}
                        <span className="font-semibold text-blue-600">
                          {user.reportsTo?.name || "Not assigned"}
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Role, status, assignment and delete */}
                <div className="flex flex-wrap items-center gap-3">

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      user.role === "Sales Staff"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-purple-100 text-purple-700"
                    }`}
                  >
                    {user.role}
                  </span>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      user.status === "Active"
                        ? "bg-green-100 text-green-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {user.status}
                  </span>

                  {user.role === "Support Staff" && (
                    <select
                      value={user.reportsTo?._id || ""}
                      onChange={(e) =>
                        void handleAssignmentChange(
                          user,
                          e.target.value
                        )
                      }
                      disabled={updatingId === user._id}
                      aria-label={`Change Sales Staff assignment for ${user.name}`}
                      className="max-w-[220px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:opacity-50"
                    >
                      <option value="" disabled>
                        Select Sales Staff
                      </option>

                      {salesStaff.map((staff) => (
                        <option
                          key={staff._id}
                          value={staff._id}
                        >
                          {staff.name}
                        </option>
                      ))}
                    </select>
                  )}

                  <button
                    type="button"
                    onClick={() => void handleDeleteUser(user)}
                    disabled={deletingId === user._id}
                    title={`Delete ${user.name}`}
                    className="flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2 size={16} />

                    {deletingId === user._id
                      ? "Deleting..."
                      : "Delete"}
                  </button>

                </div>
              </div>
            ))}

          </div>
        )}
      </div>
    </div>
  );
}

export default UserManagement;