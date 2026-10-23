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

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [customer, setCustomer] = useState("");
  const [type, setType] = useState<
    "Call" | "Email" | "Meeting" | "Chat" | "Other"
  >("Call");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");

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

  const handleAddInteraction = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:5000/api/interactions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            customer,
            type,
            date: date || new Date().toISOString(),
            notes,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to record interaction."
        );
      }

      setInteractions((previousInteractions) => [
        data.interaction,
        ...previousInteractions,
      ]);

      setCustomer("");
      setType("Call");
      setDate("");
      setNotes("");

      setShowForm(false);
      setSuccess(
        "Interaction recorded successfully."
      );

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          "Unable to record interaction."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const filteredInteractions =
    interactions.filter((interaction) => {
      const searchText = search.toLowerCase();

      return (
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
          .includes(searchText)
      );
    });

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
            Record and track customer interactions.
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
            onClick={() => {
              setShowForm(true);
              setError("");
              setSuccess("");
            }}
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

      {/* Add Interaction Form */}
      {showForm && (
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                Record Interaction
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Add a call, email, meeting or other
                customer interaction.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={20} />
            </button>
          </div>

          <form
            onSubmit={handleAddInteraction}
            className="grid grid-cols-1 gap-5 md:grid-cols-2"
          >
            {/* Customer */}
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
                Date & Time
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
            <div>
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
                {saving
                  ? "Saving..."
                  : "Save Interaction"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stats */}
      <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <MessageSquare size={21} />
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Total Interactions
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
                    (interaction) =>
                      interaction.type === "Call"
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
                    (interaction) =>
                      interaction.type === "Meeting"
                  ).length
                }
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
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search interactions by customer, type or notes..."
            className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
          />
        </div>
      </div>

      {/* Interaction List */}
      <div className="rounded-2xl bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5">
          <h2 className="text-lg font-bold text-slate-800">
            Interaction History
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Recent customer interactions
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
              Click "Record Interaction" to add one.
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

                        <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
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