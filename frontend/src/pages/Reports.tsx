import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  RefreshCw,
  Users,
  UserPlus,
  MessageSquare,
  CalendarCheck,
  MessageCircle,
  HeartHandshake,
  Award,
  ShoppingCart,
  IndianRupee,
} from "lucide-react";

interface ReportsProps {
  onBack: () => void;
}

interface ReportData {
  summary: {
    totalLeads: number;
    totalCustomers: number;
    totalInteractions: number;
    totalFollowUps: number;
    totalFeedback: number;
    totalRetentionActivities: number;
    totalLoyaltyAccounts: number;
    totalSales: number;
    paidSales: number;
    pendingSales: number;
  };

  sales: {
    totalSales: number;
    paidSales: number;
    pendingSales: number;
    totalRevenue: number;
    totalAmount: number;
    byStatus: {
      Pending: number;
      Paid: number;
      Cancelled: number;
    };
  };

  leads: {
    byStatus: {
      New: number;
      Contacted: number;
      Qualified: number;
      Converted: number;
      Lost: number;
    };
  };

  feedback: {
    byStatus: {
      Open: number;
      "In Progress": number;
      Resolved: number;
      Closed: number;
    };
  };

  followUps: {
    byStatus: {
      Scheduled: number;
      Completed: number;
      Rescheduled: number;
      Overdue: number;
    };
  };

  retention: {
    byStatus: {
      Planned: number;
      Completed: number;
      Cancelled: number;
    };
  };

  loyalty: {
    totalPoints: number;
    totalEarned: number;
    totalRedeemed: number;
    byTier: {
      Bronze: number;
      Silver: number;
      Gold: number;
      Platinum: number;
    };
  };
}

function Reports({ onBack }: ReportsProps) {
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token =
    sessionStorage.getItem("token") ||
    localStorage.getItem("token");

  const loadReport = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://localhost:5000/api/reports",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load reports."
        );
      }

      setReport(data);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to load reports.";

      setError(message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadReport();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadReport]);

  const handleRefresh = () => {
    setLoading(true);
    void loadReport();
  };

  const formatCurrency = (value: number) => {
    return `₹${value.toLocaleString("en-IN")}`;
  };

  if (loading && !report) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-3 text-slate-600">
            Loading reports...
          </p>
        </div>
      </div>
    );
  }

  if (error && !report) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-5">
          {error}
        </div>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-3"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-xl">
              <BarChart3 className="w-7 h-7 text-blue-600" />
            </div>

            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Reports
              </h1>
              <p className="text-slate-500">
                Current CRM performance and activity summary
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
        >
          <RefreshCw
            className={`w-4 h-4 ${
              loading ? "animate-spin" : ""
            }`}
          />
          Refresh
        </button>
      </div>

      {/* Main Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <SummaryCard
          title="Total Leads"
          value={report.summary.totalLeads}
          icon={<UserPlus className="w-6 h-6" />}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
        />

        <SummaryCard
          title="Total Customers"
          value={report.summary.totalCustomers}
          icon={<Users className="w-6 h-6" />}
          iconBg="bg-green-100"
          iconColor="text-green-600"
        />

        <SummaryCard
          title="Total Sales"
          value={report.sales.totalSales}
          icon={<ShoppingCart className="w-6 h-6" />}
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
        />

        <SummaryCard
          title="Paid Revenue"
          value={formatCurrency(report.sales.totalRevenue)}
          icon={<IndianRupee className="w-6 h-6" />}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
        />
      </div>

      {/* Sales Report */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-purple-100 rounded-xl">
            <ShoppingCart className="w-6 h-6 text-purple-600" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Sales Report
            </h2>
            <p className="text-sm text-slate-500">
              Sales and payment performance
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <ReportBox
            title="Total Sales"
            value={report.sales.totalSales}
          />

          <ReportBox
            title="Paid Sales"
            value={report.sales.paidSales}
          />

          <ReportBox
            title="Pending Sales"
            value={report.sales.pendingSales}
          />

          <ReportBox
            title="Paid Revenue"
            value={formatCurrency(report.sales.totalRevenue)}
          />
        </div>

        <div className="mt-6">
          <h3 className="font-semibold text-slate-800 mb-3">
            Payment Status
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <StatusBox
              label="Paid"
              value={report.sales.byStatus.Paid}
            />

            <StatusBox
              label="Pending"
              value={report.sales.byStatus.Pending}
            />

            <StatusBox
              label="Cancelled"
              value={report.sales.byStatus.Cancelled}
            />
          </div>
        </div>
      </section>

      {/* Lead Report */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
        <SectionTitle
          icon={<UserPlus className="w-6 h-6 text-blue-600" />}
          title="Lead Report"
          subtitle="Lead distribution by status"
        />

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatusBox
            label="New"
            value={report.leads.byStatus.New}
          />

          <StatusBox
            label="Contacted"
            value={report.leads.byStatus.Contacted}
          />

          <StatusBox
            label="Qualified"
            value={report.leads.byStatus.Qualified}
          />

          <StatusBox
            label="Converted"
            value={report.leads.byStatus.Converted}
          />

          <StatusBox
            label="Lost"
            value={report.leads.byStatus.Lost}
          />
        </div>
      </section>

      {/* Activity Summary */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
        <SectionTitle
          icon={<BarChart3 className="w-6 h-6 text-indigo-600" />}
          title="Activity Summary"
          subtitle="CRM activity from the current database"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <ReportBox
            title="Interactions"
            value={report.summary.totalInteractions}
            icon={<MessageSquare className="w-5 h-5" />}
          />

          <ReportBox
            title="Follow-ups"
            value={report.summary.totalFollowUps}
            icon={<CalendarCheck className="w-5 h-5" />}
          />

          <ReportBox
            title="Feedback"
            value={report.summary.totalFeedback}
            icon={<MessageCircle className="w-5 h-5" />}
          />

          <ReportBox
            title="Retention Activities"
            value={report.summary.totalRetentionActivities}
            icon={<HeartHandshake className="w-5 h-5" />}
          />
        </div>
      </section>

      {/* Follow-ups & Feedback */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <SectionTitle
            icon={<CalendarCheck className="w-6 h-6 text-orange-600" />}
            title="Follow-up Status"
            subtitle="Current follow-up distribution"
          />

          <div className="space-y-3">
            <StatusRow
              label="Scheduled"
              value={report.followUps.byStatus.Scheduled}
            />

            <StatusRow
              label="Completed"
              value={report.followUps.byStatus.Completed}
            />

            <StatusRow
              label="Rescheduled"
              value={report.followUps.byStatus.Rescheduled}
            />

            <StatusRow
              label="Overdue"
              value={report.followUps.byStatus.Overdue}
            />
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <SectionTitle
            icon={<MessageCircle className="w-6 h-6 text-pink-600" />}
            title="Feedback Status"
            subtitle="Current feedback distribution"
          />

          <div className="space-y-3">
            <StatusRow
              label="Open"
              value={report.feedback.byStatus.Open}
            />

            <StatusRow
              label="In Progress"
              value={report.feedback.byStatus["In Progress"]}
            />

            <StatusRow
              label="Resolved"
              value={report.feedback.byStatus.Resolved}
            />

            <StatusRow
              label="Closed"
              value={report.feedback.byStatus.Closed}
            />
          </div>
        </section>
      </div>

      {/* Retention & Loyalty */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <SectionTitle
            icon={<HeartHandshake className="w-6 h-6 text-green-600" />}
            title="Retention"
            subtitle="Retention activity status"
          />

          <div className="space-y-3">
            <StatusRow
              label="Planned"
              value={report.retention.byStatus.Planned}
            />

            <StatusRow
              label="Completed"
              value={report.retention.byStatus.Completed}
            />

            <StatusRow
              label="Cancelled"
              value={report.retention.byStatus.Cancelled}
            />
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <SectionTitle
            icon={<Award className="w-6 h-6 text-yellow-600" />}
            title="Loyalty"
            subtitle="Points and customer tier summary"
          />

          <div className="grid grid-cols-2 gap-3 mb-5">
            <ReportBox
              title="Current Points"
              value={report.loyalty.totalPoints}
            />

            <ReportBox
              title="Points Earned"
              value={report.loyalty.totalEarned}
            />

            <ReportBox
              title="Points Redeemed"
              value={report.loyalty.totalRedeemed}
            />

            <ReportBox
              title="Accounts"
              value={report.summary.totalLoyaltyAccounts}
            />
          </div>

          <h3 className="font-semibold text-slate-800 mb-3">
            Loyalty Tiers
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <StatusBox
              label="Bronze"
              value={report.loyalty.byTier.Bronze}
            />

            <StatusBox
              label="Silver"
              value={report.loyalty.byTier.Silver}
            />

            <StatusBox
              label="Gold"
              value={report.loyalty.byTier.Gold}
            />

            <StatusBox
              label="Platinum"
              value={report.loyalty.byTier.Platinum}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  icon,
  iconBg,
  iconColor,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {value}
          </p>
        </div>

        <div className={`p-3 rounded-xl ${iconBg} ${iconColor}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function SectionTitle({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div>{icon}</div>

      <div>
        <h2 className="text-xl font-bold text-slate-900">
          {title}
        </h2>

        <p className="text-sm text-slate-500">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

function ReportBox({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
}) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{title}</p>

        {icon && (
          <span className="text-slate-400">
            {icon}
          </span>
        )}
      </div>

      <p className="text-xl font-bold text-slate-900 mt-2">
        {value}
      </p>
    </div>
  );
}

function StatusBox({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
      <p className="text-sm text-slate-500">{label}</p>

      <p className="text-xl font-bold text-slate-900 mt-1">
        {value}
      </p>
    </div>
  );
}

function StatusRow({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
      <span className="text-slate-700">{label}</span>

      <span className="font-bold text-slate-900">
        {value}
      </span>
    </div>
  );
}

export default Reports;