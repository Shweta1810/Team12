import { useEffect, useState } from "react";
import {
  ArrowLeft,
  MessageSquare,
  Plus,
  Search,
  X,
  RefreshCw,
  Phone,
  Mail,
  CalendarDays,
  MessagesSquare,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";

interface Customer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  status: "Active" | "Inactive";
}

interface Interaction {
  _id: string;
  customer: Customer;
  staff: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  type: "Call" | "Email" | "Meeting" | "Chat" | "Other";
  date: string;
  notes?: string;
}

interface InteractionsProps {
  onBack: () => void;
}

const INTERACTION_TYPES = [
  "All",
  "Call",
  "Email",
  "Meeting",
  "Chat",
  "Other",
] as const;

function Interactions({
  onBack,
}: InteractionsProps) {
  const [interactions, setInteractions] = useState<
    Interaction[]
  >([]);

  const [customers, setCustomers] = useState<Customer[]>(
    []
  );

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("All");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(
    null
  );

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* ── form state ── */
  const [showForm, setShowForm] = useState(false);

  /* editingId = null → create mode, set → edit mode */
  const [editingId, setEditingId] = useState<string | null>(
    null
  );

  const [customer, setCustomer] = useState("");
  const [type, setType] = useState<
    "Call" | "Email" | "Meeting" | "Chat" | "Other"
  >("Call");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");

  /* ── current logged-in user ── */
  const storedUser = sessionStorage.getItem("user");
  const currentUser = storedUser
    ? JSON.parse(storedUser)
    : null;

  /* ─────────────────────────────────────────
   *  Data fetching
   * ───────────────────────────────────────── */
  const fetchInteractions = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:5000/api/interactions",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to load interactions."
        );
      }

      setInteractions(data.interactions || []);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unable to load interactions.");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:5000/api/customers",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to load customers."
        );
      }

      setCustomers(data.customers || []);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unable to load customers.");
      }
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchInteractions();
      fetchCustomers();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  /* ─────────────────────────────────────────
   *  Form helpers
   * ───────────────────────────────────────── */
  const openCreateForm = () => {
    setEditingId(null);
    setCustomer("");
    setType("Call");
    setDate("");
    setNotes("");
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const openEditForm = (interaction: Interaction) => {
    setEditingId(interaction._id);
    setCustomer(interaction.customer._id);
    setType(interaction.type);
    /* convert ISO date → datetime-local format */
    setDate(
      interaction.date
        ? new Date(interaction.date)
            .toISOString()
            .slice(0, 16)
        : ""
    );
    setNotes(interaction.notes || "");
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
  };

  /* ─────────────────────────────────────────
   *  Create / Edit submit
   * ───────────────────────────────────────── */
  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const token = localStorage.getItem("token");
      const isEditing = editingId !== null;

      const url = isEditing
        ? `http://localhost:5000/api/interactions/${editingId}`
        : "http://localhost:5000/api/interactions";

      const method = isEditing ? "PUT" : "POST";

      const body: Record<string, string> = {
        type,
        date: date || new Date().toISOString(),
        notes,
      };

      /* customer is only sent on create */
      if (!isEditing) {
        body.customer = customer;
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            (isEditing
              ? "Failed to update interaction."
              : "Failed to record interaction.")
        );
      }

      if (isEditing) {
        /* replace the updated record in state */
        setInteractions((prev) =>
          prev.map((item) =>
            item._id === editingId
              ? data.interaction
              : item
          )
        );
        setSuccess("Interaction updated successfully.");
      } else {
        setInteractions((prev) => [
          data.interaction,
          ...prev,
        ]);
        setSuccess("Interaction recorded successfully.");
      }

      closeForm();

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unable to save interaction.");
      }
    } finally {
      setSaving(false);
    }
  };

  /* ─────────────────────────────────────────
   *  Delete
   * ───────────────────────────────────────── */
  const handleDelete = async (id: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this interaction? This cannot be undone."
      )
    ) {
      return;
    }

    setDeleting(id);
    setError("");

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:5000/api/interactions/${id}`,
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
          data.message ||
            "Failed to delete interaction."
        );
      }

      setInteractions((prev) =>
        prev.filter((item) => item._id !== id)
      );

      setSuccess("Interaction deleted successfully.");

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unable to delete interaction.");
      }
    } finally {
      setDeleting(null);
    }
  };

  /* ─────────────────────────────────────────
   *  Filtering
   * ───────────────────────────────────────── */
  const filteredInteractions = interactions.filter(
    (interaction) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        interaction.customer.name
          .toLowerCase()
          .includes(searchText) ||
        interaction.customer.email
          .toLowerCase()
          .includes(searchText) ||
        interaction.type
          .toLowerCase()
          .includes(searchText) ||
        (interaction.notes || "")
          .toLowerCase()
          .includes(searchText);

      const matchesType =
        typeFilter === "All" ||
        interaction.type === typeFilter;

      return matchesSearch && matchesType;
    }
  );

  /* ─────────────────────────────────────────
   *  Helpers
   * ───────────────────────────────────────── */
  const getInteractionIcon = (
    interactionType: Interaction["type"]
  ) => {
    if (interactionType === "Call") {
      return <Phone size={18} />;
    }

    if (interactionType === "Email") {
      return <Mail size={18} />;
    }

    if (interactionType === "Meeting") {
      return <CalendarDays size={18} />;
    }

    if (interactionType === "Chat") {
      return <MessagesSquare size={18} />;
    }

    return <MoreHorizontal size={18} />;
  };

  const getTypeBadgeColor = (
    interactionType: Interaction["type"]
  ) => {
    const colors: Record<string, string> = {
      Call: "bg-green-100 text-green-700",
      Email: "bg-blue-100 text-blue-700",
      Meeting: "bg-purple-100 text-purple-700",
      Chat: "bg-yellow-100 text-yellow-700",
      Other: "bg-slate-100 text-slate-600",
    };

    return colors[interactionType] ?? "bg-slate-100 text-slate-600";
  };

  /*
   * Determine whether the current user can edit/delete
   * a given interaction.
   * Admin can always; staff can only edit their own.
   */
  const canModify = (interaction: Interaction) => {
    if (!currentUser) return false;
    if (currentUser.role === "Admin") return true;
    return interaction.staff._id === currentUser.id ||
      interaction.staff.email === currentUser.email;
  };

  /* ─────────────────────────────────────────
   *  Render
   * ───────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      {/* Back Button */}
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
            Customer Relationship
          </p>

          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            Interactions
          </h1>

          <p className="mt-2 text-slate-500">
            Record and track all customer interactions.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              fetchInteractions();
              fetchCustomers();
            }}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <RefreshCw size={18} />
            Refresh
          </button>

          <button
            onClick={openCreateForm}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus size={18} />
            Record Interaction
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
      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </div>
      )}

      {/* Create / Edit Form */}
      {showForm && (
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                {editingId
                  ? "Edit Interaction"
                  : "Record Interaction"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {editingId
                  ? "Update the interaction details below."
                  : "Add a call, email, meeting or other customer interaction."}
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
            onSubmit={handleSubmit}
            className="grid grid-cols-1 gap-5 md:grid-cols-2"
          >
            {/* Customer — only shown when creating */}
            {!editingId && (
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Customer
                </label>

                <select
                  value={customer}
                  onChange={(e) =>
                    setCustomer(e.target.value)
                  }
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                >
                  <option value="">
                    Select customer
                  </option>

                  {customers.map((item) => (
                    <option
                      key={item._id}
                      value={item._id}
                    >
                      {item.name} - {item.email}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Type */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Interaction Type
              </label>

              <select
                value={type}
                onChange={(e) =>
                  setType(
                    e.target.value as Interaction["type"]
                  )
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              >
                <option value="Call">Call</option>
                <option value="Email">Email</option>
                <option value="Meeting">
                  Meeting
                </option>
                <option value="Chat">Chat</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Date &amp; Time
              </label>

              <input
                type="datetime-local"
                value={date}
                onChange={(e) =>
                  setDate(e.target.value)
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              />
            </div>

            {/* Notes */}
            <div className={editingId ? "" : "md:col-span-2"}>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Notes
              </label>

              <textarea
                value={notes}
                onChange={(e) =>
                  setNotes(e.target.value)
                }
                placeholder="Describe the interaction..."
                rows={3}
                className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              />
            </div>

            {/* Buttons */}
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
                  ? "Update Interaction"
                  : "Save Interaction"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-5 sm:grid-cols-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <MessageSquare size={21} />
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Total
              </p>

              <p className="text-2xl font-bold text-slate-800">
                {interactions.length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-600">
              <Phone size={21} />
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Calls
              </p>

              <p className="text-2xl font-bold text-slate-800">
                {
                  interactions.filter(
                    (i) => i.type === "Call"
                  ).length
                }
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <CalendarDays size={21} />
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Meetings
              </p>

              <p className="text-2xl font-bold text-slate-800">
                {
                  interactions.filter(
                    (i) => i.type === "Meeting"
                  ).length
                }
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
              <Mail size={21} />
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Emails
              </p>

              <p className="text-2xl font-bold text-slate-800">
                {
                  interactions.filter(
                    (i) => i.type === "Email"
                  ).length
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search + Type Filter */}
      <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search
              size={19}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search by customer, type or notes..."
              className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
            />
          </div>

          {/* Type filter tabs */}
          <div className="flex flex-wrap gap-2">
            {INTERACTION_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  typeFilter === t
                    ? "bg-blue-600 text-white"
                    : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Interaction List */}
      <div className="rounded-2xl bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5">
          <h2 className="text-lg font-bold text-slate-800">
            Interaction History
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {filteredInteractions.length} interaction
            {filteredInteractions.length !== 1 ? "s" : ""} found
          </p>
        </div>

        {loading ? (
          <div className="px-6 py-12 text-center text-slate-500">
            Loading interactions...
          </div>
        ) : filteredInteractions.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <MessageSquare size={25} />
            </div>

            <p className="mt-4 font-semibold text-slate-700">
              No interactions found
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {typeFilter !== "All"
                ? `No "${typeFilter}" interactions yet.`
                : "Click \"Record Interaction\" to add one."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredInteractions.map(
              (interaction) => (
                <div
                  key={interaction._id}
                  className="flex flex-col gap-4 px-6 py-5 transition hover:bg-slate-50 md:flex-row md:items-start md:justify-between"
                >
                  <div className="flex gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      {getInteractionIcon(
                        interaction.type
                      )}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-slate-800">
                          {
                            interaction.customer
                              .name
                          }
                        </h3>

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getTypeBadgeColor(interaction.type)}`}
                        >
                          {interaction.type}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-slate-500">
                        {
                          interaction.customer
                            .email
                        }
                      </p>

                      {interaction.notes && (
                        <p className="mt-2 text-sm text-slate-600">
                          {interaction.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right side — date + actions */}
                  <div className="flex shrink-0 items-start gap-3 md:flex-col md:items-end">
                    <div className="text-left md:text-right">
                      <p className="text-sm font-medium text-slate-700">
                        {new Date(
                          interaction.date
                        ).toLocaleString()}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Recorded by{" "}
                        {interaction.staff.name}
                      </p>
                    </div>

                    {/* Edit / Delete — only shown for the owner or Admin */}
                    {canModify(interaction) && (
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            openEditForm(interaction)
                          }
                          title="Edit interaction"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Pencil size={15} />
                        </button>

                        <button
                          onClick={() =>
                            handleDelete(interaction._id)
                          }
                          disabled={
                            deleting === interaction._id
                          }
                          title="Delete interaction"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Interactions;