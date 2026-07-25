import { useEffect, useState, useRef } from "react";
import API from "../api/axios";

function MilkEntry() {
  const [customers, setCustomers] = useState([]);
  const [entries, setEntries] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [search, setSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const [form, setForm] = useState({
    customerId: "",
    date: new Date().toISOString().split("T")[0],
    shift: "both", 
    morningMilk: "",
    eveningMilk: "",
  });

  const [matchedRecord, setMatchedRecord] = useState(null);

  const getCustomers = async () => {
    try {
      const res = await API.get("/customers");
      setCustomers(res.data);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  const getEntries = async () => {
    try {
      const res = await API.get("/milk-entry");
      setEntries(res.data);
    } catch (error) {
      console.error("Error fetching entries:", error);
    }
  };

  useEffect(() => {
    getCustomers();
    getEntries();

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (form.customerId && form.date) {
      const match = entries.find(
        (entry) =>
          (entry.customerId?._id === form.customerId || entry.customerId === form.customerId) &&
          entry.date?.slice(0, 10) === form.date
      );

      if (match) {
        setMatchedRecord(match);
        setForm((prev) => ({
          ...prev,
          morningMilk: match.morningMilk || "",
          eveningMilk: match.eveningMilk || "",
        }));
      } else {
        setMatchedRecord(null);
        setForm((prev) => ({
          ...prev,
          morningMilk: "",
          eveningMilk: "",
        }));
      }
    }
  }, [form.customerId, form.date, entries]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customerId) {
      alert("Please select a valid customer from the dropdown list.");
      return;
    }

    let morningQty = Number(form.morningMilk) || 0;
    let eveningQty = Number(form.eveningMilk) || 0;

    if (matchedRecord) {
      if (form.shift === "morning") eveningQty = matchedRecord.eveningMilk || 0;
      if (form.shift === "evening") morningQty = matchedRecord.morningMilk || 0;
    } else {
      if (form.shift === "morning") eveningQty = 0;
      if (form.shift === "evening") morningQty = 0;
    }

    if (form.shift === "morning" && !form.morningMilk) return alert("Please enter Morning Milk volume");
    if (form.shift === "evening" && !form.eveningMilk) return alert("Please enter Evening Milk volume");

    try {
      const payload = { ...form, morningMilk: morningQty, eveningMilk: eveningQty };
      if (matchedRecord?._id) {
        await API.put(`/milk-entry/${matchedRecord._id}`, payload);
        alert("Milk Entry Updated Successfully");
      } else {
        await API.post("/milk-entry", payload);
        alert("Milk Entry Added Successfully");
      }
      setForm({ customerId: "", date: new Date().toISOString().split("T")[0], shift: "both", morningMilk: "", eveningMilk: "" });
      setCustomerSearch("");
      setMatchedRecord(null);
      getEntries();
    } catch (error) {
      alert(error.response?.data?.message || "Something went wrong");
    }
  };

  const filteredEntries = entries.filter((entry) => {
    const matchDate = selectedDate === "" || entry.date?.slice(0, 10) === selectedDate;
    const matchName = entry.customerId?.name?.toLowerCase().includes(search.toLowerCase());
    return matchDate && matchName;
  });

  const filteredCustomers = [...customers]
    .filter((customer) => customer.name.toLowerCase().includes(customerSearch.toLowerCase()))
    .sort((a, b) => {
      const term = customerSearch.toLowerCase();
      const aStarts = a.name.toLowerCase().startsWith(term);
      const bStarts = b.name.toLowerCase().startsWith(term);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 md:p-10 font-sans">
      <h1 className="text-3xl font-extrabold text-emerald-800 mb-6">🥛 Milk Entry</h1>

      {/* Form Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800">{matchedRecord ? "Update Entry" : "New Entry"}</h2>
          {matchedRecord && <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-bold animate-pulse">Modifying Existing</span>}
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Customer Dropdown */}
          <div className="relative md:col-span-2" ref={dropdownRef}>
            <input type="text" placeholder="🔍 Search Customer..." value={customerSearch} onChange={(e) => { setCustomerSearch(e.target.value); setShowDropdown(true); setForm((prev) => ({ ...prev, customerId: "" })); }} onFocus={() => setShowDropdown(true)} className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500" required />
            {showDropdown && customerSearch && (
              <div className="absolute left-0 right-0 z-20 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                {filteredCustomers.length > 0 ? filteredCustomers.map((c) => (
                  <div key={c._id} onClick={() => { setForm((prev) => ({ ...prev, customerId: c._id })); setCustomerSearch(c.name); setShowDropdown(false); }} className="p-3 cursor-pointer hover:bg-emerald-50 border-b last:border-b-0">
                    <p className="font-semibold text-slate-800">{c.name}</p>
                    <p className="text-xs text-gray-500">{c.phone} • {c.milkType}</p>
                  </div>
                )) : <p className="p-4 text-sm text-gray-500 text-center">No customer found</p>}
              </div>
            )}
          </div>

          <input type="date" name="date" value={form.date} onChange={handleChange} className="p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500" required />
          
          <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1 rounded-xl">
            {["morning", "evening", "both"].map((type) => (
              <label key={type} className={`text-center py-2 rounded-lg text-xs font-bold capitalize cursor-pointer ${form.shift === type ? "bg-white shadow-sm text-emerald-700" : "text-slate-500"}`}>
                <input type="radio" name="shift" value={type} checked={form.shift === type} onChange={handleChange} className="sr-only" />
                {type === "both" ? "All" : type}
              </label>
            ))}
          </div>

          {(form.shift === "morning" || form.shift === "both") && <input type="number" name="morningMilk" value={form.morningMilk} onChange={handleChange} placeholder="Morning Liters" step="0.1" className="p-3 rounded-xl border border-slate-200" required={form.shift === "morning"} />}
          {(form.shift === "evening" || form.shift === "both") && <input type="number" name="eveningMilk" value={form.eveningMilk} onChange={handleChange} placeholder="Evening Liters" step="0.1" className="p-3 rounded-xl border border-slate-200" required={form.shift === "evening"} />}
          
          <button type="submit" className={`md:col-span-2 py-3 rounded-xl font-bold text-white transition ${matchedRecord ? "bg-amber-600 hover:bg-amber-700" : "bg-emerald-600 hover:bg-emerald-700"}`}>
            {matchedRecord ? "Update Record" : "Save Record"}
          </button>
        </form>
      </div>

      {/* History Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-xl font-bold text-slate-800">History</h2>
          <div className="flex w-full sm:w-auto gap-2">
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full sm:w-auto border border-slate-200 rounded-xl px-3 py-2 text-sm" />
            <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full sm:w-auto border border-slate-200 rounded-xl px-3 py-2 text-sm" />
          </div>
        </div>

        {/* DESKTOP TABLE */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
              <tr>
                <th className="p-4">Customer</th>
                <th className="p-4">Date</th>
                <th className="p-4">Morning</th>
                <th className="p-4">Evening</th>
                <th className="p-4">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {filteredEntries.map(e => (
                <tr key={e._id} className="hover:bg-slate-50">
                  <td className="p-4 font-semibold">{e.customerId?.name || "Deleted"}</td>
                  <td className="p-4">{e.date?.slice(0, 10)}</td>
                  <td className="p-4 text-blue-600 font-medium">{e.morningMilk || 0}L</td>
                  <td className="p-4 text-purple-600 font-medium">{e.eveningMilk || 0}L</td>
                  <td className="p-4 font-bold">{Number(e.morningMilk || 0) + Number(e.eveningMilk || 0)}L</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* MOBILE CARDS */}
        <div className="md:hidden space-y-3">
          {filteredEntries.map(e => (
            <div key={e._id} className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="font-bold">{e.customerId?.name || "Deleted"}</h3>
                <p className="text-xs text-slate-500">{e.date?.slice(0, 10)}</p>
                <div className="flex gap-4 mt-2 text-sm">
                  <span className="text-blue-600">M: {e.morningMilk || 0}L</span>
                  <span className="text-purple-600">E: {e.eveningMilk || 0}L</span>
                </div>
              </div>
              <div className="text-xl font-black text-emerald-600">
                {Number(e.morningMilk || 0) + Number(e.eveningMilk || 0)}L
              </div>
            </div>
          ))}
        </div>
        
        {filteredEntries.length === 0 && <p className="text-center text-slate-400 py-10">No records found</p>}
      </div>
    </div>
  );
}

export default MilkEntry;