import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Plus, Search, Edit3, Trash2, Package, AlertTriangle, 
  Check, X, Loader2, Barcode, Scale, Tags, RefreshCw
} from 'lucide-react';

export default function Inventory() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

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
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Safety: ensure we send numbers where expected
    const payload = {
      ...formData,
      cost_price: Number(formData.cost_price),
      selling_price: Number(formData.selling_price),
      current_stock: Number(formData.current_stock),
      reorder_level: Number(formData.reorder_level)
    };

    try {
      if (editingProduct) {
        await supabase.from('products').update(payload).eq('id', editingProduct.id);
      } else {
        await supabase.from('products').insert([payload]);
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      alert("Error saving: Check if your table columns match exactly.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter italic">Stock List</h1>
            <p className="text-slate-500 font-bold uppercase text-[10px]">Verify your cereal & supermarket items</p>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchProducts} className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-amber-500 transition-all">
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
            <button onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}
              className="bg-amber-500 text-slate-900 px-8 py-4 rounded-2xl font-black shadow-xl hover:bg-amber-400 transition-all flex items-center gap-2">
              <Plus size={20} strokeWidth={3} /> ADD PRODUCT
            </button>
          </div>
        </div>

        {/* SEARCH BAR */}
        <div className="mb-8 relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search products..." 
            className="w-full bg-white border border-slate-200 pl-12 pr-4 py-4 rounded-2xl font-bold outline-none focus:border-amber-500 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* PRODUCT GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.filter(p => (p.name || '').toLowerCase().includes(searchTerm.toLowerCase())).map(product => (
            <div key={product.id} className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm hover:border-amber-500 transition-all group">
              <div className="flex justify-between mb-4">
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-2 ${
                  (product.current_stock || 0) <= (product.reorder_level || 5) ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${(product.current_stock || 0) <= (product.reorder_level || 5) ? 'bg-red-600 animate-pulse' : 'bg-emerald-600'}`} />
                  {(product.current_stock || 0) <= (product.reorder_level || 5) ? 'Low Stock' : 'In Stock'}
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditingProduct(product); setFormData(product); setIsModalOpen(true); }} className="text-slate-400 hover:text-amber-500"><Edit3 size={18}/></button>
                  <button onClick={async () => { if(confirm('Delete?')) { await supabase.from('products').delete().eq('id', product.id); fetchProducts(); }}} className="text-slate-400 hover:text-red-500"><Trash2 size={18}/></button>
                </div>
              </div>

              <h3 className="text-xl font-black text-slate-900 uppercase truncate">{product.name || 'Unnamed Product'}</h3>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4">
                {product.category || 'General'} • {product.unit_type || product.unit || 'Units'}
              </p>
              
              <div className="bg-slate-50 p-4 rounded-2xl mb-4 border border-slate-100">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Stock Level</p>
                    <p className="text-2xl font-black italic text-slate-900">{product.current_stock || 0}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Selling Price</p>
                    <p className="text-xl font-black italic text-slate-900">KES {product.selling_price || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {loading && <div className="text-center py-20"><Loader2 className="animate-spin text-amber-500 mx-auto" size={40} /></div>}
        {!loading && products.length === 0 && (
          <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-slate-200">
            <Package className="mx-auto text-slate-200 mb-4" size={64} />
            <p className="text-slate-400 font-bold uppercase tracking-widest">No products found in database</p>
          </div>
        )}
      </div>
      
      {/* MODAL (Same as previous step) */}
    </div>
  );
}