import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import API from "../api/axios";

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    milkType: "Cow",
  });

  const getCustomers = async () => {
    try {
      const res = await API.get("/cuetomers");
      setCustomers(res.data);
    } catch (error) {
      toast.error("Error fetching customers.");
    }
  };

  useEffect(() => {
    getCustomers();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone") {
      if (/^\d{0,10}$/.test(value)) {
        setForm({ ...form, [name]: value });
      }
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.phone.length !== 10) {
      toast.warn("Phone number must be exactly 10 digits.");
      return;
    }
    try {
      if (editingId) {
        await API.put(`/customers/${editingId}`, form);
        toast.success("Customer Updated Successfully");
      } else {
        await API.post("/customers", form);
        toast.success("Customer Added Successfully");
      }
      setForm({ name: "", phone: "", address: "", milkType: "Cow" });
      setEditingId(null);
      setShowForm(false);
      getCustomers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save customer.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this customer?")) return;
    try {
      await API.delete(`/customers/${id}`);
      toast.success("Customer Deleted Successfully");
      getCustomers();
    } catch (error) {
      toast.error("Failed to delete customer.");
    }
  };

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 md:p-10 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">👥 Customers</h1>
            <p className="text-sm text-slate-500">Manage subscriptions and profiles.</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="w-full sm:w-auto px-5 py-3 rounded-xl font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-all"
          >
            {showForm ? "Cancel" : "＋ Add New Customer"}
          </button>
        </div>
        {showForm && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
              <h2 className="text-lg font-bold">{editingId ? "Edit Customer" : "Register New Customer"}</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              <input type="text" name="name" required value={form.name} onChange={handleChange} placeholder="Customer Name" className="p-3 rounded-xl border border-slate-200 w-full" />
              <input type="tel" name="phone" required value={form.phone} onChange={handleChange} placeholder="Phone Number (10 digits)" className="p-3 rounded-xl border border-slate-200 w-full" maxLength={10} autoComplete="off" inputMode="numeric" />
              <input type="text" name="address" required autoComplete="off" value={form.address} onChange={handleChange} placeholder="Address" className="md:col-span-2 p-3 rounded-xl border border-slate-200 w-full" />
              <select name="milkType" value={form.milkType} onChange={handleChange} className="md:col-span-2 p-3 rounded-xl border border-slate-200 w-full">
                <option value="Cow">🐄 Cow Milk</option>
                <option value="Buffalo">🐃 Buffalo Milk</option>
              </select>
              <button className="md:col-span-2 bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition">Save Record</button>
            </form>
          </div>
        )}
        <input type="text" placeholder="🔍 Search customer..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none" />
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {filteredCustomers.length === 0 ? (
            <div className="p-12 text-center text-slate-500">No customers found</div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full table-auto border-collapse text-left">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr className="text-slate-600 text-xs font-bold uppercase tracking-wider">
                      <th className="px-6 py-4">Name</th>
                      <th className="px-6 py-4">Phone</th>
                      <th className="px-6 py-4">Address</th>
                      <th className="px-6 py-4">Milk Type</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredCustomers.map((c) => (
                      <tr key={c._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-900">{c.name}</td>
                        <td className="px-6 py-4 text-slate-600">{c.phone}</td>
                        <td className="px-6 py-4 text-slate-600">{c.address}</td>
                        <td className="px-6 py-4">
                          <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-full text-xs font-medium">{c.milkType}</span>
                        </td>
                        <td className="px-6 py-4 flex gap-2 justify-end">
                          <button onClick={() => { setEditingId(c._id); setForm(c); setShowForm(true); }} className="text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-lg text-xs font-semibold transition">Edit</button>
                          <button onClick={() => handleDelete(c._id)} className="text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-lg text-xs font-semibold transition">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="md:hidden divide-y divide-slate-100">
                {filteredCustomers.map((c) => (
                  <div key={c._id} className="p-5 space-y-3">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-slate-900 text-lg">{c.name}</h3>
                      <span className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-medium border border-emerald-100">{c.milkType}</span>
                    </div>
                    <div className="text-sm text-slate-600 space-y-1">
                      <p>📞 {c.phone}</p>
                      <p className="text-slate-500">📍 {c.address}</p>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button onClick={() => { setEditingId(c._id); setForm(c); setShowForm(true); }} className="flex-1 text-blue-700 bg-blue-50 py-2 rounded-lg font-bold text-sm hover:bg-blue-100 transition">Edit Profile</button>
                      <button onClick={() => handleDelete(c._id)} className="flex-1 text-red-700 bg-red-50 py-2 rounded-lg font-bold text-sm hover:bg-red-100 transition">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Customers;