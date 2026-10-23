import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  HeartHandshake,
  CheckCircle,
  Clock,
  XCircle,
  Plus,
} from "lucide-react";

interface Customer {
  _id: string;
  name: string;
  email: string;
}

interface RetentionActivity {
  _id: string;
  customer: {
    _id: string;
    name: string;
    email: string;
  };
  staff: {
    name: string;
    role: string;
  };
  type:
    | "Follow-up"
    | "Special Offer"
    | "Loyalty Reward"
    | "Feedback Review"
    | "Check-in"
    | "Other";
  description: string;
  date: string;
  status: "Planned" | "Completed" | "Cancelled";
  createdAt: string;
}

interface RetentionProps {
  onBack: () => void;
}

function Retention({ onBack }: RetentionProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [activities, setActivities] = useState<
    RetentionActivity[]
  >([]);

  const [customer, setCustomer] = useState("");
  const [type, setType] = useState<
    | "Follow-up"
    | "Special Offer"
    | "Loyalty Reward"
    | "Feedback Review"
    | "Check-in"
    | "Other"
  >("Follow-up");

  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const token = localStorage.getItem("token");

  /*
   * Fetch customers
   */
  const fetchCustomers = useCallback(async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/customers",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setCustomers(data.customers || []);
      }
    } catch (error) {
      console.error(
        "Error fetching customers:",
        error
      );
    }
  }, [token]);

  /*
   * Fetch retention activities
   */
  const fetchActivities = useCallback(async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/retention",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setActivities(data.activities || []);
      }
    } catch (error) {
      console.error(
        "Error fetching retention activities:",
        error
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  /*
   * Load page data
   */
  useEffect(() => {
    const loadData = async () => {
      await fetchCustomers();
      await fetchActivities();
    };

    loadData();
  }, [fetchCustomers, fetchActivities]);

  /*
   * Create retention activity
   */
  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!customer || !description.trim()) {
      alert(
        "Please select a customer and enter a description."
      );
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(
        "http://localhost:5000/api/retention",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            customer,
            type,
            description,
            date: date || new Date().toISOString(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.message ||
            "Failed to create retention activity."
        );
        return;
      }

      alert(
        "Retention activity created successfully."
      );

      setCustomer("");
      setType("Follow-up");
      setDescription("");
      setDate("");

      await fetchActivities();
    } catch (error) {
      console.error(
        "Create retention activity error:",
        error
      );

      alert(
        "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  /*
   * Update activity status
   */
  const updateStatus = async (
    id: string,
    status: RetentionActivity["status"]
  ) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/retention/${id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.message ||
            "Failed to update activity status."
        );
        return;
      }

      await fetchActivities();
    } catch (error) {
      console.error(
        "Update retention status error:",
        error
      );

      alert("Something went wrong.");
    }
  };

  /*
   * Statistics
   */
  const plannedCount = activities.filter(
    (item) => item.status === "Planned"
  ).length;

  const completedCount = activities.filter(
    (item) => item.status === "Completed"
  ).length;

  const cancelledCount = activities.filter(
    (item) => item.status === "Cancelled"
  ).length;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <ArrowLeft size={22} />
            </button>

            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Customer Retention
              </h1>

              <p className="text-sm text-slate-500">
                Manage activities that help retain customers
              </p>
            </div>
          </div>

          <HeartHandshake
            size={30}
            className="text-indigo-600"
          />
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 p-6">
        {/* Statistics */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Planned */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  Planned
                </p>

                <p className="mt-1 text-3xl font-bold text-slate-900">
                  {plannedCount}
                </p>
              </div>

              <Clock
                size={30}
                className="text-amber-500"
              />
            </div>
          </div>

          {/* Completed */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  Completed
                </p>

                <p className="mt-1 text-3xl font-bold text-slate-900">
                  {completedCount}
                </p>
              </div>

              <CheckCircle
                size={30}
                className="text-green-500"
              />
            </div>
          </div>

          {/* Cancelled */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  Cancelled
                </p>

                <p className="mt-1 text-3xl font-bold text-slate-900">
                  {cancelledCount}
                </p>
              </div>

              <XCircle
                size={30}
                className="text-red-500"
              />
            </div>
          </div>
        </div>

        {/* Create Retention Activity */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-lg bg-indigo-50 p-2">
              <Plus
                size={20}
                className="text-indigo-600"
              />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Create Retention Activity
              </h2>

              <p className="text-sm text-slate-500">
                Plan an activity to maintain customer relationships
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 gap-4 md:grid-cols-2"
          >
            {/* Customer */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Customer *
              </label>

              <select
                value={customer}
                onChange={(e) =>
                  setCustomer(e.target.value)
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">
                  Select customer
                </option>

                {customers.map((item) => (
                  <option
                    key={item._id}
                    value={item._id}
                  >
                    {item.name} — {item.email}
                  </option>
                ))}
              </select>
            </div>

            {/* Activity Type */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Activity Type *
              </label>

              <select
                value={type}
                onChange={(e) =>
                  setType(
                    e.target.value as RetentionActivity["type"]
                  )
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="Follow-up">
                  Follow-up
                </option>

                <option value="Special Offer">
                  Special Offer
                </option>

                <option value="Loyalty Reward">
                  Loyalty Reward
                </option>

                <option value="Feedback Review">
                  Feedback Review
                </option>

                <option value="Check-in">
                  Check-in
                </option>

                <option value="Other">
                  Other
                </option>
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Activity Date
              </label>

              <input
                type="datetime-local"
                value={date}
                onChange={(e) =>
                  setDate(e.target.value)
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            {/* Description */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Description *
              </label>

              <input
                type="text"
                value={description}
                onChange={(e) =>
                  setDescription(e.target.value)
                }
                placeholder="Enter retention activity details"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            {/* Submit */}
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white transition hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting
                  ? "Creating..."
                  : "Create Activity"}
              </button>
            </div>
          </form>
        </div>

        {/* Retention History */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Retention Activity History
            </h2>

            <p className="text-sm text-slate-500">
              View and manage customer retention activities
            </p>
          </div>

          {loading ? (
            <div className="py-10 text-center text-slate-500">
              Loading retention activities...
            </div>
          ) : activities.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 py-10 text-center">
              <HeartHandshake
                size={35}
                className="mx-auto mb-3 text-slate-400"
              />

              <p className="font-medium text-slate-600">
                No retention activities yet
              </p>

              <p className="mt-1 text-sm text-slate-400">
                Created activities will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((item) => (
                <div
                  key={item._id}
                  className="rounded-xl border border-slate-200 p-5 transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="flex flex-col justify-between gap-4 md:flex-row">
                    <div className="flex-1">
                      {/* Badges */}
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                          {item.type}
                        </span>

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          {item.status}
                        </span>
                      </div>

                      {/* Description */}
                      <h3 className="text-lg font-semibold text-slate-900">
                        {item.description}
                      </h3>

                      {/* Customer */}
                      <div className="mt-3 text-sm text-slate-500">
                        <span className="font-medium text-slate-700">
                          Customer:
                        </span>{" "}
                        {item.customer?.name}
                      </div>

                      {/* Activity Date */}
                      <div className="mt-1 text-sm text-slate-500">
                        <span className="font-medium text-slate-700">
                          Activity Date:
                        </span>{" "}
                        {new Date(
                          item.date
                        ).toLocaleString()}
                      </div>

                      {/* Created Date */}
                      <div className="mt-1 text-xs text-slate-400">
                        Created:{" "}
                        {new Date(
                          item.createdAt
                        ).toLocaleString()}
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex min-w-[180px] flex-col gap-2">
                      <label className="text-xs font-medium text-slate-500">
                        Update Status
                      </label>

                      <select
                        value={item.status}
                        onChange={(e) =>
                          updateStatus(
                            item._id,
                            e.target.value as RetentionActivity["status"]
                          )
                        }
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                      >
                        <option value="Planned">
                          Planned
                        </option>

                        <option value="Completed">
                          Completed
                        </option>

                        <option value="Cancelled">
                          Cancelled
                        </option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Retention;