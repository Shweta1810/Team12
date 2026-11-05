
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Trash2,
  User,
  Mail,
  Calendar,
  FileText,
} from "lucide-react";

interface DeletionRequest {
  _id: string;
  customer: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  } | null;
  requestedBy: {
    _id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
  reviewedBy?: {
    name: string;
    email: string;
  } | null;
  reviewedAt?: string | null;
  reviewNotes?: string;
  createdAt: string;
}

interface DeletionRequestsProps {
  onBack: () => void;
}

interface ApiResponse {
  message?: string;
  requests?: DeletionRequest[];
}

const API_URL = "http://localhost:5000/api/customers";

function getToken(): string | null {
  return (
    sessionStorage.getItem("token") ||
    localStorage.getItem("token")
  );
}

function DeletionRequests({
  onBack,
}: DeletionRequestsProps) {
  const [requests, setRequests] = useState<DeletionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filter, setFilter] = useState<
    "Pending" | "Approved" | "Rejected"
  >("Pending");

  /*
   * Load deletion requests from the backend.
   */
  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      if (!token) {
        throw new Error("Please log in again.");
      }

      const response = await fetch(
        `${API_URL}/deletion-requests/all`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data: ApiResponse = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load deletion requests."
        );
      }

      setRequests(data.requests || []);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load deletion requests."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  /*
   * Load requests when this page opens.
   *
   * The timeout allows the effect to finish before
   * starting the asynchronous request.
   */
  useEffect(() => {
    let cancelled = false;

    const timer = window.setTimeout(() => {
      if (!cancelled) {
        void fetchRequests();
      }
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [fetchRequests]);

  /*
   * Approve or reject a deletion request.
   */
  const reviewRequest = async (
    request: DeletionRequest,
    decision: "Approved" | "Rejected"
  ) => {
    if (!request.customer) {
      setError(
        "The customer record is missing. This request needs investigation."
      );
      return;
    }

    const action =
      decision === "Approved" ? "approve and delete" : "reject";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} the deletion request for ${request.customer.name}?`
    );

    if (!confirmed) {
      return;
    }

    // Review notes are optional. Do not use window.prompt here because
    // browser prompts can be suppressed and cancel the approval flow.
    const reviewNotes = "";

    try {
      setProcessingId(request._id);
      setError("");
      setSuccess("");

      const token = getToken();

      if (!token) {
        throw new Error("Please log in again.");
      }

      const response = await fetch(
        `${API_URL}/deletion-requests/${request._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            decision,
            reviewNotes,
          }),
        }
      );

      const data: ApiResponse = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to review the request."
        );
      }

      setSuccess(
        data.message ||
          `Deletion request ${decision.toLowerCase()} successfully.`
      );

      await fetchRequests();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to review the request."
      );
    } finally {
      setProcessingId("");
    }
  };

  const pendingCount = requests.filter(
    (request) => request.status === "Pending"
  ).length;

  const approvedCount = requests.filter(
    (request) => request.status === "Approved"
  ).length;

  const rejectedCount = requests.filter(
    (request) => request.status === "Rejected"
  ).length;

  const visibleRequests = requests.filter(
    (request) => request.status === filter
  );

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

      {/* Page heading */}
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-sm font-medium text-blue-600">
            Administration
          </p>

          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            Customer Deletion Requests
          </h1>

          <p className="mt-2 text-slate-500">
            Review requests submitted by Sales Staff.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void fetchRequests()}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      {/* Success message */}
      {success && (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          {success}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </div>
      )}

      {/* Statistics */}
      <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
              <Clock size={21} />
            </div>

            <div>
              <p className="text-sm text-slate-500">Pending</p>
              <p className="text-2xl font-bold text-slate-800">
                {pendingCount}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-600">
              <CheckCircle size={21} />
            </div>

            <div>
              <p className="text-sm text-slate-500">Approved</p>
              <p className="text-2xl font-bold text-slate-800">
                {approvedCount}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <XCircle size={21} />
            </div>

            <div>
              <p className="text-sm text-slate-500">Rejected</p>
              <p className="text-2xl font-bold text-slate-800">
                {rejectedCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Request filters */}
      <div className="mb-6 flex flex-wrap gap-3">
        {(["Pending", "Approved", "Rejected"] as const).map(
          (status) => (
            <button
              key={status}
              type="button"
              onClick={() => setFilter(status)}
              className={`rounded-xl px-5 py-3 text-sm font-semibold transition ${
                filter === status
                  ? "bg-blue-600 text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {status}
            </button>
          )
        )}
      </div>

      {/* Requests list */}
      <div className="rounded-2xl bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5">
          <h2 className="text-lg font-bold text-slate-800">
            {filter} Requests
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Review customer deletion requests and their history.
          </p>
        </div>

        {loading ? (
          <div className="px-6 py-12 text-center text-slate-500">
            Loading deletion requests...
          </div>
        ) : visibleRequests.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <FileText
              size={32}
              className="mx-auto text-slate-300"
            />

            <p className="mt-4 font-semibold text-slate-700">
              No {filter.toLowerCase()} requests
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Requests will appear here when available.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {visibleRequests.map((request) => (
              <div
                key={request._id}
                className="p-6 transition hover:bg-slate-50"
              >
                <div className="flex flex-col justify-between gap-4 lg:flex-row">
                  {/* Customer and request details */}
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <User size={22} />
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-slate-800">
                          {request.customer?.name ||
                            "Customer record unavailable"}
                        </h3>

                        <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                          <Mail size={15} />
                          {request.customer?.email ||
                            "No email available"}
                        </p>

                        {request.customer?.phone && (
                          <p className="mt-1 text-sm text-slate-500">
                            Phone: {request.customer.phone}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Requested By
                      </p>

                      <p className="mt-2 font-semibold text-slate-700">
                        {request.requestedBy?.name ||
                          "Unknown staff"}
                      </p>

                      <p className="text-sm text-slate-500">
                        {request.requestedBy?.email ||
                          "No email available"}
                      </p>

                      <p className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                        <Calendar size={15} />
                        {new Date(request.createdAt).toLocaleString()}
                      </p>

                      <p className="mt-3 text-sm text-slate-600">
                        <span className="font-semibold">Reason: </span>
                        {request.reason || "No reason provided"}
                      </p>

                      {request.reviewNotes && (
                        <p className="mt-2 text-sm text-slate-600">
                          <span className="font-semibold">
                            Admin notes:{" "}
                          </span>
                          {request.reviewNotes}
                        </p>
                      )}

                      {request.reviewedBy && (
                        <p className="mt-2 text-sm text-slate-500">
                          Reviewed by: {request.reviewedBy.name}
                        </p>
                      )}

                      {request.reviewedAt && (
                        <p className="mt-1 text-sm text-slate-500">
                          Reviewed on:{" "}
                          {new Date(
                            request.reviewedAt
                          ).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Status and Admin actions */}
                  <div className="flex flex-col items-start gap-3 lg:items-end">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        request.status === "Pending"
                          ? "bg-orange-100 text-orange-700"
                          : request.status === "Approved"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {request.status}
                    </span>

                    {request.status === "Pending" && (
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            void reviewRequest(
                              request,
                              "Approved"
                            )
                          }
                          disabled={
                            processingId === request._id
                          }
                          className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
                        >
                          <Trash2 size={16} />

                          {processingId === request._id
                            ? "Processing..."
                            : "Approve & Delete"}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            void reviewRequest(
                              request,
                              "Rejected"
                            )
                          }
                          disabled={
                            processingId === request._id
                          }
                          className="flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                        >
                          <XCircle size={16} />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default DeletionRequests;

