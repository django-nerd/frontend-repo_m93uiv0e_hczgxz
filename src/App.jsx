import { useState } from "react";
import AdminPanel from "./components/AdminPanel";
import EmployeePanel from "./components/EmployeePanel";

function NavButton({ active, children, ...props }) {
  return (
    <button
      {...props}
      className={`${active ? "bg-blue-600 text-white" : "bg-white text-gray-700"} px-4 py-2 rounded-lg border shadow-sm hover:shadow transition`}
    >
      {children}
    </button>
  );
}

export default function App() {
  const [tab, setTab] = useState("employee");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <header className="sticky top-0 z-10 bg-white/70 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="text-xl font-semibold">Interior Quotation System</div>
          <div className="flex gap-2">
            <NavButton active={tab === "employee"} onClick={() => setTab("employee")}>Employee</NavButton>
            <NavButton active={tab === "admin"} onClick={() => setTab("admin")}>Admin</NavButton>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {tab === "employee" ? <EmployeePanel /> : <AdminPanel />}
      </main>

      <style>{`
        .input { @apply w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring focus:border-blue-400; }
        .btn-primary { @apply bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition; }
        .btn-danger { @apply bg-red-600 text-white rounded-lg px-3 py-1.5 hover:bg-red-700 transition; }
      `}</style>
    </div>
  );
}
