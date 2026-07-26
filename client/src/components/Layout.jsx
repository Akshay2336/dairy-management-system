import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";

function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Sidebar Overlay (Only visible on mobile when sidebar is open) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 md:ml-64`}
      >
        {/* Top Header */}
        <header className="bg-white shadow-sm px-4 py-3 flex items-center gap-3 sticky top-0 z-30">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-lg shadow transition"
          >
            ☰
          </button>
          
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 truncate">
            Dairy Manager
          </h1>
          
          <div className="ml-auto">
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 md:px-5 rounded-lg font-medium shadow transition text-sm md:text-base"
            >
              <span className="hidden md:inline">🚪 Logout</span>
              <span className="md:hidden">🚪</span>
            </button>
          </div>
        </header>

        {/* Current Page */}
        <main className="p-3 md:p-6 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;