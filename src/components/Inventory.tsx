import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Plus, Search, Edit3, Trash2, Package, AlertTriangle, 
  Check, X, Loader2, Barcode, RefreshCw, Box, Truck
} from 'lucide-react';

const PRODUCT_TYPES = ["Rice", "Cereals", "Drinks", "Flour", "Cosmetics", "Bakery", "Dairy", "Household", "Snacks", "Vegetables"];
const UNIT_OPTIONS = ["Pieces", "kg", "Carton", "Packets", "Litres", "Grams", "Bundle", "Bales"];

export default function Inventory() {
  const [products, setProducts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  const initialForm = {
    name: '',
    description: '',
    barcode: '',
    category: 'Rice',
    unit: 'Pieces',
    cost_price: 0,
    selling_price: 0,
    current_stock: 0,
    reorder_level: 5,
    supplier_id: '' 
  };

  const [formData, setFormData] = useState<any>(initialForm);

  useEffect(() => { 
    fetchProducts();
    fetchSuppliers(); 
  }, []);

  async function fetchProducts() {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setProducts(data || []);
    setLoading(false);
  }

  // --- EXTREMELY AGGRESSIVE FETCH POINTED TO DISTRIBUTORS TABLE ---
  async function fetchSuppliers() {
    const syncId = new Date().getTime(); // Unique ID to bypass cache
    
    const { data, error } = await supabase
      .from('distributors') // TARGETING YOUR REAL PARTNER TABLE
      .select('id, name')
      .not('name', 'is', null) 
      .order('name', { ascending: true });
    
    if (error) {
      console.error(`[Sync ${syncId}] Registry Error:`, error.message);
      alert("Partner Sync Error: " + error.message);
    } else {
      console.log(`[Sync ${syncId}] SUCCESS: Found ${data?.length || 0} partners`);
      setSuppliers(data || []);
    }
  }

  // --- TRIGGER REFRESH WHEN OPENING MODAL ---
  const handleOpenModal = async () => {
    setEditingProduct(null);
    setFormData(initialForm);
    
    // Aggressive re-fetch at the exact moment of button click
    await fetchSuppliers(); 
    
    setIsModalOpen(true);
  };

  const handleBarcodeLookup = async () => {
    if (!formData.barcode) return;
    setLoading(true);
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${formData.barcode}.json`);
      const data = await res.json();
      if (data.status === 1) {
        setFormData({
          ...formData,
          name: data.product.product_name || '',
          description: data.product.generic_name || data.product.categories || '',
          category: data.product.main_category?.split(':')[1] || 'Cereals'
        });
      } else {
        alert("Barcode not found in universal list. Please enter details manually.");
      }
    } catch (e) {
      alert("Search failed. Please check your internet connection.");
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const submissionData = {
      ...formData,
      cost_price: Number(formData.cost_price),
      selling_price: Number(formData.selling_price),
      current_stock: Number(formData.current_stock),
      reorder_level: Number(formData.reorder_level)
    };

    let result;
    if (editingProduct?.id) {
      result = await supabase.from('products').update(submissionData).eq('id', editingProduct.id);
    } else {
      result = await supabase.from('products').insert([submissionData]);
      
      if (!result.error && formData.supplier_id && formData.current_stock > 0) {
        await supabase.from('supplier_purchases').insert([{
          supplier_id: formData.supplier_id,
          product_name: formData.name,
          quantity: Number(formData.current_stock),
          unit_cost: Number(formData.cost_price),
          total_cost: Number(formData.cost_price) * Number(formData.current_stock)
        }]);
      }
    }

    if (result.error) {
      alert("Save Failed: " + result.error.message);
    } else {
      setIsModalOpen(false);
      setEditingProduct(null);
      setFormData(initialForm);
      fetchProducts();
      await fetchSuppliers(); 
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter italic">Nit-Nit Inventory</h1>
            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Active Stock: {products.length} Items</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => { fetchProducts(); fetchSuppliers(); }} className="bg-white p-4 rounded-2xl border border-slate-200 text-slate-400 hover:text-amber-500 transition-all shadow-sm">
              <RefreshCw size={24} className={loading ? 'animate-spin' : ''} />
            </button>
            <button onClick={handleOpenModal}
              className="bg-amber-500 text-slate-900 px-8 py-4 rounded-2xl font-black shadow-xl hover:bg-amber-400 transition-all flex items-center gap-2">
              <Plus size={20} strokeWidth={3} /> ADD PRODUCT
            </button>
          </div>
        </div>

        <div className="mb-8 relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input type="text" placeholder="Search name or scan barcode..." className="w-full bg-white border border-slate-200 pl-12 pr-4 py-4 rounded-2xl font-bold focus:border-amber-500 outline-none shadow-sm"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.filter(p => (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (p.barcode || '').includes(searchTerm)).map(product => (
            <div key={product.id} className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm hover:border-amber-500 transition-all group relative overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                  Number(product.current_stock) <= Number(product.reorder_level) ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                }`}>
                  <div className={`h-1.5 w-1.5 rounded-full ${Number(product.current_stock) <= Number(product.reorder_level) ? 'bg-red-600 animate-pulse' : 'bg-emerald-600'}`} />
                  {Number(product.current_stock) <= Number(product.reorder_level) ? 'Low Stock' : 'In Stock'}
                </div>
                
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditingProduct(product); setFormData(product); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:text-amber-500 transition-colors"><Edit3 size={18}/></button>
                  <button onClick={async () => { if(confirm('Delete?')) { await supabase.from('products').delete().eq('id', product.id); fetchProducts(); }}} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
                </div>
              </div>

              <h3 className="text-xl font-black text-slate-900 uppercase truncate mb-1">{product.name}</h3>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4">
                {product.category || 'Rice'} • {product.unit || 'Pieces'}
              </p>
              
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 mb-4 flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Stock</p>
                  <p className="text-3xl font-black italic text-slate-900">{product.current_stock}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Selling Price</p>
                  <p className="text-xl font-black text-slate-900 italic">KES {product.selling_price}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl p-10 shadow-2xl overflow-y-auto max-h-[90vh] animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-slate-900 uppercase italic">{editingProduct ? 'Edit variety' : 'Register New Product'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="bg-slate-100 p-2 rounded-full text-slate-400 hover:text-red-500 transition-colors"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-5">
              
              {/* SYNCED PARTNER SELECTOR */}
              <div className="col-span-2 space-y-1">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <Truck size={12} /> Source Partner ({suppliers.length} found)
                  </label>
                  <button 
                    type="button" 
                    onClick={fetchSuppliers} 
                    className="text-[9px] font-black uppercase text-amber-600 hover:text-amber-700 underline"
                  >
                    Force Registry Re-sync
                  </button>
                </div>
                <select 
                  required
                  className="w-full bg-slate-50 p-4 rounded-xl border-2 border-slate-100 font-bold outline-none focus:border-amber-500 appearance-none"
                  value={formData.supplier_id} 
                  onChange={e => setFormData({...formData, supplier_id: e.target.value})}
                >
                  <option value="">-- Choose Partner (AA, Al-Jazer, etc) --</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                {suppliers.length === 0 && <p className="text-[9px] text-red-500 italic ml-1">Registry empty. Add partners in the Financial page first.</p>}
              </div>

              <div className="col-span-2 space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Barcode / Lookup</label>
                <div className="flex gap-2">
                  <input className="flex-1 bg-slate-50 p-4 rounded-xl border-2 border-slate-100 font-bold outline-none focus:border-amber-500" 
                    placeholder="Enter Barcode..." value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} />
                  <button type="button" onClick={handleBarcodeLookup} className="bg-slate-900 text-amber-500 px-6 rounded-xl font-black text-xs uppercase hover:bg-slate-800 transition-all">
                    Auto-Lookup
                  </button>
                </div>
              </div>

              <div className="col-span-2 space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Product Name</label>
                <input required className="w-full bg-slate-50 p-4 rounded-xl border-2 border-slate-100 font-bold outline-none focus:border-amber-500" 
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Type</label>
                <select className="w-full bg-slate-50 p-4 rounded-xl border-2 border-slate-100 font-bold outline-none focus:border-amber-500"
                  value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                  {PRODUCT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unit</label>
                <select className="w-full bg-slate-50 p-4 rounded-xl border-2 border-slate-100 font-bold outline-none focus:border-amber-500"
                  value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})}>
                  {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Stock Level</label>
                <input required type="number" className="w-full bg-slate-50 p-4 rounded-xl border-2 border-slate-100 font-bold outline-none focus:border-amber-500" 
                  value={formData.current_stock} onChange={e => setFormData({...formData, current_stock: Number(e.target.value)})} />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Buying Price (KES)</label>
                <input required type="number" className="w-full bg-slate-50 p-4 rounded-xl border-2 border-slate-100 font-bold outline-none focus:border-amber-500" 
                  value={formData.cost_price} onChange={e => setFormData({...formData, cost_price: Number(e.target.value)})} />
              </div>

              <div className="col-span-2 space-y-1">
                <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest ml-1">Selling Price (POS)</label>
                <input required type="number" className="w-full bg-amber-50 p-4 rounded-xl border-2 border-amber-200 font-black italic text-slate-900 outline-none focus:border-amber-500" 
                  value={formData.selling_price} onChange={e => setFormData({...formData, selling_price: Number(e.target.value)})} />
              </div>

              <button type="submit" disabled={loading} className="col-span-2 py-5 bg-slate-900 text-amber-500 font-black rounded-[2rem] shadow-xl hover:bg-slate-800 transition-all uppercase tracking-widest text-sm mt-4">
                {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Confirm Stock to System'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}