import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarCheck,
  CheckCircle,
  Clock,
  RotateCcw,
  Search,
  X,
} from "lucide-react";

interface FollowUp {
  _id: string;
  customer: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
  staff: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  type: string;
  scheduledDate: string;
  notes?: string;
  status: string;
}

interface Customer {
  _id: string;
  name: string;
  email: string;
}

interface FollowUpsProps {
  onBack: () => void;
}

function FollowUps({ onBack }: FollowUpsProps) {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const [customer, setCustomer] = useState("");
  const [type, setType] = useState("Call");
  const [scheduledDate, setScheduledDate] = useState("");
  const [notes, setNotes] = useState("");

  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Reschedule popup state
  const [rescheduleId, setRescheduleId] =
    useState<string | null>(null);

  const [rescheduleDate, setRescheduleDate] =
    useState("");

  const [rescheduleLoading, setRescheduleLoading] =
    useState(false);

  const token = localStorage.getItem("token");

  const fetchFollowUps = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/followups",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setFollowUps(data.followUps || []);
      }
    } catch (error) {
      console.error(
        "Error fetching follow-ups:",
        error
      );
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const followUpResponse = await fetch(
          "http://localhost:5000/api/followups",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const followUpData =
          await followUpResponse.json();

        if (followUpResponse.ok) {
          setFollowUps(
            followUpData.followUps || []
          );
        }

        const customerResponse = await fetch(
          "http://localhost:5000/api/customers",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const customerData =
          await customerResponse.json();

        if (customerResponse.ok) {
          setCustomers(
            customerData.customers || []
          );
        }
      } catch (error) {
        console.error(
          "Error loading follow-up data:",
          error
        );
      }
    };

    loadInitialData();
  }, [token]);

  const handleSubmit = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    if (!customer || !type || !scheduledDate) {
      setMessage(
        "Please select a customer, type and date."
      );
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        "http://localhost:5000/api/followups",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            customer,
            type,
            scheduledDate,
            notes,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message ||
            "Failed to schedule follow-up."
        );
        return;
      }

      setMessage(
        "Follow-up scheduled successfully."
      );

      setCustomer("");
      setType("Call");
      setScheduledDate("");
      setNotes("");

      await fetchFollowUps();
    } catch (error) {
      console.error(
        "Create follow-up error:",
        error
      );

      setMessage(
        "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  };

  const completeFollowUp = async (
    id: string
  ) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/followups/${id}/complete`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message ||
            "Failed to complete follow-up."
        );
        return;
      }

      setMessage(
        "Follow-up marked as completed."
      );

      await fetchFollowUps();
    } catch (error) {
      console.error(
        "Complete follow-up error:",
        error
      );
    }
  };

  const openReschedule = (
    id: string,
    currentDate: string
  ) => {
    const date = new Date(currentDate);

    const year = date.getFullYear();
    const month = String(
      date.getMonth() + 1
    ).padStart(2, "0");
    const day = String(
      date.getDate()
    ).padStart(2, "0");
    const hours = String(
      date.getHours()
    ).padStart(2, "0");
    const minutes = String(
      date.getMinutes()
    ).padStart(2, "0");

    setRescheduleDate(
      `${year}-${month}-${day}T${hours}:${minutes}`
    );

    setRescheduleId(id);
    setMessage("");
  };

  const closeReschedule = () => {
    setRescheduleId(null);
    setRescheduleDate("");
    setRescheduleLoading(false);
  };

  const handleReschedule = async () => {
    if (!rescheduleId) {
      return;
    }

    if (!rescheduleDate) {
      setMessage(
        "Please select a new date and time."
      );
      return;
    }

    setRescheduleLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `http://localhost:5000/api/followups/${rescheduleId}/reschedule`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            scheduledDate: rescheduleDate,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message ||
            "Failed to reschedule follow-up."
        );
        return;
      }

      closeReschedule();

      setMessage(
        "Follow-up rescheduled successfully."
      );

      await fetchFollowUps();
    } catch (error) {
      console.error(
        "Reschedule follow-up error:",
        error
      );

      setMessage(
        "Unable to connect to the server."
      );
    } finally {
      setRescheduleLoading(false);
    }
  };

  const filteredFollowUps = followUps.filter(
    (followUp) =>
      followUp.customer.name
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      followUp.type
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      followUp.status
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  const scheduledCount = followUps.filter(
    (item) => item.status === "Scheduled"
  ).length;

  const completedCount = followUps.filter(
    (item) => item.status === "Completed"
  ).length;

  const overdueCount = followUps.filter(
    (item) => item.status === "Overdue"
  ).length;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  const getStatusClass = (status: string) => {
    if (status === "Completed") {
      return "bg-green-100 text-green-700";
    }

    if (status === "Overdue") {
      return "bg-red-100 text-red-700";
    }

    if (status === "Rescheduled") {
      return "bg-yellow-100 text-yellow-700";
    }

    return "bg-blue-100 text-blue-700";
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="border-b bg-white px-8 py-5">
        <button
          onClick={onBack}
          className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:-translate-x-1 hover:text-slate-900"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>

        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Follow-ups
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Schedule and manage customer follow-ups.
          </p>
        </div>
      </div>

      <div className="space-y-6 p-8">
        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  Scheduled
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {scheduledCount}
                </p>
              </div>

              <CalendarCheck
                className="text-blue-600"
                size={28}
              />
            </div>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  Completed
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {completedCount}
                </p>
              </div>

              <CheckCircle
                className="text-green-600"
                size={28}
              />
            </div>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  Overdue
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {overdueCount}
                </p>
              </div>

              <Clock
                className="text-red-600"
                size={28}
              />
            </div>
          </div>
        </div>

        {/* Schedule Follow-up */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Schedule Follow-up
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Create a new follow-up for a customer.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2"
          >
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Customer
              </label>

              <select
                value={customer}
                onChange={(event) =>
                  setCustomer(event.target.value)
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
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

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Follow-up Type
              </label>

              <select
                value={type}
                onChange={(event) =>
                  setType(event.target.value)
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
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

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Date & Time
              </label>

              <input
                type="datetime-local"
                value={scheduledDate}
                onChange={(event) =>
                  setScheduledDate(event.target.value)
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Notes
              </label>

              <input
                type="text"
                value={notes}
                onChange={(event) =>
                  setNotes(event.target.value)
                }
                placeholder="Enter follow-up notes"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Scheduling..."
                  : "Schedule Follow-up"}
              </button>
            </div>
          </form>

          {message && (
            <p className="mt-4 text-sm font-medium text-blue-600">
              {message}
            </p>
          )}
        </div>

        {/* Follow-up History */}
        <div className="rounded-xl border bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b p-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Follow-up History
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                View and manage scheduled customer follow-ups.
              </p>
            </div>

            <div className="relative w-full md:w-72">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search follow-ups..."
                className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {filteredFollowUps.length === 0 ? (
            <div className="p-10 text-center">
              <CalendarCheck
                size={42}
                className="mx-auto text-slate-300"
              />

              <p className="mt-3 font-medium text-slate-700">
                No follow-ups found
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Schedule your first follow-up above.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredFollowUps.map((followUp) => (
                <div
                  key={followUp._id}
                  className="p-6 transition hover:bg-slate-50"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50">
                        <CalendarCheck
                          size={20}
                          className="text-blue-600"
                        />
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-slate-900">
                            {followUp.customer.name}
                          </h3>

                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                            {followUp.type}
                          </span>

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(
                              followUp.status
                            )}`}
                          >
                            {followUp.status}
                          </span>
                        </div>

                        <p className="mt-1 text-sm text-slate-500">
                          {followUp.customer.email}
                        </p>

                        <p className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                          <Clock size={15} />
                          {formatDate(
                            followUp.scheduledDate
                          )}
                        </p>

                        {followUp.notes && (
                          <p className="mt-2 text-sm text-slate-600">
                            {followUp.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {followUp.status !==
                        "Completed" && (
                        <button
                          type="button"
                          onClick={() =>
                            completeFollowUp(
                              followUp._id
                            )
                          }
                          className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-green-700 transition hover:-translate-y-0.5 hover:bg-green-100 hover:shadow-sm"
                        >
                          <CheckCircle size={16} />
                          Complete
                        </button>
                      )}

                      {followUp.status !==
                        "Completed" && (
                        <button
                          type="button"
                          onClick={() =>
                            openReschedule(
                              followUp._id,
                              followUp.scheduledDate
                            )
                          }
                          className="flex items-center gap-2 rounded-lg bg-yellow-50 px-3 py-2 text-sm font-medium text-yellow-700 transition hover:-translate-y-0.5 hover:bg-yellow-100 hover:shadow-sm"
                        >
                          <RotateCcw size={16} />
                          Reschedule
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reschedule Modal */}
      {rescheduleId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Reschedule Follow-up
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Choose a new date and time.
                </p>
              </div>

              <button
                type="button"
                onClick={closeReschedule}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-6">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                New Date & Time
              </label>

              <input
                type="datetime-local"
                value={rescheduleDate}
                onChange={(event) =>
                  setRescheduleDate(
                    event.target.value
                  )
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeReschedule}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleReschedule}
                disabled={rescheduleLoading}
                className="rounded-lg bg-yellow-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-yellow-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {rescheduleLoading
                  ? "Saving..."
                  : "Save New Time"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FollowUps;