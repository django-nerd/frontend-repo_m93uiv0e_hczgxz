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

function Section({ title, children, actions }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        {actions}
      </div>
      {children}
    </div>
  );
}

export default function AdminPanel() {
  const [categories, setCategories] = useState([]);
  const [subcats, setSubcats] = useState([]);
  const [packages, setPackages] = useState([]);
  const [quotations, setQuotations] = useState([]);

  const [catForm, setCatForm] = useState({ name: "", description: "" });
  const [subForm, setSubForm] = useState({ name: "", description: "", category_id: "" });
  const [pkgForm, setPkgForm] = useState({ name: "", description: "", category_id: "", subcategory_id: "", features: "", price: "" });

  const categoryMap = useMemo(() => Object.fromEntries(categories.map(c => [c._id, c.name])), [categories]);
  const subcatMap = useMemo(() => Object.fromEntries(subcats.map(s => [s._id, s.name])), [subcats]);

  async function loadAll() {
    const [cats, subs, pkgs, quotes] = await Promise.all([
      api("/api/categories"),
      api("/api/subcategories"),
      api("/api/packages"),
      api("/api/quotations"),
    ]);
    setCategories(cats);
    setSubcats(subs);
    setPackages(pkgs);
    setQuotations(quotes);
  }

  useEffect(() => { loadAll().catch(console.error); }, []);

  async function addCategory(e) {
    e.preventDefault();
    await api("/api/categories", { method: "POST", body: JSON.stringify({ ...catForm, is_active: true }) });
    setCatForm({ name: "", description: "" });
    loadAll();
  }

  async function addSubcategory(e) {
    e.preventDefault();
    await api("/api/subcategories", { method: "POST", body: JSON.stringify({ ...subForm, is_active: true }) });
    setSubForm({ name: "", description: "", category_id: "" });
    loadAll();
  }

  async function addPackage(e) {
    e.preventDefault();
    const features = pkgForm.features.split(",").map(f => f.trim()).filter(Boolean);
    await api("/api/packages", { method: "POST", body: JSON.stringify({
      name: pkgForm.name,
      description: pkgForm.description || null,
      category_id: pkgForm.category_id || null,
      subcategory_id: pkgForm.subcategory_id || null,
      features,
      price: Number(pkgForm.price || 0),
      is_active: true,
    }) });
    setPkgForm({ name: "", description: "", category_id: "", subcategory_id: "", features: "", price: "" });
    loadAll();
  }

  async function del(path, id) {
    if (!confirm("Delete this item?")) return;
    await api(`${path}/${id}`, { method: "DELETE" });
    loadAll();
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Admin Panel</h2>

      <Section title="House Categories">
        <form onSubmit={addCategory} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input className="input" placeholder="Name" value={catForm.name} onChange={e=>setCatForm(v=>({...v,name:e.target.value}))} />
          <input className="input md:col-span-2" placeholder="Description" value={catForm.description} onChange={e=>setCatForm(v=>({...v,description:e.target.value}))} />
          <button className="btn-primary">Add</button>
        </form>
        <div className="divide-y">{categories.map(c => (
          <div key={c._id} className="flex items-center justify-between py-2">
            <div>
              <div className="font-medium">{c.name}</div>
              {c.description && <div className="text-sm text-gray-500">{c.description}</div>}
            </div>
            <button className="btn-danger" onClick={()=>del("/api/categories", c._id)}>Delete</button>
          </div>
        ))}</div>
      </Section>

      <Section title="Sub-housing Categories">
        <form onSubmit={addSubcategory} className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <select className="input" value={subForm.category_id} onChange={e=>setSubForm(v=>({...v,category_id:e.target.value}))}>
            <option value="">Select Category</option>
            {categories.map(c=> <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <input className="input" placeholder="Name" value={subForm.name} onChange={e=>setSubForm(v=>({...v,name:e.target.value}))} />
          <input className="input md:col-span-2" placeholder="Description" value={subForm.description} onChange={e=>setSubForm(v=>({...v,description:e.target.value}))} />
          <button className="btn-primary">Add</button>
        </form>
        <div className="divide-y">{subcats.map(s => (
          <div key={s._id} className="flex items-center justify-between py-2">
            <div>
              <div className="font-medium">{s.name}</div>
              <div className="text-sm text-gray-500">{categoryMap[s.category_id] || s.category_id}</div>
            </div>
            <button className="btn-danger" onClick={()=>del("/api/subcategories", s._id)}>Delete</button>
          </div>
        ))}</div>
      </Section>

      <Section title="Packages">
        <form onSubmit={addPackage} className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <input className="input" placeholder="Name" value={pkgForm.name} onChange={e=>setPkgForm(v=>({...v,name:e.target.value}))} />
          <select className="input" value={pkgForm.category_id} onChange={e=>setPkgForm(v=>({...v,category_id:e.target.value}))}>
            <option value="">Category</option>
            {categories.map(c=> <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <select className="input" value={pkgForm.subcategory_id} onChange={e=>setPkgForm(v=>({...v,subcategory_id:e.target.value}))}>
            <option value="">Subcategory</option>
            {subcats.map(s=> <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
          <input className="input" placeholder="Features (comma separated)" value={pkgForm.features} onChange={e=>setPkgForm(v=>({...v,features:e.target.value}))} />
          <input type="number" className="input" placeholder="Price" value={pkgForm.price} onChange={e=>setPkgForm(v=>({...v,price:e.target.value}))} />
          <button className="btn-primary">Add</button>
          <input className="input md:col-span-6" placeholder="Description" value={pkgForm.description} onChange={e=>setPkgForm(v=>({...v,description:e.target.value}))} />
        </form>
        <div className="divide-y">{packages.map(p => (
          <div key={p._id} className="flex items-start justify-between py-3">
            <div>
              <div className="font-medium">{p.name} <span className="text-sm text-gray-500">${p.price?.toFixed?.(2) ?? p.price}</span></div>
              <div className="text-sm text-gray-500">
                {(categoryMap[p.category_id] || "-") + (p.subcategory_id ? ` / ${subcatMap[p.subcategory_id] || p.subcategory_id}` : "")}
              </div>
              {p.features?.length ? <div className="text-xs text-gray-600 mt-1">Features: {p.features.join(", ")}</div> : null}
            </div>
            <button className="btn-danger" onClick={()=>del("/api/packages", p._id)}>Delete</button>
          </div>
        ))}</div>
      </Section>

      <Section title="All Quotations">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600">
                <th className="py-2 pr-4">Client</th>
                <th className="py-2 pr-4">Employee</th>
                <th className="py-2 pr-4">Total</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {quotations.map(q => (
                <tr key={q._id} className="border-t">
                  <td className="py-2 pr-4">{q.client_name}</td>
                  <td className="py-2 pr-4">{q.employee_id}</td>
                  <td className="py-2 pr-4 font-medium">${q.total?.toFixed?.(2) ?? q.total}</td>
                  <td className="py-2 pr-4"><span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700">{q.status}</span></td>
                  <td className="py-2">
                    <button className="btn-danger" onClick={()=>del("/api/quotations", q._id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}
