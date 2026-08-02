import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import API from "../api/axios";

function Dashboard() {
  const [collections, setCollections] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [volumeType, setVolumeType] = useState("today");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [collRes, custRes] = await Promise.all([
          API.get("/milk-entry").catch(() => ({ data: [] })),
          API.get("/customers").catch(() => ({ data: [] })),
        ]);

        const collData = Array.isArray(collRes.data) ? collRes.data : collRes.data.data || [];
        const custData = Array.isArray(custRes.data) ? custRes.data : custRes.data.data || [];

        setCollections(collData);
        setCustomers(custData);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredData = collections.filter((item) => {
    const rawDate = item.date || item.createdAt || "";
    const normalizedDate = rawDate.includes("T") ? rawDate.split("T")[0] : rawDate;
    return normalizedDate === selectedDate;
  });

  const currentMonth = selectedDate.slice(0, 7);
  const monthlyData = collections.filter((item) => {
    const rawDate = item.date || item.createdAt || "";
    const normalizedDate = rawDate.includes("T") ? rawDate.split("T")[0] : rawDate;
    return normalizedDate.startsWith(currentMonth);
  });

  const getMilkValue = (curr) =>
    Number(curr.litres) || Number(curr.quantity) || Number(curr.totalMilk) || Number(curr.liters) || Number(curr.milk) || 0;

  const monthlyLitres = monthlyData.reduce((acc, curr) => acc + getMilkValue(curr), 0);
  const totalLitres = filteredData.reduce((acc, curr) => acc + getMilkValue(curr), 0);

  const dailyActiveCustomers = new Set(
    filteredData.map((item) => item.customerId || item.customerName)
  ).size;

  const cowCustomers = customers.filter((c) => c.milkType === "Cow").length;
  const buffaloCustomers = customers.filter((c) => c.milkType === "Buffalo").length;

  const totalRegisteredCustomers =
    customers.length > 0
      ? customers.length
      : new Set(collections.map((item) => item.customerId || item.customerName)).size;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 md:py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">📊 Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Monitor milk collection statistics.</p>
        </div>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-full md:w-auto border rounded-xl px-4 py-2 shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none"
        />
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Milk Collection Card */}
        <div className="bg-white rounded-2xl shadow-lg p-4 md:p-5">
          <div className="flex justify-between items-center mb-4">
            <p className="text-slate-500 text-xs sm:text-sm">Milk Collection</p>
            <div className="flex bg-slate-100 rounded-lg overflow-hidden">
              <button
                onClick={() => setVolumeType("today")}
                className={`px-3 py-1 text-xs ${volumeType === "today" ? "bg-emerald-600 text-white" : "text-slate-700"}`}
              >Today</button>
              <button
                onClick={() => setVolumeType("month")}
                className={`px-3 py-1 text-xs ${volumeType === "month" ? "bg-emerald-600 text-white" : "text-slate-700"}`}
              >Month</button>
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-sky-600">
            {loading ? "..." : volumeType === "today" ? `${totalLitres.toFixed(2)} L` : `${monthlyLitres.toFixed(2)} L`}
          </h2>
        </div>

        {/* Active Customers */}
        <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6">
          <p className="text-slate-500 text-xs sm:text-sm">Active Customers</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-emerald-600 mt-2">{loading ? "..." : dailyActiveCustomers}</h2>
        </div>

        {/* Registered Customers */}
        <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6">
          <p className="text-slate-500 text-xs sm:text-sm">Registered Customers</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-indigo-600 mt-2">{loading ? "..." : totalRegisteredCustomers}</h2>
        </div>

        {/* Milk Types */}
        <div className="bg-white rounded-2xl shadow-lg p-4 md:p-5">
          <p className="text-slate-500 text-xs sm:text-sm mb-3">Milk Types</p>
          <div className="space-y-2">
            <div className="flex justify-between text-sm"><span>🐄 Cow</span><span className="font-bold text-blue-600">{loading ? "..." : cowCustomers}</span></div>
            <div className="flex justify-between text-sm"><span>🐃 Buffalo</span><span className="font-bold text-purple-600">{loading ? "..." : buffaloCustomers}</span></div>
          </div>
        </div>
      </div>

      {/* Recent Customers Table */}
      <div className="bg-white rounded-2xl shadow-lg mt-6 md:mt-8 overflow-hidden">
        <div className="p-4 md:p-6 border-b">
          <h2 className="text-lg md:text-xl font-bold text-slate-800">Recent Customers</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs md:text-sm">
            <thead className="bg-emerald-600 text-white">
              <tr>
                <th className="px-3 py-3 md:px-5">ID</th>
                <th className="px-3 py-3 md:px-5">Name</th>
                <th className="px-3 py-3 md:px-5 hidden sm:table-cell">Phone</th>
                <th className="px-3 py-3 md:px-5 hidden md:table-cell">Address</th>
                <th className="px-3 py-3 md:px-5">Milk</th>
                <th className="px-3 py-3 md:px-5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="6" className="text-center py-8">Loading...</td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-8">No customers found.</td></tr>
              ) : (
                customers.map((customer, index) => (
                  <tr key={customer._id} className="hover:bg-slate-50">
                    <td className="px-3 py-3 md:px-5 text-slate-600">{index + 1}</td>
                    <td className="px-3 py-3 md:px-5 font-medium">{customer.name}</td>
                    <td className="px-3 py-3 md:px-5 hidden sm:table-cell">{customer.phone}</td>
                    <td className="px-3 py-3 md:px-5 hidden md:table-cell">{customer.address}</td>
                    <td className="px-3 py-3 md:px-5">{customer.milkType}</td>
                    <td className="px-3 py-3 md:px-5">
                      <span className={`px-2 py-1 rounded-full text-[10px] md:text-xs font-semibold ${customer.status === "Active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {customer.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;