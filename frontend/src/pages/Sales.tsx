
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle,
  IndianRupee,
  Package,
  Plus,
  ShoppingCart,
  X,
} from "lucide-react";

interface Customer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
}

interface Salesperson {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface Sale {
  _id: string;
  customer: Customer;
  salesperson: Salesperson;
  productService: string;
  quantity: number;
  amount: number;
  date: string;
  paymentStatus: "Pending" | "Paid" | "Cancelled";
}

interface SalesProps {
  onBack: () => void;
}

function Sales({ onBack }: SalesProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);

  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [customer, setCustomer] = useState("");
  const [productService, setProductService] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [paymentStatus, setPaymentStatus] = useState<
    "Pending" | "Paid" | "Cancelled"
  >("Pending");

  const token =
    sessionStorage.getItem("token") ||
    localStorage.getItem("token");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [customerResponse, salesResponse] = await Promise.all([
        fetch("http://localhost:5000/api/customers", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch("http://localhost:5000/api/sales", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      const customerData = await customerResponse.json();
      const salesData = await salesResponse.json();

      // FIX: Support both customer API response formats
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
          customerData.message || "Unable to load customers."
        );
      }

      // Support both sales API response formats
      if (salesResponse.ok) {
        const salesList = Array.isArray(salesData)
          ? salesData
          : Array.isArray(salesData.sales)
            ? salesData.sales
            : [];

        setSales(salesList);
      } else {
        setSales([]);
        setError(
          salesData.message || "Unable to load sales."
        );
      }
    } catch (error) {
      console.error("Failed to load sales data:", error);
      setError(
        "Unable to connect to the backend. Please check that the server is running."
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadData]);

  const resetForm = () => {
    setCustomer("");
    setProductService("");
    setQuantity("1");
    setAmount("");
    setDate(new Date().toISOString().split("T")[0]);
    setPaymentStatus("Pending");
  };

  const handleCreateSale = async () => {
    if (!customer || !productService.trim() || !quantity || !amount) {
      alert("Please fill in all required fields.");
      return;
    }

    const quantityNumber = Number(quantity);
    const amountNumber = Number(amount);

    if (
      !Number.isInteger(quantityNumber) ||
      quantityNumber < 1
    ) {
      alert("Quantity must be a positive whole number.");
      return;
    }

    if (!Number.isFinite(amountNumber) || amountNumber < 0) {
      alert("Please enter a valid amount.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        "http://localhost:5000/api/sales",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            customer,
            productService: productService.trim(),
            quantity: quantityNumber,
            amount: amountNumber,
            date,
            paymentStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Unable to record sale.");
        return;
      }

      alert("Sale recorded successfully!");

      resetForm();
      setShowModal(false);

      await loadData();
    } catch (error) {
      console.error("Create sale error:", error);
      alert("Unable to connect to the server.");
    } finally {
      setSaving(false);
    }
  };

  const totalSales = sales.length;

  const paidSales = sales.filter(
    (sale) => sale.paymentStatus === "Paid"
  ).length;

  const pendingSales = sales.filter(
    (sale) => sale.paymentStatus === "Pending"
  ).length;

  const totalRevenue = sales
    .filter((sale) => sale.paymentStatus === "Paid")
    .reduce((total, sale) => total + sale.amount, 0);

  const getStatusClass = (status: Sale["paymentStatus"]) => {
    if (status === "Paid") {
      return "bg-emerald-100 text-emerald-700";
    }

    if (status === "Pending") {
      return "bg-amber-100 text-amber-700";
    }

    return "bg-red-100 text-red-700";
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
                Sales
              </h1>

              <p className="text-slate-500 mt-1">
                Record customer purchases and track payment status.
              </p>
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-xl hover:bg-slate-800 transition shadow-sm"
            >
              <Plus size={18} />
              Record Sale
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

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  Total Sales
                </p>

                <p className="text-2xl font-bold text-slate-900 mt-2">
                  {totalSales}
                </p>
              </div>

              <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
                <ShoppingCart
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
                  Paid Sales
                </p>

                <p className="text-2xl font-bold text-slate-900 mt-2">
                  {paidSales}
                </p>
              </div>

              <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center">
                <CheckCircle
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
                  Pending Sales
                </p>

                <p className="text-2xl font-bold text-slate-900 mt-2">
                  {pendingSales}
                </p>
              </div>

              <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center">
                <Package
                  size={22}
                  className="text-amber-600"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  Paid Revenue
                </p>

                <p className="text-2xl font-bold text-slate-900 mt-2">
                  ₹{totalRevenue.toLocaleString("en-IN")}
                </p>
              </div>

              <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center">
                <IndianRupee
                  size={22}
                  className="text-purple-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sales History */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">
              Sales History
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Recorded customer purchases.
            </p>
          </div>

          {loading ? (
            <div className="py-16 text-center text-slate-500">
              Loading sales...
            </div>
          ) : sales.length === 0 ? (
            <div className="py-16 text-center">
              <ShoppingCart
                size={42}
                className="mx-auto text-slate-300 mb-3"
              />

              <p className="text-slate-600 font-medium">
                No sales recorded yet.
              </p>

              <p className="text-sm text-slate-400 mt-1">
                Click "Record Sale" to add your first sale.
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
                      Product / Service
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">
                      Quantity
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">
                      Amount
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">
                      Date
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">
                      Payment
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {sales.map((sale) => (
                    <tr
                      key={sale._id}
                      className="hover:bg-slate-50 transition"
                    >
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900">
                          {sale.customer?.name || "Unknown"}
                        </p>

                        <p className="text-xs text-slate-500 mt-1">
                          {sale.customer?.email || ""}
                        </p>
                      </td>

                      <td className="px-6 py-4 text-slate-700">
                        {sale.productService}
                      </td>

                      <td className="px-6 py-4 text-slate-700">
                        {sale.quantity}
                      </td>

                      <td className="px-6 py-4 font-medium text-slate-900">
                        ₹{sale.amount.toLocaleString("en-IN")}
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {new Date(sale.date).toLocaleDateString(
                          "en-IN"
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusClass(
                            sale.paymentStatus
                          )}`}
                        >
                          {sale.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Record Sale Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Record New Sale
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Enter the details of the customer purchase.
                </p>
              </div>

              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Customer */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Customer *
                </label>

                <select
                  value={customer}
                  onChange={(event) =>
                    setCustomer(event.target.value)
                  }
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-slate-300"
                >
                  <option value="">
                    Select customer
                  </option>

                  {customers.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.name} — {item.email}
                    </option>
                  ))}
                </select>

                {customers.length === 0 && (
                  <p className="text-sm text-amber-600 mt-2">
                    No customers available. Check the Customers
                    page or the error message above.
                  </p>
                )}
              </div>

              {/* Product */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Product / Service *
                </label>

                <input
                  type="text"
                  value={productService}
                  onChange={(event) =>
                    setProductService(event.target.value)
                  }
                  placeholder="Example: Premium Subscription"
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>

              {/* Quantity + Amount */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Quantity *
                  </label>

                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={quantity}
                    onChange={(event) =>
                      setQuantity(event.target.value)
                    }
                    className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Amount (₹) *
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={amount}
                    onChange={(event) =>
                      setAmount(event.target.value)
                    }
                    placeholder="5000"
                    className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-slate-300"
                  />
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Sale Date *
                </label>

                <input
                  type="date"
                  value={date}
                  onChange={(event) =>
                    setDate(event.target.value)
                  }
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>

              {/* Payment status */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Payment Status *
                </label>

                <select
                  value={paymentStatus}
                  onChange={(event) =>
                    setPaymentStatus(
                      event.target.value as
                        | "Pending"
                        | "Paid"
                        | "Cancelled"
                    )
                  }
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-slate-300"
                >
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              {/* Loyalty information */}
              {paymentStatus === "Paid" &&
                Number(amount) > 0 && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                    <p className="text-sm font-medium text-emerald-800">
                      Loyalty Points
                    </p>

                    <p className="text-sm text-emerald-700 mt-1">
                      This paid sale will award{" "}
                      <strong>
                        {Math.floor(Number(amount) / 100)}
                      </strong>{" "}
                      loyalty points.
                    </p>
                  </div>
                )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-5 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>

                <button
                  onClick={() => void handleCreateSale()}
                  disabled={saving}
                  className="px-5 py-3 rounded-xl bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 transition"
                >
                  {saving ? "Saving..." : "Record Sale"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Sales;
