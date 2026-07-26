import { useEffect, useState, useRef } from "react";
import { toast } from "react-toastify"; // Added import
import API from "../api/axios";

const STANDARD_MILK_RATES = {
  Cow: 60.0,
  Buffalo: 70.0,
  Default: 65.0,
};

function Billing() {
  const [customers, setCustomers] = useState([]);
  const [bills, setBills] = useState([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [tableSearchQuery, setTableSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const [form, setForm] = useState({
    customerId: "",
    startDate: "",
    endDate: "",
    pricePerLitre: "",
  });

  const getCustomers = async () => {
    try {
      const res = await API.get("/customers");
      setCustomers(res.data);
    } catch (error) {
      toast.error("Error fetching customers list.");
    }
  };

  const getBills = async () => {
    try {
      const res = await API.get("/billing");
      setBills(res.data);
    } catch (error) {
      toast.error("Error fetching billing records.");
    }
  };

  useEffect(() => {
    getCustomers();
    getBills();
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const processServerBill = (res, targetCustomerId) => {
    const serverBill = res.data.bill;
    const selectedCustomer = customers.find((c) => c._id === targetCustomerId);
    const formattedBill = {
      ...serverBill,
      customerId: selectedCustomer || { name: "Unknown Customer", phone: "N/A" }
    };
    
    toast.success(res.data.message || "Bill Processed Successfully");
    
    setBills((prevBills) => {
      const exists = prevBills.some((b) => b._id === formattedBill._id);
      return exists ? prevBills.map((b) => (b._id === formattedBill._id ? formattedBill : b)) : [formattedBill, ...prevBills];
    });
    setForm({ customerId: "", startDate: "", endDate: "", pricePerLitre: "" });
    setCustomerSearch("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customerId) return toast.warn("Please select a valid customer from the search dropdown.");
    
    const payload = { ...form, pricePerLitre: Number(form.pricePerLitre), allowUpdate: false };
    try {
      const res = await API.post("/billing", payload);
      processServerBill(res, form.customerId);
    } catch (error) {
      if (error.response?.status === 409 && error.response?.data?.billExists) {
        if (window.confirm(error.response.data.message)) {
          try {
            const retryRes = await API.post("/billing", { ...payload, allowUpdate: true });
            processServerBill(retryRes, form.customerId);
          } catch (retryError) {
            toast.error(retryError.response?.data?.message || "Failed to update existing record.");
          }
        }
      } else {
        toast.error(error.response?.data?.message || "Something went wrong");
      }
    }
  };

  const handleStatusChange = async (billId, newStatus) => {
    try {
      const res = await API.patch(`/billing/${billId}/status`, { paymentStatus: newStatus });
      setBills((prevBills) =>
        prevBills.map((b) => b._id === billId ? { ...b, paymentStatus: res.data.bill?.paymentStatus || newStatus } : b)
      );
      toast.success("Status updated!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to change payment status.");
      getBills();
    }
  };

  const handleDeleteBill = async (billId) => {
    if (!window.confirm("Are you sure you want to delete this bill record permanently?")) return;
    try {
      const res = await API.delete(`/billing/${billId}`);
      toast.info(res.data.message || "Bill removed successfully.");
      setBills((prevBills) => prevBills.filter((b) => b._id !== billId));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to drop entry.");
    }
  };

  const filteredCustomers = [...customers]
    .filter((customer) => customer.name.toLowerCase().includes(customerSearch.toLowerCase()))
    .sort((a, b) => (a.name.toLowerCase().startsWith(customerSearch.toLowerCase()) ? -1 : 1));

  const filteredBills = bills.filter((bill) => {
    const name = bill.customerId?.name ? String(bill.customerId.name).toLowerCase() : "";
    const phone = bill.customerId?.phone ? String(bill.customerId.phone).toLowerCase() : "";
    const search = tableSearchQuery.trim().toLowerCase();
    const matchesSearch = !search || name.includes(search) || phone.includes(search);
    const matchesStatus = statusFilter === "All" || (bill.paymentStatus || "Pending") === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateStr) => !dateStr ? "N/A" : new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-emerald-50 p-4 md:p-8">
      <h1 className="text-3xl md:text-4xl font-bold text-emerald-800 mb-8">💰 Billing Dashboard</h1>

      <div className="bg-white rounded-3xl shadow-xl p-6 mb-10 border border-slate-100">
        <h2 className="text-2xl font-bold text-slate-700 mb-6">Generate New Bill</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5 items-end">
          <div className="relative flex flex-col gap-1 w-full lg:col-span-1" ref={dropdownRef}>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Customer</label>
            <input
              type="text"
              placeholder="🔍 Search..."
              value={customerSearch}
              onChange={(e) => {
                setCustomerSearch(e.target.value);
                setShowDropdown(true);
                setForm((prev) => ({ ...prev, customerId: "" }));
              }}
              onFocus={() => setShowDropdown(true)}
              className="w-full p-4 rounded-xl border border-gray-300 text-sm"
              required
            />
            {showDropdown && customerSearch && (
              <div className="absolute left-0 right-0 z-20 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                {filteredCustomers.map((customer) => (
                  <div key={customer._id} onClick={() => {
                    const rate = STANDARD_MILK_RATES[customer.milkType || "Default"] || STANDARD_MILK_RATES.Default;
                    setForm({ ...form, customerId: customer._id, pricePerLitre: rate });
                    setCustomerSearch(`${customer.name} (${customer.milkType || "General"})`);
                    setShowDropdown(false);
                  }} className="p-3 cursor-pointer hover:bg-emerald-50 border-b border-slate-100 text-sm">
                    {customer.name}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1 w-full"><label className="text-xs font-bold text-slate-500 uppercase">Start Date</label><input type="date" name="startDate" value={form.startDate} onChange={handleChange} className="p-4 rounded-xl border border-gray-300 text-sm" required /></div>
          <div className="flex flex-col gap-1 w-full"><label className="text-xs font-bold text-slate-500 uppercase">End Date</label><input type="date" name="endDate" value={form.endDate} onChange={handleChange} className="p-4 rounded-xl border border-gray-300 text-sm" required /></div>
          <div className="flex flex-col gap-1 w-full"><label className="text-xs font-bold text-slate-500 uppercase">Price (₹)</label><input type="number" name="pricePerLitre" value={form.pricePerLitre} onChange={handleChange} className="p-4 rounded-xl border border-gray-300 text-sm" required /></div>
          <button type="submit" className="bg-emerald-600 text-white py-4 rounded-xl font-semibold text-sm hover:bg-emerald-700 w-full">⚡ Generate Bill</button>
        </form>
      </div>

      <div className="bg-white rounded-3xl shadow-xl p-6 border border-slate-100">
        <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
          <h2 className="text-2xl font-bold text-slate-700">📋 Generated Bills</h2>
          <div className="flex gap-2">
            <input type="text" placeholder="Search..." onChange={(e) => setTableSearchQuery(e.target.value)} className="p-3 rounded-xl border border-gray-300 text-sm w-full md:w-64" />
            <select onChange={(e) => setStatusFilter(e.target.value)} className="p-3 rounded-xl border border-gray-300 text-sm"><option value="All">All</option><option value="Paid">Paid</option><option value="Pending">Pending</option></select>
          </div>
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-800 text-white">
              <tr>{["Customer", "Range", "Milk", "Rate", "Amount", "Status", "Actions"].map(h => <th key={h} className="p-4 text-left">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y">
              {filteredBills.map(bill => (
                <tr key={bill._id} className="hover:bg-slate-50">
                  <td className="p-4">{bill.customerId?.name}</td>
                  <td className="p-4">{formatDate(bill.startDate)} - {formatDate(bill.endDate)}</td>
                  <td className="p-4 text-blue-600 font-bold">{bill.totalMilk} L</td>
                  <td className="p-4">₹ {bill.pricePerLitre}</td>
                  <td className="p-4 font-bold text-emerald-700">₹ {bill.totalAmount}</td>
                  <td className="p-4">
                    <select value={bill.paymentStatus || "Pending"} onChange={(e) => handleStatusChange(bill._id, e.target.value)} className={`p-2 rounded-lg font-bold text-xs ${bill.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      <option value="Pending">Pending</option><option value="Paid">Paid</option>
                    </select>
                  </td>
                  <td className="p-4"><button onClick={() => handleDeleteBill(bill._id)} className="text-rose-600 font-bold">Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="md:hidden space-y-4">
          {filteredBills.map(bill => (
            <div key={bill._id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 shadow-sm">
              <div className="flex justify-between font-bold text-slate-800 mb-1">{bill.customerId?.name} <span className="text-emerald-700">₹{bill.totalAmount}</span></div>
              <div className="text-xs text-gray-500 mb-3">{formatDate(bill.startDate)} - {formatDate(bill.endDate)}</div>
              <div className="flex justify-between items-center">
                <select value={bill.paymentStatus || "Pending"} onChange={(e) => handleStatusChange(bill._id, e.target.value)} className={`p-2 rounded-lg font-bold text-xs ${bill.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                  <option value="Pending">Pending</option><option value="Paid">Paid</option>
                </select>
                <button onClick={() => handleDeleteBill(bill._id)} className="text-rose-600 font-bold text-xs">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Billing;
