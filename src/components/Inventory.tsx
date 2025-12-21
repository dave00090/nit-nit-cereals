import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Plus, Search, Edit3, Trash2, 
  Package, AlertTriangle, Check, X, Loader2, 
  Layers, Wallet, TrendingUp
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

  // Stats State
  const [totals, setTotals] = useState({
    totalValue: 0,
    totalItems: 0,
    lowStockCount: 0
  });

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
      .from('products') 
      .select('*')
      .order('name', { ascending: true });
    
    if (error) {
      console.error("Error fetching products:", error.message);
    } else {
      const items = data || [];
      setProducts(items);
      
      // Calculate Stats
      const value = items.reduce((acc, p) => acc + (p.current_stock * p.cost_price), 0);
      const low = items.filter(p => p.current_stock <= p.reorder_level).length;
      
      setTotals({
        totalValue: value,
        totalItems: items.length,
        lowStockCount: low
      });
    }
    setLoading(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const payload = {
      name: formData.name,
      unit: formData.unit,
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
    setLoading(false);
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    await supabase.from('products').delete().eq('id', id);
    fetchProducts();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter italic">Inventory</h1>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Stock Management & Valuation</p>
          </div>
          <button 
            onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}
            className="bg-amber-500 text-slate-900 px-8 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 hover:bg-amber-400 transition-all active:scale-95"
          >
            <Plus size={20} strokeWidth={3} />
            ADD PRODUCT
          </button>
        </div>

        {/* STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* STOCK VALUE CARD */}
          <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-2xl shadow-slate-200 relative overflow-hidden">
            <Wallet className="absolute -right-4 -bottom-4 text-white/5" size={120} />
            <div className="relative z-10">
              <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mb-2">Total Inventory Value</p>
              <h2 className="text-3xl font-black italic">KES {totals.totalValue.toLocaleString()}</h2>
              <p className="text-slate-400 text-xs font-bold mt-2 underline decoration-amber-500/50">Based on Cost Price</p>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Product Varieties</p>
              <h2 className="text-3xl font-black text-slate-900">{totals.totalItems}</h2>
            </div>
            <div className="h-14 w-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center">
              <Layers size={28} />
            </div>
          </div>

          <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Low Stock Alerts</p>
              <h2 className={`text-3xl font-black ${totals.lowStockCount > 0 ? 'text-red-500' : 'text-slate-900'}`}>
                {totals.lowStockCount}
              </h2>
            </div>
            <div className={`h-14 w-14 rounded-2xl flex items-center justify-center ${totals.lowStockCount > 0 ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-slate-300'}`}>
              <AlertTriangle size={28} />
            </div>
          </div>
        </div>

        {/* SEARCH BAR */}
        <div className="mb-8 relative bg-white rounded-2xl shadow-sm border border-slate-200 px-5 py-3 flex items-center gap-3 focus-within:border-amber-500 transition-all max-w-md">
          <Search className="text-slate-400" size={20} />
          <input 
            type="text" placeholder="Quick search..." 
            className="outline-none flex-1 text-slate-700 bg-transparent font-bold"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Item Name</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Stock Level</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Unit Cost</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Sale Price</th>
                <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={5} className="p-20 text-center"><Loader2 className="animate-spin text-amber-500 mx-auto" size={40} /></td></tr>
              ) : products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(product => (
                <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <p className="font-black text-slate-900 uppercase tracking-tight">{product.name}</p>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{product.unit}</span>
                  </td>
                  <td className="px-6 py-6 font-black italic text-lg">
                    <span className={product.current_stock <= product.reorder_level ? 'text-red-500' : 'text-slate-800'}>
                      {product.current_stock}
                    </span>
                  </td>
                  <td className="px-6 py-6 text-slate-500 font-bold uppercase text-xs">KES {product.cost_price}</td>
                  <td className="px-6 py-6">
                    <span className="bg-amber-50 text-amber-600 px-3 py-1 rounded-lg font-black text-sm italic">
                      KES {product.selling_price}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => { setEditingProduct(product); setFormData(product); setIsModalOpen(true); }} className="p-2 text-slate-300 hover:text-amber-500 transition-colors"><Edit3 size={18} /></button>
                      <button onClick={() => deleteProduct(product.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL IS THE SAME AS PREVIOUS STEP... */}
    </div>
  );
}