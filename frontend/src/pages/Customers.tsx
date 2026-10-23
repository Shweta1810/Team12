import { useEffect, useState } from "react";
import {
  Users,
  UserPlus,
  Search,
  Mail,
  Phone,
  RefreshCw,
  X,
  FileText,
  ArrowLeft,
  Pencil,
} from "lucide-react";
import {
  apiRequest,
  fetchAssignableStaff,
  getCurrentRole,
  getErrorMessage,
  sendWithDuplicateCheck,
  type StaffMember,
} from "../services/crmApi";

interface Customer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  source?: string;
  status: "Active" | "Inactive";
  notes?: string;
  assignedTo?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  createdAt: string;
}

interface CustomersProps {
  onBack: () => void;
}

const SOURCES = [
  "Website",
  "Social Media",
  "Referral",
  "Advertisement",
  "Campaign",
  "Other",
];

const inputClass =
  "w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50";

function Customers({ onBack }: CustomersProps) {
  const isAdmin = getCurrentRole() === "Admin";

  // List filters (sent to the server)
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [reloadCount, setReloadCount] = useState(0);

  const queryKey = [
    debouncedSearch,
    statusFilter,
    sourceFilter,
    reloadCount,
  ].join("|");

  // The list is "loading" until a result exists for the current query.
  const [result, setResult] = useState<{
    key: string;
    customers: Customer[];
    error: string;
  } | null>(null);

  const [staff, setStaff] = useState<StaffMember[]>([]);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Add / edit form
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [source, setSource] = useState("Other");
  const [status, setStatus] = useState("Active");
  const [notes, setNotes] = useState("");
  const [assignedTo, setAssignedTo] = useState("");

  const [busyId, setBusyId] = useState<string | null>(null);

  const loading = result?.key !== queryKey;
  const customers =
    result?.key === queryKey ? result.customers : [];
  const listError = result?.key === queryKey ? result.error : "";

  // Wait briefly after typing before asking the server.
  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedSearch(search.trim()),
      300
    );

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let cancelled = false;

    const params = new URLSearchParams();

    if (debouncedSearch) params.set("search", debouncedSearch);
    if (statusFilter) params.set("status", statusFilter);
    if (sourceFilter) params.set("source", sourceFilter);

    const query = params.toString();

    apiRequest<{ customers: Customer[] }>(
      `/customers${query ? `?${query}` : ""}`
    )
      .then((data) => {
        if (!cancelled) {
          setResult({
            key: queryKey,
            customers: data.customers || [],
            error: "",
          });
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setResult({
            key: queryKey,
            customers: [],
            error: getErrorMessage(
              err,
              "Unable to load customers."
            ),
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [queryKey, debouncedSearch, statusFilter, sourceFilter]);

  // Admin needs the staff list for assigning customers.
  useEffect(() => {
    fetchAssignableStaff()
      .then(setStaff)
      .catch(() => setStaff([]));
  }, []);

  const showSuccess = (message: string) => {
    setSuccess(message);

    setTimeout(() => {
      setSuccess("");
    }, 3500);
  };

  const refresh = () => setReloadCount((count) => count + 1);

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setEmail("");
    setPhone("");
    setSource("Other");
    setStatus("Active");
    setNotes("");
    setAssignedTo("");
  };

  const openAddForm = () => {
    resetForm();
    setShowForm(true);
    setError("");
    setSuccess("");
  };

  const openEditForm = (customer: Customer) => {
    setEditingId(customer._id);
    setName(customer.name);
    setEmail(customer.email);
    setPhone(customer.phone || "");
    setSource(customer.source || "Other");
    setStatus(customer.status);
    setNotes(customer.notes || "");
    setShowForm(true);
    setError("");
    setSuccess("");
  };

  const closeForm = () => {
    setShowForm(false);
    resetForm();
  };

  const handleSaveCustomer = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!editingId && isAdmin && !assignedTo) {
      setError("Please choose a staff member for this customer.");
      return;
    }

    setSaving(true);

    try {
      const body: Record<string, unknown> = {
        name,
        email,
        phone,
        source,
        status,
        notes,
      };

      if (!editingId && isAdmin) {
        body.assignedTo = assignedTo;
      }

      const data = await sendWithDuplicateCheck<{
        customer: Customer;
      }>(
        editingId ? `/customers/${editingId}` : "/customers",
        editingId ? "PUT" : "POST",
        body
      );

      // null means the user cancelled at the duplicate warning
      if (data) {
        closeForm();
        refresh();
        showSuccess(
          editingId
            ? "Customer updated successfully."
            : "Customer added successfully."
        );
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Unable to save customer."));
    } finally {
      setSaving(false);
    }
  };

  const handleAssign = async (
    customer: Customer,
    staffId: string
  ) => {
    if (!staffId || staffId === customer.assignedTo?._id) {
      return;
    }

    try {
      setBusyId(customer._id);
      setError("");

      await apiRequest(
        `/customers/${customer._id}/assign`,
        "PATCH",
        { assignedTo: staffId }
      );

      refresh();
      showSuccess("Customer assigned successfully.");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Unable to assign customer."));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      {/* Back to Dashboard */}
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
            Customer Management
          </p>

          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            Customers
          </h1>

          <p className="mt-2 text-slate-500">
            View, search and update customer profiles.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={refresh}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <RefreshCw size={18} />
            Refresh
          </button>

          <button
            onClick={openAddForm}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <UserPlus size={18} />
            Add Customer
          </button>
        </div>
      </div>

      {/* Success */}
      {success && (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          {success}
        </div>
      )}

      {/* Error */}
      {(error || listError) && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error || listError}
        </div>
      )}

      {/* Add / Edit Customer Form */}
      {showForm && (
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                {editingId ? "Edit Customer" : "Add New Customer"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {editingId
                  ? "Update the customer's profile."
                  : "Enter the customer's basic information."}
              </p>
            </div>

            <button
              type="button"
              onClick={closeForm}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={20} />
            </button>
          </div>

          <form
            onSubmit={handleSaveCustomer}
            className="grid grid-cols-1 gap-5 md:grid-cols-2"
          >
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Customer Name
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter customer name"
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Email Address
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Phone Number
              </label>

              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter phone number"
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Source
              </label>

              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className={`${inputClass} bg-white`}
              >
                {SOURCES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Status
              </label>

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={`${inputClass} bg-white`}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            {isAdmin && !editingId && (
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Assign To
                </label>

                <select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  required
                  className={`${inputClass} bg-white`}
                >
                  <option value="">Select a staff member</option>

                  {staff.map((member) => (
                    <option key={member._id} value={member._id}>
                      {member.name} ({member.role})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Notes
              </label>

              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes about the customer"
                rows={3}
                className={`${inputClass} resize-none`}
              />
            </div>

            <div className="flex justify-end gap-3 md:col-span-2">
              <button
                type="button"
                onClick={closeForm}
                className="rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? "Saving..."
                  : editingId
                  ? "Update Customer"
                  : "Save Customer"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search and filters */}
      <div className="mb-6 grid grid-cols-1 gap-4 rounded-2xl bg-white p-5 shadow-sm md:grid-cols-3">
        <div className="relative">
          <Search
            size={19}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email or phone..."
            className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
          className={`${inputClass} bg-white`}
        >
          <option value="">All statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>

        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          aria-label="Filter by source"
          className={`${inputClass} bg-white`}
        >
          <option value="">All sources</option>

          {SOURCES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      {/* Customer List */}
      <div className="rounded-2xl bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5">
          <h2 className="text-lg font-bold text-slate-800">
            Customer List
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {loading
              ? "Loading..."
              : `${customers.length} customer${
                  customers.length === 1 ? "" : "s"
                } shown`}
          </p>
        </div>

        {loading ? (
          <div className="px-6 py-12 text-center text-slate-500">
            Loading customers...
          </div>
        ) : customers.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <Users size={25} />
            </div>

            <p className="mt-4 font-semibold text-slate-700">
              No customers found
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Try a different search or filter, or click "Add
              Customer".
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {customers.map((customer) => (
              <div
                key={customer._id}
                className="flex flex-col gap-5 px-6 py-5 transition hover:bg-slate-50 xl:flex-row xl:items-center xl:justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600">
                    {customer.name.charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-800">
                      {customer.name}
                    </h3>

                    <div className="mt-1 flex flex-col gap-1 text-sm text-slate-500 md:flex-row md:gap-4">
                      <span className="flex items-center gap-1">
                        <Mail size={14} />
                        {customer.email}
                      </span>

                      {customer.phone && (
                        <span className="flex items-center gap-1">
                          <Phone size={14} />
                          {customer.phone}
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-xs text-slate-400">
                      Source: {customer.source || "Other"}
                      {customer.assignedTo &&
                        ` • Owner: ${customer.assignedTo.name}`}
                    </p>

                    {customer.notes && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                        <FileText size={13} />
                        {customer.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      customer.status === "Active"
                        ? "bg-green-100 text-green-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {customer.status}
                  </span>

                  <button
                    onClick={() => openEditForm(customer)}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    <Pencil size={15} />
                    Edit
                  </button>

                  {isAdmin && (
                    <select
                      value={customer.assignedTo?._id || ""}
                      onChange={(e) =>
                        handleAssign(customer, e.target.value)
                      }
                      disabled={busyId === customer._id}
                      aria-label={`Reassign ${customer.name}`}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500"
                    >
                      {!customer.assignedTo && (
                        <option value="">Unassigned</option>
                      )}

                      {staff.map((member) => (
                        <option key={member._id} value={member._id}>
                          {member.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Customers;
