import { useEffect, useMemo, useState } from "react";

const apiBase = import.meta.env.VITE_BACKEND_URL || "";

async function api(path, options = {}) {
  const res = await fetch(`${apiBase}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function Stat({ label, value }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-4">
      <div className="text-xs uppercase text-gray-500">{label}</div>
      <div className="text-2xl font-semibold text-gray-800">{value}</div>
    </div>
  );
}

export default function EmployeePanel() {
  const [employeeId, setEmployeeId] = useState("");
  const [stats, setStats] = useState(null);
  const [categories, setCategories] = useState([]);
  const [subcats, setSubcats] = useState([]);
  const [packages, setPackages] = useState([]);

  const [items, setItems] = useState([]);
  const [client, setClient] = useState({ name: "", contact: "" });
  const subtotal = useMemo(() => items.reduce((s, it) => s + it.quantity * it.unit_price, 0), [items]);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);

  useEffect(() => {
    Promise.all([
      api("/api/categories"),
      api("/api/subcategories"),
      api("/api/packages"),
    ]).then(([cats, subs, pkgs]) => {
      setCategories(cats);
      setSubcats(subs);
      setPackages(pkgs);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (!employeeId) return setStats(null);
    api(`/api/performance?employee_id=${employeeId}`).then(setStats).catch(() => setStats(null));
  }, [employeeId]);

  function addPackage(p) {
    setItems(prev => {
      const existing = prev.find(x => x.package_id === p._id);
      if (existing) return prev.map(x => x.package_id === p._id ? { ...x, quantity: x.quantity + 1, total: (x.quantity + 1) * x.unit_price } : x);
      return [...prev, { package_id: p._id, name: p.name, quantity: 1, unit_price: p.price, total: p.price }];
    });
  }

  function updateQty(id, qty) {
    setItems(prev => prev.map(x => x.package_id === id ? { ...x, quantity: qty, total: qty * x.unit_price } : x));
  }

  async function saveQuotation() {
    if (!employeeId) return alert("Enter your employee user id");
    const payload = {
      employee_id: employeeId,
      client_name: client.name,
      client_contact: client.contact,
      house_category_id: null,
      subcategory_id: null,
      items: items.map(it => ({ package_id: it.package_id, name: it.name, quantity: it.quantity, unit_price: it.unit_price, total: it.total })),
      subtotal: subtotal,
      discount: Number(discount || 0),
      tax: Number(tax || 0),
      total: subtotal - Number(discount || 0) + Number(tax || 0),
      status: "draft",
      notes: null,
    };
    const res = await api("/api/quotations", { method: "POST", body: JSON.stringify(payload) });
    alert(`Quotation saved with id ${res._id}`);
    setItems([]);
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Employee Dashboard</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Total Quotations" value={stats?.total_quotations ?? "-"} />
        <Stat label="Last 30 Days" value={stats?.last30_quotations ?? "-"} />
        <Stat label="Total Revenue" value={`$${(stats?.total_revenue ?? 0).toFixed ? (stats?.total_revenue ?? 0).toFixed(0) : stats?.total_revenue ?? 0}`} />
        <Stat label="Avg Quote" value={`$${(stats?.avg_quote_value ?? 0).toFixed ? (stats?.avg_quote_value ?? 0).toFixed(0) : stats?.avg_quote_value ?? 0}`} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-5 space-y-4">
        <h3 className="text-lg font-semibold">Your Info</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input className="input" placeholder="Your User ID (employee)" value={employeeId} onChange={e=>setEmployeeId(e.target.value)} />
          <input className="input" placeholder="Client Name" value={client.name} onChange={e=>setClient(v=>({...v,name:e.target.value}))} />
          <input className="input" placeholder="Client Contact" value={client.contact} onChange={e=>setClient(v=>({...v,contact:e.target.value}))} />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-5 space-y-4">
        <h3 className="text-lg font-semibold">Packages</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {packages.map(p => (
            <div key={p._id} className="border rounded-lg p-3">
              <div className="font-medium">{p.name}</div>
              <div className="text-sm text-gray-600">${p.price}</div>
              <button className="btn-primary mt-2" onClick={()=>addPackage(p)}>Add</button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-5 space-y-4">
        <h3 className="text-lg font-semibold">Quotation</h3>
        {items.length === 0 ? <div className="text-gray-500">No items yet. Add packages above.</div> : (
          <div className="space-y-3">
            {items.map(it => (
              <div key={it.package_id} className="flex items-center justify-between border rounded p-2">
                <div>
                  <div className="font-medium">{it.name}</div>
                  <div className="text-sm text-gray-600">${it.unit_price} each</div>
                </div>
                <div className="flex items-center gap-2">
                  <input type="number" min={1} value={it.quantity} onChange={e=>updateQty(it.package_id, Number(e.target.value))} className="input w-20" />
                  <div className="w-24 text-right font-medium">${(it.total).toFixed ? it.total.toFixed(2) : it.total}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input type="number" className="input" placeholder="Discount" value={discount} onChange={e=>setDiscount(e.target.value)} />
          <input type="number" className="input" placeholder="Tax" value={tax} onChange={e=>setTax(e.target.value)} />
          <div className="input bg-gray-50 flex items-center justify-between">
            <span>Subtotal</span>
            <span>${subtotal.toFixed ? subtotal.toFixed(2) : subtotal}</span>
          </div>
        </div>
        <div className="flex items-center justify-between text-lg font-semibold">
          <div>Total</div>
          <div>${(subtotal - Number(discount || 0) + Number(tax || 0)).toFixed ? (subtotal - Number(discount || 0) + Number(tax || 0)).toFixed(2) : (subtotal - Number(discount || 0) + Number(tax || 0))}</div>
        </div>
        <div className="flex justify-end">
          <button className="btn-primary" onClick={saveQuotation}>Save Quotation</button>
        </div>
      </div>
    </div>
  );
}
