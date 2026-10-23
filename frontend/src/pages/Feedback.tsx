import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  MessageSquareText,
  AlertCircle,
  CheckCircle,
  Clock,
  Plus,
} from "lucide-react";

interface Customer {
  _id: string;
  name: string;
  email: string;
}

interface FeedbackItem {
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
  type: "Feedback" | "Complaint" | "Issue";
  subject: string;
  description: string;
  status: "Open" | "In Progress" | "Resolved" | "Closed";
  priority: "Low" | "Medium" | "High";
  createdAt: string;
}

interface FeedbackProps {
  onBack: () => void;
}

function Feedback({ onBack }: FeedbackProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);

  const [customer, setCustomer] = useState("");
  const [type, setType] = useState<
    "Feedback" | "Complaint" | "Issue"
  >("Feedback");

  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");

  const [priority, setPriority] = useState<
    "Low" | "Medium" | "High"
  >("Medium");

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
   * Fetch feedback
   */
  const fetchFeedback = useCallback(async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/feedback",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setFeedbackList(data.feedback || []);
      }
    } catch (error) {
      console.error(
        "Error fetching feedback:",
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
      await fetchFeedback();
    };

    loadData();
  }, [fetchCustomers, fetchFeedback]);

  /*
   * Submit feedback
   */
  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (
      !customer ||
      !subject.trim() ||
      !description.trim()
    ) {
      alert("Please fill all required fields.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(
        "http://localhost:5000/api/feedback",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            customer,
            type,
            subject,
            description,
            priority,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.message ||
            "Failed to submit feedback."
        );
        return;
      }

      alert("Feedback submitted successfully.");

      setCustomer("");
      setType("Feedback");
      setSubject("");
      setDescription("");
      setPriority("Medium");

      await fetchFeedback();
    } catch (error) {
      console.error(
        "Submit feedback error:",
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
   * Update feedback status
   */
  const updateStatus = async (
    id: string,
    status: FeedbackItem["status"]
  ) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/feedback/${id}/status`,
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
            "Failed to update status."
        );
        return;
      }

      await fetchFeedback();
    } catch (error) {
      console.error(
        "Update status error:",
        error
      );

      alert("Something went wrong.");
    }
  };

  /*
   * Statistics
   */
  const openCount = feedbackList.filter(
    (item) => item.status === "Open"
  ).length;

  const inProgressCount = feedbackList.filter(
    (item) => item.status === "In Progress"
  ).length;

  const resolvedCount = feedbackList.filter(
    (item) =>
      item.status === "Resolved" ||
      item.status === "Closed"
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
                Feedback & Issues
              </h1>

              <p className="text-sm text-slate-500">
                Manage customer feedback, complaints
                and issues
              </p>
            </div>
          </div>

          <MessageSquareText
            size={30}
            className="text-indigo-600"
          />
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 p-6">
        {/* Statistics */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Open */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  Open
                </p>

                <p className="mt-1 text-3xl font-bold text-slate-900">
                  {openCount}
                </p>
              </div>

              <AlertCircle
                size={30}
                className="text-red-500"
              />
            </div>
          </div>

          {/* In Progress */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  In Progress
                </p>

                <p className="mt-1 text-3xl font-bold text-slate-900">
                  {inProgressCount}
                </p>
              </div>

              <Clock
                size={30}
                className="text-amber-500"
              />
            </div>
          </div>

          {/* Resolved */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  Resolved / Closed
                </p>

                <p className="mt-1 text-3xl font-bold text-slate-900">
                  {resolvedCount}
                </p>
              </div>

              <CheckCircle
                size={30}
                className="text-green-500"
              />
            </div>
          </div>
        </div>

        {/* Submit Feedback */}
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
                Submit Feedback / Issue
              </h2>

              <p className="text-sm text-slate-500">
                Record a customer complaint, issue or
                feedback
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

            {/* Type */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Type *
              </label>

              <select
                value={type}
                onChange={(e) =>
                  setType(
                    e.target.value as
                      | "Feedback"
                      | "Complaint"
                      | "Issue"
                  )
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="Feedback">
                  Feedback
                </option>

                <option value="Complaint">
                  Complaint
                </option>

                <option value="Issue">
                  Issue
                </option>
              </select>
            </div>

            {/* Subject */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Subject *
              </label>

              <input
                type="text"
                value={subject}
                onChange={(e) =>
                  setSubject(e.target.value)
                }
                placeholder="Enter subject"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            {/* Priority */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Priority
              </label>

              <select
                value={priority}
                onChange={(e) =>
                  setPriority(
                    e.target.value as
                      | "Low"
                      | "Medium"
                      | "High"
                  )
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="Low">
                  Low
                </option>

                <option value="Medium">
                  Medium
                </option>

                <option value="High">
                  High
                </option>
              </select>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Description *
              </label>

              <textarea
                value={description}
                onChange={(e) =>
                  setDescription(e.target.value)
                }
                placeholder="Describe the feedback, complaint or issue..."
                rows={4}
                className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
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
                  ? "Submitting..."
                  : "Submit Feedback"}
              </button>
            </div>
          </form>
        </div>

        {/* Feedback History */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Feedback & Issue History
            </h2>

            <p className="text-sm text-slate-500">
              View and manage submitted customer
              feedback
            </p>
          </div>

          {loading ? (
            <div className="py-10 text-center text-slate-500">
              Loading feedback...
            </div>
          ) : feedbackList.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 py-10 text-center">
              <MessageSquareText
                size={35}
                className="mx-auto mb-3 text-slate-400"
              />

              <p className="font-medium text-slate-600">
                No feedback or issues yet
              </p>

              <p className="mt-1 text-sm text-slate-400">
                Submitted feedback will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {feedbackList.map((item) => (
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

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            item.priority === "High"
                              ? "bg-red-50 text-red-700"
                              : item.priority ===
                                "Medium"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-green-50 text-green-700"
                          }`}
                        >
                          {item.priority} Priority
                        </span>

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          {item.status}
                        </span>
                      </div>

                      {/* Subject */}
                      <h3 className="text-lg font-semibold text-slate-900">
                        {item.subject}
                      </h3>

                      {/* Description */}
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {item.description}
                      </p>

                      {/* Customer */}
                      <div className="mt-4 text-sm text-slate-500">
                        <span className="font-medium text-slate-700">
                          Customer:
                        </span>{" "}
                        {item.customer?.name}
                      </div>

                      {/* Date */}
                      <div className="mt-1 text-xs text-slate-400">
                        {new Date(
                          item.createdAt
                        ).toLocaleString()}
                      </div>
                    </div>

                    {/* Status Controls */}
                    <div className="flex min-w-[180px] flex-col gap-2">
                      <label className="text-xs font-medium text-slate-500">
                        Update Status
                      </label>

                      <select
                        value={item.status}
                        onChange={(e) =>
                          updateStatus(
                            item._id,
                            e.target.value as FeedbackItem["status"]
                          )
                        }
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                      >
                        <option value="Open">
                          Open
                        </option>

                        <option value="In Progress">
                          In Progress
                        </option>

                        <option value="Resolved">
                          Resolved
                        </option>

                        <option value="Closed">
                          Closed
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

export default Feedback;