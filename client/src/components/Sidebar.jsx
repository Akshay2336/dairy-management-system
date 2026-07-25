import { NavLink } from "react-router-dom";

function Sidebar({ isOpen, setIsOpen }) {
  const closeSidebar = () => {
    setIsOpen(false);
  };

  const menuClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium ${
      isActive
        ? "bg-emerald-500 text-white shadow-md"
        : "text-white hover:bg-emerald-600"
    }`;

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen w-64
        bg-gradient-to-b from-emerald-700 to-green-950
        shadow-2xl z-50
        transform transition-transform duration-300
        ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-emerald-600">
          <h1 className="text-2xl font-bold text-white">
            🐄 Dairy Manager
          </h1>

          <button
            onClick={closeSidebar}
            className="text-white text-2xl hover:text-red-300 transition"
          >
            ✕
          </button>
        </div>

        {/* Menu */}
        <nav className="p-4 space-y-3">

          <NavLink
            to="/dashboard"
            className={menuClass}
            onClick={closeSidebar}
          >
            📊 Dashboard
          </NavLink>

          <NavLink
            to="/customers"
            className={menuClass}
            onClick={closeSidebar}
          >
            👥 Customers
          </NavLink>

          <NavLink
            to="/milk-entry"
            className={menuClass}
            onClick={closeSidebar}
          >
            🥛 Milk Entry
          </NavLink>

          <NavLink
            to="/billing"
            className={menuClass}
            onClick={closeSidebar}
          >
            💰 Billing
          </NavLink>

         

        </nav>

        {/* Footer */}
        <div className="absolute bottom-5 left-0 right-0 text-center text-sm text-emerald-200">
          © 2026 Dairy Management
        </div>
      </aside>
    </>
  );
}

export default Sidebar;