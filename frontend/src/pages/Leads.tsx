import { useEffect, useState } from "react";
import {
  UserPlus,
  Search,
  RefreshCw,
  Mail,
  Phone,
  ArrowRight,
  ArrowLeft,
  X,
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

type LeadStatus =
  | "New"
  | "Contacted"
  | "Qualified"
  | "Converted"
  | "Lost";

interface Lead {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  source: string;
  status: LeadStatus;
  notes?: string;
  lostReason?: string;
  assignedTo?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  createdAt: string;
}

interface LeadsProps {
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

// Statuses a user can pick; "Converted" is reached only by converting.
const EDITABLE_STATUSES: LeadStatus[] = [
  "New",
  "Contacted",
  "Qualified",
  "Lost",
];

const inputClass =
  "w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50";

function Leads({ onBack }: LeadsProps) {
  const isAdmin = getCurrentRole() === "Admin";

  // List filters (sent to the server)
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
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
    leads: Lead[];
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
  const [source, setSource] = useState("Website");
  const [notes, setNotes] = useState("");
  const [assignedTo, setAssignedTo] = useState("");

  const [convertingId, setConvertingId] = useState<string | null>(
    null
  );
  const [busyId, setBusyId] = useState<string | null>(null);

  const loading = result?.key !== queryKey;
  const leads = result?.key === queryKey ? result.leads : [];
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
    if (statusFilter !== "active") {
      params.set("status", statusFilter);
    }
    if (sourceFilter) params.set("source", sourceFilter);

    const query = params.toString();

    apiRequest<{ leads: Lead[] }>(
      `/leads${query ? `?${query}` : ""}`
    )
      .then((data) => {
        if (!cancelled) {
          setResult({
            key: queryKey,
            leads: data.leads || [],
            error: "",
          });
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setResult({
            key: queryKey,
            leads: [],
            error: getErrorMessage(err, "Unable to load leads."),
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [queryKey, debouncedSearch, statusFilter, sourceFilter]);

  // Admin needs the staff list for assigning leads.
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
    setSource("Website");
    setNotes("");
    setAssignedTo("");
  };

  const openAddForm = () => {
    resetForm();
    setShowForm(true);
    setError("");
    setSuccess("");
  };

  const openEditForm = (lead: Lead) => {
    setEditingId(lead._id);
    setName(lead.name);
    setEmail(lead.email);
    setPhone(lead.phone || "");
    setSource(lead.source);
    setNotes(lead.notes || "");
    setShowForm(true);
    setError("");
    setSuccess("");
  };

  const closeForm = () => {
    setShowForm(false);
    resetForm();
  };

  const handleSaveLead = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!editingId && isAdmin && !assignedTo) {
      setError("Please choose a staff member for this lead.");
      return;
    }

    setSaving(true);

    try {
      const body: Record<string, unknown> = {
        name,
        email,
        phone,
        source,
        notes,
      };

      if (!editingId && isAdmin) {
        body.assignedTo = assignedTo;
      }

      const data = await sendWithDuplicateCheck<{ lead: Lead }>(
        editingId ? `/leads/${editingId}` : "/leads",
        editingId ? "PUT" : "POST",
        body
      );

      // null means the user cancelled at the duplicate warning
      if (data) {
        closeForm();
        refresh();
        showSuccess(
          editingId
            ? "Lead updated successfully."
            : "Lead added successfully."
        );
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Unable to save lead."));
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (
    lead: Lead,
    newStatus: LeadStatus
  ) => {
    if (newStatus === lead.status) {
      return;
    }

    const body: Record<string, unknown> = { status: newStatus };

    if (newStatus === "Lost") {
      const reason = window.prompt(
        "Why is this lead being marked as Lost?"
      );

      if (reason === null) {
        return;
      }

      if (!reason.trim()) {
        setError("A reason is required to mark a lead as Lost.");
        return;
      }

      body.lostReason = reason.trim();
    }

    try {
      setBusyId(lead._id);
      setError("");

      await apiRequest(`/leads/${lead._id}`, "PUT", body);

      refresh();
      showSuccess(`${lead.name} is now ${newStatus}.`);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Unable to change status."));
    } finally {
      setBusyId(null);
    }
  };

  const handleAssign = async (lead: Lead, staffId: string) => {
    if (!staffId || staffId === lead.assignedTo?._id) {
      return;
    }

    try {
      setBusyId(lead._id);
      setError("");

      await apiRequest(`/leads/${lead._id}/assign`, "PATCH", {
        assignedTo: staffId,
      });

      refresh();
      showSuccess("Lead assigned successfully.");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Unable to assign lead."));
    } finally {
      setBusyId(null);
    }
  };

  const handleConvert = async (leadId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to convert this lead into a customer?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setConvertingId(leadId);
      setError("");
      setSuccess("");

      const data = await apiRequest<{
        message: string;
        linked: boolean;
        customer: { name: string };
      }>(`/leads/${leadId}/convert`, "POST");

      refresh();
      showSuccess(
        data.linked
          ? `${data.customer.name} is already a customer. The lead has been linked to that record.`
          : `${data.customer.name} has been converted into a customer.`
      );
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Unable to convert lead."));
    } finally {
      setConvertingId(null);
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
            Lead Management
          </p>

          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            Leads
          </h1>

          <p className="mt-2 text-slate-500">
            Manage potential customers and convert qualified leads.
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
            Add Lead
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

      {/* Add / Edit Lead Form */}
      {showForm && (
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                {editingId ? "Edit Lead" : "Add New Lead"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {editingId
                  ? "Update the lead's information."
                  : "Enter the potential customer's information."}
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
            onSubmit={handleSaveLead}
            className="grid grid-cols-1 gap-5 md:grid-cols-2"
          >
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Lead Name
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter lead name"
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
                Lead Source
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

            {isAdmin && !editingId && (
              <div className="md:col-span-2">
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
                placeholder="Optional notes about the lead"
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
                  ? "Update Lead"
                  : "Save Lead"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search and filters */}
      <div className="mb-6 grid grid-cols-1 gap-4 rounded-2xl bg-white p-5 shadow-sm md:grid-cols-3">
        <div className="relative md:col-span-1">
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
          <option value="active">Active leads (excluding Lost)</option>
          <option value="New">New</option>
          <option value="Contacted">Contacted</option>
          <option value="Qualified">Qualified</option>
          <option value="Converted">Converted</option>
          <option value="Lost">Lost</option>
          <option value="all">All leads</option>
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

      {/* Lead List */}
      <div className="rounded-2xl bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5">
          <h2 className="text-lg font-bold text-slate-800">
            Lead List
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {loading
              ? "Loading..."
              : `${leads.length} lead${
                  leads.length === 1 ? "" : "s"
                } shown`}
          </p>
        </div>

        {loading ? (
          <div className="px-6 py-12 text-center text-slate-500">
            Loading leads...
          </div>
        ) : leads.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <UserPlus size={25} />
            </div>

            <p className="mt-4 font-semibold text-slate-700">
              No leads found
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Try a different search or filter, or click "Add Lead".
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {leads.map((lead) => (
              <div
                key={lead._id}
                className="flex flex-col gap-5 px-6 py-5 transition hover:bg-slate-50 xl:flex-row xl:items-center xl:justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600">
                    {lead.name.charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-800">
                      {lead.name}
                    </h3>

                    <div className="mt-1 flex flex-col gap-1 text-sm text-slate-500 md:flex-row md:gap-4">
                      <span className="flex items-center gap-1">
                        <Mail size={14} />
                        {lead.email}
                      </span>

                      {lead.phone && (
                        <span className="flex items-center gap-1">
                          <Phone size={14} />
                          {lead.phone}
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-xs text-slate-400">
                      Source: {lead.source}
                      {lead.assignedTo &&
                        ` • Owner: ${lead.assignedTo.name}`}
                    </p>

                    {lead.status === "Lost" && lead.lostReason && (
                      <p className="mt-1 text-xs text-red-500">
                        Lost reason: {lead.lostReason}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      lead.status === "Converted"
                        ? "bg-green-100 text-green-700"
                        : lead.status === "Qualified"
                        ? "bg-blue-100 text-blue-700"
                        : lead.status === "Contacted"
                        ? "bg-yellow-100 text-yellow-700"
                        : lead.status === "Lost"
                        ? "bg-red-100 text-red-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {lead.status}
                  </span>

                  {lead.status !== "Converted" && (
                    <>
                      <select
                        value={lead.status}
                        onChange={(e) =>
                          handleStatusChange(
                            lead,
                            e.target.value as LeadStatus
                          )
                        }
                        disabled={busyId === lead._id}
                        aria-label={`Change status of ${lead.name}`}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500"
                      >
                        {EDITABLE_STATUSES.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={() => openEditForm(lead)}
                        className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        <Pencil size={15} />
                        Edit
                      </button>
                    </>
                  )}

                  {isAdmin && (
                    <select
                      value={lead.assignedTo?._id || ""}
                      onChange={(e) =>
                        handleAssign(lead, e.target.value)
                      }
                      disabled={busyId === lead._id}
                      aria-label={`Reassign ${lead.name}`}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500"
                    >
                      {!lead.assignedTo && (
                        <option value="">Unassigned</option>
                      )}

                      {staff.map((member) => (
                        <option key={member._id} value={member._id}>
                          {member.name}
                        </option>
                      ))}
                    </select>
                  )}

                  {lead.status === "Qualified" && (
                    <button
                      onClick={() => handleConvert(lead._id)}
                      disabled={convertingId === lead._id}
                      className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {convertingId === lead._id
                        ? "Converting..."
                        : "Convert"}

                      <ArrowRight size={16} />
                    </button>
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

export default Leads;
