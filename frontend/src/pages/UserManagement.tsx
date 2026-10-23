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
} from "lucide-react";

interface StaffUser {
  _id: string;
  name: string;
  email: string;
  role: "Sales Staff" | "Support Staff";
  status: "Active" | "Inactive";
  createdAt: string;
}

interface UserManagementProps {
  onBack: () => void;
}

function UserManagement({ onBack }: UserManagementProps) {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [role, setRole] = useState<
    "Sales Staff" | "Support Staff"
  >("Sales Staff");

  // Load all staff accounts
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:5000/api/users",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load staff accounts."
        );
      }

      setUsers(data.users || []);
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

  // Create a staff account
  const handleCreateUser = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");
    setSuccess("");
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
            name,
            email,
            password,
            role,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to create staff account."
        );
      }

      setUsers((previousUsers) => [
        data.user,
        ...previousUsers,
      ]);

      setName("");
      setEmail("");
      setPassword("");
      setRole("Sales Staff");
      setShowForm(false);

      setSuccess("Staff account created successfully.");

      window.setTimeout(() => {
        setSuccess("");
      }, 3000);
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

  // Delete a staff account
  const handleDeleteUser = async (user: StaffUser) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${user.name} (${user.email})?\n\nThis action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

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

      window.setTimeout(() => {
        setSuccess("");
      }, 3000);
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

  // Search staff by name, email, or role
  const filteredUsers = users.filter((user) => {
    const searchText = search.toLowerCase();

    return (
      user.name.toLowerCase().includes(searchText) ||
      user.email.toLowerCase().includes(searchText) ||
      user.role.toLowerCase().includes(searchText)
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

      {/* Page header */}
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

      {/* Success message */}
      {success && (
        <div
          role="status"
          className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700"
        >
          {success}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div
          role="alert"
          className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600"
        >
          {error}
        </div>
      )}

      {/* Create staff form */}
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
                  onChange={(e) =>
                    setRole(
                      e.target.value as
                        | "Sales Staff"
                        | "Support Staff"
                    )
                  }
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
                disabled={saving}
                className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Creating..." : "Create User"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Staff statistics */}
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
            Each staff account has its own Delete button.
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
                  </div>
                </div>

                {/* Role, status, and delete action */}
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

                  <button
                    type="button"
                    onClick={() => void handleDeleteUser(user)}
                    disabled={deletingId === user._id}
                    title={`Delete ${user.name}`}
                    className="flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 hover:border-red-300 disabled:cursor-not-allowed disabled:opacity-50"
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