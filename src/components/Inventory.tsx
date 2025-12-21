import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Plus, Search, Edit3, Trash2, Package, AlertTriangle, 
  Check, X, Loader2, Layers, Barcode, Info
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  barcode: string;
  category: string;
  unit: string;
  cost_price: number;
  selling_price: number;
  current_stock: number;
  reorder_level: number;
}

const CATEGORIES = ["Cereals", "Drinks", "Flour", "Cosmetics", "Bakery", "Dairy", "Household", "Snacks"];
const UNITS = ["kg", "packets", "piece", "litres", "grams", "box", "bundle"];

export default function Inventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    barcode: '',
    category: 'Cereals',
    unit: 'kg',
    cost_price: 0,
    selling_price: 0,
    current_stock: 0,
    reorder_level: 5
  });

  useEffect(() => { fetchProducts(); }, []);

  async function fetchProducts() {
    setLoading(true);
    const { data } = await supabase.from('products').select('*').order('name', { ascending: true });
    setProducts(data || []);
    setLoading(false);
  }

  // Barcode Lookup Simulation (Universal List)
  const handleBarcodeLookup = () => {
    if (!formData.barcode) return;
    // In a real app, you'd fetch from an API like OpenFoodFacts
    // Simulating a hit:
    if (formData.barcode === "600123456789") {
      setFormData({ ...formData, name: "Premium Basmati Rice", description: "Long-grain aromatic rice", category: "Cereals", unit: "kg" });
    } else {
      alert("Barcode not found in universal database. Please enter details manually.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const payload = { ...formData };

    if (editingProduct) {
      await supabase.from('products').update(payload).eq('id', editingProduct.id);
    } else {
      await supabase.from('products').insert([payload]);
    }

    setIsModalOpen(false);
    setEditingProduct(null);
    setFormData({ name: '', description: '', barcode: '', category: 'Cereals', unit: 'kg', cost_price: 0, selling_price: 0, current_stock: 0, reorder_level: 5 });
    fetchProducts();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Permanently delete this product?")) {
      await supabase.from('products').delete().eq('id', id);
      fetchProducts();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter italic">Stock Manager</h1>
            <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">Supermarket Inventory Control</p>
          </div>
          <button 
            onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}
            className="bg-amber-500 text-slate-900 px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-2 shadow-xl hover:bg-amber-400 transition-all"
          >
            <Plus size={20} strokeWidth={3} /> ADD PRODUCT
          </button>
        </div>

        {/* PRODUCT GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(product => (
            <div key={product.id} className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm group hover:border-amber-500 transition-all">
              <div className="flex justify-between items-start mb-4">
                <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  product.current_stock <= product.reorder_level ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
                }`}>
                  {product.current_stock <= product.reorder_level ? '● Low Stock' : '● In Stock'}
                </span>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditingProduct(product); setFormData(product); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:text-amber-500"><Edit3 size={18}/></button>
                  <button onClick={() => handleDelete(product.id)} className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={18}/></button>
                </div>
              </div>

              <h3 className="text-xl font-black text-slate-900 uppercase truncate">{product.name}</h3>
              <p className="text-slate-400 text-xs font-bold mb-4 line-clamp-1">{product.description || 'No description'}</p>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-50 p-3 rounded-xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quantity</p>
                  <p className="text-lg font-black italic">{product.current_stock} <span className="text-xs font-bold not-italic">{product.unit}</span></p>
                </div>
                <div className="bg-amber-50 p-3 rounded-xl">
                  <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Selling Price</p>
                  <p className="text-lg font-black italic">KES {product.selling_price}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-t pt-4">
                <Layers size={14} className="text-amber-500" /> {product.category}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* COMPREHENSIVE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl p-10 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-slate-900 uppercase italic">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="bg-slate-100 p-2 rounded-full"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6">
              {/* Barcode Section */}
              <div className="col-span-2 relative">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Barcode Lookup</label>
                <div className="flex gap-2">
                  <input className="flex-1 bg-slate-50 p-4 rounded-xl border-2 border-slate-100 font-bold outline-none focus:border-amber-500" 
                    placeholder="Scan or enter barcode..." value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} />
                  <button type="button" onClick={handleBarcodeLookup} className="bg-slate-900 text-amber-500 px-6 rounded-xl font-black text-xs uppercase hover:bg-slate-800 transition-all">
                    <Barcode size={20} />
                  </button>
                </div>
              </div>

              <div className="col-span-2 space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Product Name</label>
                <input required className="w-full bg-slate-50 p-4 rounded-xl border-2 border-slate-100 font-bold outline-none focus:border-amber-500" 
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>

              <div className="col-span-2 space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Short Description</label>
                <textarea className="w-full bg-slate-50 p-4 rounded-xl border-2 border-slate-100 font-bold outline-none focus:border-amber-500 h-20" 
                  value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                <select className="w-full bg-slate-50 p-4 rounded-xl border-2 border-slate-100 font-bold outline-none focus:border-amber-500"
                  value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unit Type</label>
                <select className="w-full bg-slate-50 p-4 rounded-xl border-2 border-slate-100 font-bold outline-none focus:border-amber-500"
                  value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})}>
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cost Price</label>
                <input required type="number" className="w-full bg-slate-50 p-4 rounded-xl border-2 border-slate-100 font-bold outline-none focus:border-amber-500" 
                  value={formData.cost_price} onChange={e => setFormData({...formData, cost_price: Number(e.target.value)})} />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest ml-1">Selling Price</label>
                <input required type="number" className="w-full bg-amber-50 p-4 rounded-xl border-2 border-amber-200 font-black italic text-slate-900 outline-none focus:border-amber-500" 
                  value={formData.selling_price} onChange={e => setFormData({...formData, selling_price: Number(e.target.value)})} />
              </div>

              <button type="submit" className="col-span-2 py-5 bg-slate-900 text-amber-500 font-black rounded-[2rem] shadow-xl hover:bg-slate-800 transition-all uppercase tracking-widest text-sm mt-4">
                {loading ? <Loader2 className="animate-spin" /> : 'Sync Product to Cloud'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}