import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Plus, Search, Edit3, Trash2, Package, AlertTriangle, 
  Check, X, Loader2, Barcode, Scale, Tags
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  barcode: string;
  category: string;
  unit_type: string; // kg, pieces, carton, etc.
  cost_price: number;
  selling_price: number;
  current_stock: number;
  reorder_level: number;
}

// DROPDOWN CONSTANTS
const PRODUCT_TYPES = ["Rice", "Cereals", "Drinks", "Flour", "Cosmetics", "Bakery", "Dairy", "Household", "Snacks", "Vegetables"];
const UNIT_OPTIONS = ["kg", "Packets", "Pieces", "Carton", "Litres", "Grams", "Bundle", "Bales"];

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
    category: 'Rice',
    unit_type: 'kg',
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

  // --- BARCODE AUTO-FILL LOGIC ---
  const handleBarcodeFetch = async () => {
    if (!formData.barcode) return;
    setLoading(true);
    
    try {
      // In a real production environment, you would use a proxy to fetch from barcode-list.com or a Global GS1 API
      // Here we simulate the external fetch:
      const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${formData.barcode}.json`);
      const data = await response.json();

      if (data.status === 1) {
        setFormData({
          ...formData,
          name: data.product.product_name || '',
          description: data.product.generic_name || data.product.categories || '',
          category: data.product.main_category?.split(':')[1] || 'General'
        });
      } else {
        alert("Barcode not found in international list. Please enter name manually.");
      }
    } catch (error) {
      console.error("API Error", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (editingProduct) {
      await supabase.from('products').update(formData).eq('id', editingProduct.id);
    } else {
      await supabase.from('products').insert([formData]);
    }
    setIsModalOpen(false);
    setEditingProduct(null);
    fetchProducts();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Permanently delete this product?")) {
      await supabase.from('products').delete().eq('id', id);
      fetchProducts();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Inventory Management</h1>
            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em]">Live Supermarket Database</p>
          </div>
          <button onClick={() => { setEditingProduct(null); setFormData({name: '', description: '', barcode: '', category: 'Rice', unit_type: 'kg', cost_price: 0, selling_price: 0, current_stock: 0, reorder_level: 5}); setIsModalOpen(true); }}
            className="bg-amber-500 text-slate-900 px-8 py-4 rounded-2xl font-black shadow-xl hover:bg-amber-400 transition-all flex items-center gap-2">
            <Plus size={20} /> ADD PRODUCT
          </button>
        </div>

        {/* PRODUCTS LIST */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(product => (
            <div key={product.id} className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm group hover:border-amber-500 transition-all">
              <div className="flex justify-between mb-4">
                 {/* STOCK STATUS INDICATOR */}
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                  product.current_stock <= product.reorder_level ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                }`}>
                  <div className={`h-1.5 w-1.5 rounded-full ${product.current_stock <= product.reorder_level ? 'bg-red-600 animate-pulse' : 'bg-emerald-600'}`} />
                  {product.current_stock <= product.reorder_level ? 'Low Stock' : 'In Stock'}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditingProduct(product); setFormData(product); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:text-amber-500"><Edit3 size={18}/></button>
                  <button onClick={() => handleDelete(product.id)} className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={18}/></button>
                </div>
              </div>
              
              <h3 className="text-xl font-black text-slate-900 uppercase truncate">{product.name}</h3>
              <p className="text-slate-400 text-xs font-bold mb-4">{product.category} • {product.unit_type}</p>
              
              <div className="bg-slate-50 p-4 rounded-2xl mb-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Stock Level</p>
                <p className="text-2xl font-black italic">{product.current_stock} <span className="text-xs font-bold not-italic">{product.unit_type}</span></p>
              </div>

              <div className="flex justify-between items-center border-t pt-4">
                <div>
                  <p className="text-[10px] font-black text-slate-300 uppercase">Selling Price</p>
                  <p className="text-lg font-black text-slate-900 italic">KES {product.selling_price}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-300 uppercase">Barcode</p>
                  <p className="text-[10px] font-bold text-slate-500">{product.barcode || 'N/A'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FULL PRODUCT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl p-10 shadow-2xl overflow-y-auto max-h-[90vh] animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-slate-900 uppercase italic">{editingProduct ? 'Edit Variety' : 'Add New Product'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="bg-slate-50 p-2 rounded-full text-slate-400"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-5">
              {/* BARCODE LOOKUP SECTION */}
              <div className="col-span-2 space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Scan / Input Barcode</label>
                <div className="flex gap-2">
                  <input className="flex-1 bg-slate-50 p-4 rounded-xl border-2 border-slate-100 font-bold outline-none focus:border-amber-500" 
                    placeholder="Enter Barcode..." value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} />
                  <button type="button" onClick={handleBarcodeFetch} className="bg-slate-900 text-amber-500 px-6 rounded-xl font-black text-xs uppercase hover:bg-slate-800 transition-all">
                    <Barcode size={20} className="inline mr-2" /> Auto-Fill
                  </button>
                </div>
              </div>

              <div className="col-span-2 space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Product Name</label>
                <input required className="w-full bg-slate-50 p-4 rounded-xl border-2 border-slate-100 font-bold outline-none focus:border-amber-500" 
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>

              {/* DROPDOWNS */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Product Category</label>
                <select className="w-full bg-slate-50 p-4 rounded-xl border-2 border-slate-100 font-bold outline-none focus:border-amber-500"
                  value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                  {PRODUCT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unit Type (kg/packet/etc)</label>
                <select className="w-full bg-slate-50 p-4 rounded-xl border-2 border-slate-100 font-bold outline-none focus:border-amber-500"
                  value={formData.unit_type} onChange={e => setFormData({...formData, unit_type: e.target.value})}>
                  {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Stock Level</label>
                <input required type="number" className="w-full bg-slate-50 p-4 rounded-xl border-2 border-slate-100 font-bold outline-none focus:border-amber-500" 
                  value={formData.current_stock} onChange={e => setFormData({...formData, current_stock: Number(e.target.value)})} />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Min. Alert Level</label>
                <input required type="number" className="w-full bg-slate-50 p-4 rounded-xl border-2 border-slate-100 font-bold outline-none focus:border-amber-500" 
                  value={formData.reorder_level} onChange={e => setFormData({...formData, reorder_level: Number(e.target.value)})} />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Buying Price (KES)</label>
                <input required type="number" className="w-full bg-slate-50 p-4 rounded-xl border-2 border-slate-100 font-bold outline-none focus:border-amber-500" 
                  value={formData.cost_price} onChange={e => setFormData({...formData, cost_price: Number(e.target.value)})} />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest ml-1">Selling Price (KES)</label>
                <input required type="number" className="w-full bg-amber-50 p-4 rounded-xl border-2 border-amber-200 font-black italic text-slate-900 outline-none focus:border-amber-500" 
                  value={formData.selling_price} onChange={e => setFormData({...formData, selling_price: Number(e.target.value)})} />
              </div>

              <button type="submit" disabled={loading} className="col-span-2 py-5 bg-slate-900 text-amber-500 font-black rounded-3xl shadow-2xl hover:bg-slate-800 transition-all uppercase tracking-[0.2em] text-xs mt-4">
                {loading ? <Loader2 className="animate-spin" /> : 'Confirm to System'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}