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
} from "lucide-react";

interface Lead {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  source: string;
  status: "New" | "Contacted" | "Qualified" | "Converted" | "Lost";
  notes?: string;
  assignedTo?: {
    name: string;
    email: string;
    role: string;
  };
  createdAt: string;
}

interface LeadsProps {
  onBack: () => void;
}

function Leads({ onBack }: LeadsProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [source, setSource] = useState("Website");
  const [notes, setNotes] = useState("");

  const [convertingId, setConvertingId] = useState<string | null>(null);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:5000/api/leads",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load leads."
        );
      }

      setLeads(data.leads || []);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unable to load leads.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadLeads = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await fetch(
          "http://localhost:5000/api/leads",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load leads."
          );
        }

        setLeads(data.leads || []);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Unable to load leads.");
        }
      } finally {
        setLoading(false);
      }
    };

    loadLeads();
  }, []);

  const handleAddLead = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:5000/api/leads",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name,
            email,
            phone,
            source,
            notes,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to create lead."
        );
      }

      setLeads((previousLeads) => [
        data.lead,
        ...previousLeads,
      ]);

      setName("");
      setEmail("");
      setPhone("");
      setSource("Website");
      setNotes("");

      setShowForm(false);
      setSuccess("Lead added successfully.");

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unable to create lead.");
      }
    } finally {
      setSaving(false);
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

      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:5000/api/leads/${leadId}/convert`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to convert lead."
        );
      }

      setLeads((previousLeads) =>
        previousLeads.map((lead) =>
          lead._id === leadId
            ? {
                ...lead,
                status: "Converted",
              }
            : lead
        )
      );

      setSuccess(
        `${data.customer.name} has been converted into a customer.`
      );

      setTimeout(() => {
        setSuccess("");
      }, 4000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unable to convert lead.");
      }
    } finally {
      setConvertingId(null);
    }
  };

  const filteredLeads = leads.filter(
    (lead) =>
      lead.name
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      lead.email
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      (lead.phone || "").includes(search)
  );

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
            onClick={fetchLeads}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
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
      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </div>
      )}

      {/* Add Lead Form */}
      {showForm && (
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                Add New Lead
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Enter the potential customer's information.
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
            onSubmit={handleAddLead}
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
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
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
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
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
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Lead Source
              </label>

              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              >
                <option value="Website">Website</option>
                <option value="Social Media">Social Media</option>
                <option value="Referral">Referral</option>
                <option value="Advertisement">
                  Advertisement
                </option>
                <option value="Campaign">Campaign</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Notes
              </label>

              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes about the lead"
                rows={3}
                className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              />
            </div>

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
                {saving ? "Saving..." : "Save Lead"}
              </button>
            </div>
          </form>
        </div>
      )}

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
            placeholder="Search leads by name, email or phone..."
            className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
          />
        </div>
      </div>

      {/* Lead List */}
      <div className="rounded-2xl bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5">
          <h2 className="text-lg font-bold text-slate-800">
            Lead List
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Potential customers stored in the CRM
          </p>
        </div>

        {loading ? (
          <div className="px-6 py-12 text-center text-slate-500">
            Loading leads...
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <UserPlus size={25} />
            </div>

            <p className="mt-4 font-semibold text-slate-700">
              No leads found
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Click "Add Lead" to create your first lead.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredLeads.map((lead) => (
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
                    </p>
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

                  {lead.status !== "Converted" &&
                    lead.status !== "Lost" && (
                      <button
                        onClick={() =>
                          handleConvert(lead._id)
                        }
                        disabled={
                          convertingId === lead._id
                        }
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