import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Gift,
  Plus,
  RefreshCw,
  Star,
  Trophy,
  Users,
  X,
} from "lucide-react";

interface Customer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
}

interface LoyaltyAccount {
  _id: string;
  customer: Customer;
  points: number;
  tier: "Bronze" | "Silver" | "Gold" | "Platinum";
  totalEarned: number;
  totalRedeemed: number;
  lastActivityDate?: string;
}

interface LoyaltyProps {
  onBack: () => void;
}

function Loyalty({ onBack }: LoyaltyProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [accounts, setAccounts] = useState<LoyaltyAccount[]>([]);

  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [points, setPoints] = useState("");
  const [redeemPoints, setRedeemPoints] = useState("");

  const [showAddPointsModal, setShowAddPointsModal] =
    useState(false);

  const [showRedeemModal, setShowRedeemModal] =
    useState(false);

  const [selectedAccount, setSelectedAccount] =
    useState<LoyaltyAccount | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const token =
    sessionStorage.getItem("token") ||
    localStorage.getItem("token");

  /*
    FIX:
    getHeaders is wrapped in useCallback so that React's
    exhaustive-deps rule is satisfied.
  */
  const getHeaders = useCallback(() => {
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }, [token]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [customerResponse, loyaltyResponse] =
        await Promise.all([
          fetch("http://localhost:5000/api/customers", {
            headers: getHeaders(),
          }),

          fetch("http://localhost:5000/api/loyalty", {
            headers: getHeaders(),
          }),
        ]);

      const customerData = await customerResponse.json();
      const loyaltyData = await loyaltyResponse.json();

      // Load customers
      if (customerResponse.ok) {
        const customerList = Array.isArray(customerData)
          ? customerData
          : Array.isArray(customerData.customers)
            ? customerData.customers
            : [];

        setCustomers(customerList);
      } else {
        setCustomers([]);

        setError(
          customerData.message ||
            "Unable to load customers."
        );
      }

      // Load loyalty accounts
      if (loyaltyResponse.ok) {
        const accountList = Array.isArray(loyaltyData)
          ? loyaltyData
          : Array.isArray(loyaltyData.accounts)
            ? loyaltyData.accounts
            : [];

        setAccounts(accountList);
      } else {
        setAccounts([]);

        setError(
          loyaltyData.message ||
            "Unable to load loyalty accounts."
        );
      }
    } catch (error) {
      console.error("Load loyalty data error:", error);

      setError(
        "Unable to connect to the backend. Please make sure the server is running."
      );
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadData]);

  const handleCreateAccount = async () => {
    if (!selectedCustomer) {
      alert("Please select a customer.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        "http://localhost:5000/api/loyalty",
        {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({
            customer: selectedCustomer,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.message ||
            "Unable to create loyalty account."
        );
        return;
      }

      alert("Loyalty account created successfully!");

      setSelectedCustomer("");

      await loadData();
    } catch (error) {
      console.error(
        "Create loyalty account error:",
        error
      );

      alert("Unable to connect to the server.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddPoints = async () => {
    if (!selectedAccount) {
      return;
    }

    const pointsNumber = Number(points);

    if (
      !Number.isInteger(pointsNumber) ||
      pointsNumber <= 0
    ) {
      alert("Please enter a positive whole number of points.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `http://localhost:5000/api/loyalty/${selectedAccount._id}/points`,
        {
          method: "PUT",
          headers: getHeaders(),
          body: JSON.stringify({
            points: pointsNumber,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.message ||
            "Unable to add loyalty points."
        );
        return;
      }

      alert("Points added successfully!");

      setPoints("");
      setShowAddPointsModal(false);
      setSelectedAccount(null);

      await loadData();
    } catch (error) {
      console.error("Add points error:", error);
      alert("Unable to connect to the server.");
    } finally {
      setSaving(false);
    }
  };

  const handleRedeemPoints = async () => {
    if (!selectedAccount) {
      return;
    }

    const pointsNumber = Number(redeemPoints);

    if (
      !Number.isInteger(pointsNumber) ||
      pointsNumber <= 0
    ) {
      alert(
        "Please enter a positive whole number of points."
      );
      return;
    }

    if (pointsNumber > selectedAccount.points) {
      alert("Customer does not have enough points.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `http://localhost:5000/api/loyalty/${selectedAccount._id}/redeem`,
        {
          method: "PUT",
          headers: getHeaders(),
          body: JSON.stringify({
            points: pointsNumber,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.message ||
            "Unable to redeem loyalty points."
        );
        return;
      }

      alert("Points redeemed successfully!");

      setRedeemPoints("");
      setShowRedeemModal(false);
      setSelectedAccount(null);

      await loadData();
    } catch (error) {
      console.error("Redeem points error:", error);
      alert("Unable to connect to the server.");
    } finally {
      setSaving(false);
    }
  };

  const totalMembers = accounts.length;

  const totalPoints = accounts.reduce(
    (total, account) => total + account.points,
    0
  );

  const totalEarned = accounts.reduce(
    (total, account) => total + account.totalEarned,
    0
  );

  const totalRedeemed = accounts.reduce(
    (total, account) => total + account.totalRedeemed,
    0
  );

  const getTierClass = (
    tier: LoyaltyAccount["tier"]
  ) => {
    if (tier === "Platinum") {
      return "bg-slate-200 text-slate-800";
    }

    if (tier === "Gold") {
      return "bg-yellow-100 text-yellow-700";
    }

    if (tier === "Silver") {
      return "bg-gray-100 text-gray-700";
    }

    return "bg-orange-100 text-orange-700";
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 transition"
          >
            <ArrowLeft size={18} />
            Back to Dashboard
          </button>

          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Loyalty
              </h1>

              <p className="text-slate-500 mt-1">
                Manage customer loyalty accounts, points and tiers.
              </p>
            </div>

            <button
              onClick={() => void loadData()}
              className="flex items-center gap-2 bg-slate-100 text-slate-700 px-5 py-3 rounded-xl hover:bg-slate-200 transition"
            >
              <RefreshCw size={18} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  Loyalty Members
                </p>

                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {totalMembers}
                </p>
              </div>

              <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
                <Users
                  size={22}
                  className="text-blue-600"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  Available Points
                </p>

                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {totalPoints}
                </p>
              </div>

              <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center">
                <Star
                  size={22}
                  className="text-purple-600"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  Points Earned
                </p>

                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {totalEarned}
                </p>
              </div>

              <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Trophy
                  size={22}
                  className="text-emerald-600"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  Points Redeemed
                </p>

                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {totalRedeemed}
                </p>
              </div>

              <div className="w-11 h-11 rounded-xl bg-pink-50 flex items-center justify-center">
                <Gift
                  size={22}
                  className="text-pink-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Create Loyalty Account */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center">
              <Gift
                size={22}
                className="text-purple-600"
              />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Create Loyalty Account
              </h2>

              <p className="text-sm text-slate-500">
                Add an existing customer to the loyalty program.
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <select
              value={selectedCustomer}
              onChange={(event) =>
                setSelectedCustomer(event.target.value)
              }
              className="flex-1 border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-300"
              disabled={loading}
            >
              <option value="">
                {loading
                  ? "Loading customers..."
                  : "Select a customer"}
              </option>

              {customers.map((customer) => (
                <option
                  key={customer._id}
                  value={customer._id}
                >
                  {customer.name} — {customer.email}
                </option>
              ))}
            </select>

            <button
              onClick={() => void handleCreateAccount()}
              disabled={saving || !selectedCustomer}
              className="flex items-center justify-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-xl hover:bg-purple-700 disabled:opacity-50 transition"
            >
              <Plus size={18} />
              Create Account
            </button>
          </div>

          {!loading && customers.length === 0 && (
            <p className="text-sm text-amber-600 mt-3">
              No customers are available for your account.
            </p>
          )}
        </div>

        {/* Loyalty Accounts */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">
              Loyalty Accounts
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Current loyalty members and their points.
            </p>
          </div>

          {loading ? (
            <div className="py-16 text-center text-slate-500">
              Loading loyalty accounts...
            </div>
          ) : accounts.length === 0 ? (
            <div className="py-16 text-center">
              <Gift
                size={42}
                className="mx-auto text-slate-300 mb-3"
              />

              <p className="text-slate-600 font-medium">
                No loyalty accounts yet.
              </p>

              <p className="text-sm text-slate-400 mt-1">
                Create an account above or record a paid sale.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 text-left">
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">
                      Customer
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">
                      Available Points
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">
                      Total Earned
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">
                      Redeemed
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">
                      Tier
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {accounts.map((account) => (
                    <tr
                      key={account._id}
                      className="hover:bg-slate-50 transition"
                    >
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900">
                          {account.customer?.name ||
                            "Unknown Customer"}
                        </p>

                        <p className="text-xs text-slate-500 mt-1">
                          {account.customer?.email || ""}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <span className="font-bold text-purple-600">
                          {account.points}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-slate-700">
                        {account.totalEarned}
                      </td>

                      <td className="px-6 py-4 text-slate-700">
                        {account.totalRedeemed}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getTierClass(
                            account.tier
                          )}`}
                        >
                          {account.tier}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedAccount(account);
                              setPoints("");
                              setShowAddPointsModal(true);
                            }}
                            className="px-3 py-2 rounded-lg bg-purple-50 text-purple-700 text-xs font-medium hover:bg-purple-100 transition"
                          >
                            Add Points
                          </button>

                          <button
                            onClick={() => {
                              setSelectedAccount(account);
                              setRedeemPoints("");
                              setShowRedeemModal(true);
                            }}
                            className="px-3 py-2 rounded-lg bg-pink-50 text-pink-700 text-xs font-medium hover:bg-pink-100 transition"
                          >
                            Redeem
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Points Modal */}
      {showAddPointsModal && selectedAccount && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Add Loyalty Points
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  {selectedAccount.customer?.name}
                </p>
              </div>

              <button
                onClick={() => {
                  setShowAddPointsModal(false);
                  setSelectedAccount(null);
                }}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Points to Add
              </label>

              <input
                type="number"
                min="1"
                step="1"
                value={points}
                onChange={(event) =>
                  setPoints(event.target.value)
                }
                placeholder="100"
                className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-300"
              />

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddPointsModal(false);
                    setSelectedAccount(null);
                  }}
                  className="px-5 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>

                <button
                  onClick={() => void handleAddPoints()}
                  disabled={saving}
                  className="px-5 py-3 rounded-xl bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 transition"
                >
                  {saving ? "Saving..." : "Add Points"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Redeem Points Modal */}
      {showRedeemModal && selectedAccount && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Redeem Loyalty Points
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  {selectedAccount.customer?.name}
                </p>
              </div>

              <button
                onClick={() => {
                  setShowRedeemModal(false);
                  setSelectedAccount(null);
                }}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4 rounded-xl bg-purple-50 p-4">
                <p className="text-sm text-purple-700">
                  Available points
                </p>

                <p className="text-2xl font-bold text-purple-800 mt-1">
                  {selectedAccount.points}
                </p>
              </div>

              <label className="block text-sm font-medium text-slate-700 mb-2">
                Points to Redeem
              </label>

              <input
                type="number"
                min="1"
                max={selectedAccount.points}
                step="1"
                value={redeemPoints}
                onChange={(event) =>
                  setRedeemPoints(event.target.value)
                }
                placeholder="50"
                className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-pink-300"
              />

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowRedeemModal(false);
                    setSelectedAccount(null);
                  }}
                  className="px-5 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>

                <button
                  onClick={() => void handleRedeemPoints()}
                  disabled={saving}
                  className="px-5 py-3 rounded-xl bg-pink-600 text-white hover:bg-pink-700 disabled:opacity-50 transition"
                >
                  {saving ? "Saving..." : "Redeem Points"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Loyalty;