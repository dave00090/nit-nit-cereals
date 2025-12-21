import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Plus, Search, Edit3, Trash2, Filter, 
  Package, AlertTriangle, Check, X, Loader2, 
  ArrowUpDown, MoreVertical, Layers
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  unit: string;
  cost_price: number;
  selling_price: number;
  current_stock: number;
  reorder_level: number;
  created_at?: string;
}

export default function Inventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    unit: 'kg',
    cost_price: 0,
    selling_price: 0,
    current_stock: 0,
    reorder_level: 5
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    const { data, error } = await supabase
      .from('products') // Matches your public.products table
      .select('*')
      .order('name', { ascending: true });
    
    if (error) console.error("Error fetching products:", error);
    else setProducts(data || []);
    setLoading(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const payload = {
      ...formData,
      cost_price: Number(formData.cost_price),
      selling_price: Number(formData.selling_price),
      current_stock: Number(formData.current_stock),
      reorder_level: Number(formData.reorder_level)
    };

    if (editingProduct) {
      await supabase.from('products').update(payload).eq('id', editingProduct.id);
    } else {
      await supabase.from('products').insert([payload]);
    }

    setIsModalOpen(false);
    setEditingProduct(null);
    setFormData({ name: '', unit: 'kg', cost_price: 0, selling_price: 0, current_stock: 0, reorder_level: 5 });
    fetchProducts();
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    await supabase.from('products').delete().eq('id', id);
    fetchProducts();
  };

  const handleEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      unit: p.unit,
      cost_price: p.cost_price,
      selling_price: p.selling_price,
      current_stock: p.current_stock,
      reorder_level: p.reorder_level
    });
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter italic">Product Inventory</h1>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Manage your cereal stock & pricing</p>
          </div>
          <button 
            onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}
            className="bg-amber-500 text-slate-900 px-8 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 hover:bg-amber-400 transition-all active:scale-95"
          >
            <Plus size={20} strokeWidth={3} />
            ADD NEW PRODUCT
          </button>
        </div>

        {/* SEARCH & STATS BAR */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-2 relative bg-white rounded-2xl shadow-sm border border-slate-200 px-5 py-3 flex items-center gap-3 focus-within:border-amber-500 transition-all">
            <Search className="text-slate-400" size={20} />
            <input 
              type="text" placeholder="Search by name..." 
              className="outline-none flex-1 text-slate-700 bg-transparent font-bold"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="bg-slate-900 rounded-2xl p-4 flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <Layers className="text-amber-500" size={20} />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Varieties</span>
            </div>
            <span className="text-xl font-black italic">{products.length}</span>
          </div>
        </div>

        {/* INVENTORY TABLE */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-bottom border-slate-100">
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Product Name</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Unit</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Stock Level</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Buying (KES)</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Selling (KES)</th>
                  <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan={6} className="p-20 text-center"><Loader2 className="animate-spin text-amber-500 mx-auto" size={40} /></td></tr>
                ) : products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(product => (
                  <tr key={product.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <p className="font-black text-slate-900 uppercase tracking-tight">{product.name}</p>
                    </td>
                    <td className="px-6 py-6 font-bold text-slate-500 uppercase text-xs">{product.unit}</td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-2">
                        <span className={`text-lg font-black italic ${product.current_stock <= product.reorder_level ? 'text-red-500' : 'text-slate-900'}`}>
                          {product.current_stock}
                        </span>
                        {product.current_stock <= product.reorder_level && <AlertTriangle size={14} className="text-red-500 animate-pulse" />}
                      </div>
                    </td>
                    <td className="px-6 py-6 font-bold text-slate-600">{product.cost_price.toLocaleString()}</td>
                    <td className="px-6 py-6">
                      <span className="bg-amber-50 text-amber-700 px-3 py-1 rounded-lg font-black italic">
                        {product.selling_price.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEdit(product)} className="p-2 text-slate-400 hover:text-amber-500 transition-colors">
                          <Edit3 size={18} />
                        </button>
                        <button onClick={() => deleteProduct(product.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[3rem] w-full max-w-xl p-10 shadow-2xl animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight italic">
                {editingProduct ? 'Update Product' : 'Add New Variety'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="bg-slate-100 p-2 rounded-full text-slate-400"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6">
              <div className="col-span-2 space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Product Description</label>
                <input required className="w-full bg-slate-50 p-4 rounded-xl border-2 border-slate-100 font-bold outline-none focus:border-amber-500" 
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unit (kg/bags/pcs)</label>
                <input required className="w-full bg-slate-50 p-4 rounded-xl border-2 border-slate-100 font-bold outline-none focus:border-amber-500" 
                  value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Min. Alert Level</label>
                <input required type="number" className="w-full bg-slate-50 p-4 rounded-xl border-2 border-slate-100 font-bold outline-none focus:border-amber-500 text-red-500" 
                  value={formData.reorder_level} onChange={e => setFormData({...formData, reorder_level: Number(e.target.value)})} />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Current Stock Quantity</label>
                <input required type="number" className="w-full bg-slate-50 p-4 rounded-xl border-2 border-slate-100 font-bold outline-none focus:border-amber-500" 
                  value={formData.current_stock} onChange={e => setFormData({...formData, current_stock: Number(e.target.value)})} />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cost Price (Buying)</label>
                <input required type="number" className="w-full bg-slate-50 p-4 rounded-xl border-2 border-slate-100 font-bold outline-none focus:border-amber-500" 
                  value={formData.cost_price} onChange={e => setFormData({...formData, cost_price: Number(e.target.value)})} />
              </div>

              <div className="col-span-2 space-y-1">
                <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest ml-1 font-black">Selling Price (KES)</label>
                <input required type="number" className="w-full bg-amber-50 p-6 rounded-2xl border-2 border-amber-200 font-black text-2xl text-slate-900 outline-none focus:border-amber-500" 
                  value={formData.selling_price} onChange={e => setFormData({...formData, selling_price: Number(e.target.value)})} />
              </div>

              <button type="submit" disabled={loading} className="col-span-2 py-5 bg-slate-900 text-amber-500 font-black rounded-[2rem] shadow-xl hover:bg-slate-800 transition-all uppercase tracking-widest text-sm mt-4">
                {loading ? <Loader2 className="animate-spin" /> : 'Confirm Changes'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}