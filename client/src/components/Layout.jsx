import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";

function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navigate = useNavigate();

  const handleLogout = () => {
  localStorage.removeItem("token"); // Remove JWT token

  // Remove user data if stored
  localStorage.removeItem("user");

  navigate("/login");
};

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      {/* Main Content */}
      <div
        className={`flex-1 transition-all duration-300 ${
          isSidebarOpen ? "ml-64" : "ml-0"
        }`}
      >
        {/* Top Header */}
        <header className="bg-white shadow-md px-5 py-4 flex items-center gap-4 sticky top-0 z-30">

          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-lg shadow transition"
          >
            ☰
          </button>

          <h1 className="text-2xl font-bold text-slate-800">
            Dairy Manager 
          </h1>
          
          <div className="ml-auto">
          <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg font-medium shadow transition"
           >
          🚪 Logout
          </button>
          </div>

        </header>

        {/* Current Page */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;