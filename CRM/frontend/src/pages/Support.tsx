import {
  ArrowLeft,
  CalendarCheck,
  MessageCircle,
  Headphones,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

interface SupportProps {
  onBack: () => void;
  onNavigate: (page: string) => void;
}

function Support({ onBack, onNavigate }: SupportProps) {
  const supportModules = [
    {
      title: "Follow-ups",
      description:
        "Schedule reminders, track pending responses, and manage the next steps for customers.",
      page: "followups",
      label: "Open Follow-ups",
      Icon: CalendarCheck,
      iconClass: "bg-orange-50 text-orange-600",
    },
    {
      title: "Feedback & Issues",
      description:
        "Record customer feedback, complaints, and issues, then update their progress.",
      page: "feedback",
      label: "Open Feedback",
      Icon: MessageCircle,
      iconClass: "bg-purple-50 text-purple-600",
    },
    {
      title: "Retention",
      description:
        "Manage customer check-ins, special offers, and activities that help retain customers.",
      page: "retention",
      label: "Open Retention",
      Icon: RefreshCw,
      iconClass: "bg-green-50 text-green-600",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <button
        type="button"
        onClick={onBack}
        className="mb-6 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-x-1 hover:bg-slate-50"
      >
        <ArrowLeft size={18} />
        Back to Dashboard
      </button>

      <div className="mb-8">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Headphones size={25} />
        </div>
        <p className="text-sm font-medium text-blue-600">Customer Support</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">
          Support Center
        </h1>
        <p className="mt-2 max-w-2xl text-slate-500">
          Manage customer follow-ups, feedback, complaints, issues, and
          retention activities from one place.
        </p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-3">
        {supportModules.map(
          ({ title, description, page, label, Icon, iconClass }) => (
            <button
              key={page}
              type="button"
              onClick={() => onNavigate(page)}
              className="group rounded-2xl border border-slate-100 bg-white p-6 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
            >
              <div className="mb-5 flex items-center justify-between">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconClass}`}
                >
                  <Icon size={23} />
                </div>
                <ArrowRight
                  size={19}
                  className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-600"
                />
              </div>
              <h2 className="text-lg font-bold text-slate-800">{title}</h2>
              <p className="mt-2 min-h-16 text-sm leading-6 text-slate-500">
                {description}
              </p>
              <span className="mt-5 inline-flex rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition group-hover:bg-blue-700">
                {label}
              </span>
            </button>
          )
        )}
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-6">
        <h2 className="text-lg font-bold text-slate-800">How to use Support</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Create a Follow-up when a customer needs another response. Record
          complaints, issues, or suggestions in Feedback &amp; Issues and update
          their status as they are handled. Use Retention to record customer
          check-ins and retention activities. These pages show customers
          assigned to the Sales Staff member linked to this Support Staff
          account.
        </p>
      </div>
    </div>
  );
}

export default Support;
