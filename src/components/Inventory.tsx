import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Plus, Search, Edit3, Trash2, Package, AlertTriangle, 
  Check, X, Loader2, Barcode, RefreshCw 
} from 'lucide-react';

export default function Inventory() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  const initialForm = {
    name: '',
    description: '',
    barcode: '',
    category: 'Rice',
    unit_type: 'kg',
    cost_price: 0,
    selling_price: 0,
    current_stock: 0,
    reorder_level: 5
  };

  const [formData, setFormData] = useState<any>(initialForm);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    // Directly fetching to ensure no filters are blocking the view
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Supabase Error:", error.message);
      alert("Database Error: " + error.message);
    } else {
      console.log("Products Loaded:", data); // Check your browser console
      setProducts(data || []);
    }
    setLoading(false);
  }

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
    }

    if (result.error) {
      alert("Save Failed: " + result.error.message);
    } else {
      setIsModalOpen(false);
      setEditingProduct(null);
      setFormData(initialForm);
      await fetchProducts(); // Force re-fetch after save
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter italic">Products</h1>
            <p className="text-slate-500 font-bold uppercase text-xs">Total Items in Database: {products.length}</p>
          </div>
          <div className="flex gap-4">
            <button onClick={fetchProducts} className="bg-white p-4 rounded-2xl border border-slate-200 text-slate-400 hover:text-amber-500 transition-all">
              <RefreshCw size={24} className={loading ? 'animate-spin' : ''} />
            </button>
            <button 
              onClick={() => { setEditingProduct(null); setFormData(initialForm); setIsModalOpen(true); }}
              className="bg-amber-500 text-slate-900 px-8 py-4 rounded-2xl font-black shadow-xl hover:bg-amber-400 transition-all flex items-center gap-2"
            >
              <Plus size={20} strokeWidth={3} /> ADD PRODUCT
            </button>
          </div>
        </div>

        {/* LIST VIEW */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.length === 0 && !loading && (
            <div className="col-span-full bg-white p-20 text-center rounded-[3rem] border-2 border-dashed border-slate-200">
              <Package className="mx-auto text-slate-200 mb-4" size={64} />
              <p className="text-slate-400 font-black uppercase tracking-widest">No products found. Add your first item!</p>
            </div>
          )}

          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm hover:border-amber-500 transition-all group">
              <div className="flex justify-between items-start mb-6">
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                  product.current_stock <= product.reorder_level ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                }`}>
                  <div className={`h-1.5 w-1.5 rounded-full ${product.current_stock <= product.reorder_level ? 'bg-red-600 animate-pulse' : 'bg-emerald-600'}`} />
                  {product.current_stock <= product.reorder_level ? 'Low Stock' : 'In Stock'}
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditingProduct(product); setFormData(product); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:text-amber-500"><Edit3 size={18}/></button>
                  <button onClick={async () => { if(confirm('Delete?')) { await supabase.from('products').delete().eq('id', product.id); fetchProducts(); }}} className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={18}/></button>
                </div>
              </div>

              <h3 className="text-xl font-black text-slate-900 uppercase truncate mb-1">{product.name}</h3>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4">{product.category} • {product.unit_type}</p>
              
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">In Stock</p>
                    <p className="text-3xl font-black italic text-slate-900">{product.current_stock}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Selling Price</p>
                    <p className="text-xl font-black text-slate-900 italic">KES {product.selling_price}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL CODE (Same as before, ensure fields match state) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl p-10 shadow-2xl overflow-y-auto max-h-[90vh]">
             {/* Form code here using formData... */}
             <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-5">
               <div className="col-span-2 space-y-1">
                 <label className="text-[10px] font-black text-slate-400 uppercase">Product Name</label>
                 <input required className="w-full bg-slate-50 p-4 rounded-xl border-2 border-slate-100 font-bold" 
                   value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
               </div>
               {/* Add all other fields similarly (barcode, category, unit_type, cost_price, selling_price, current_stock, reorder_level) */}
               <button type="submit" className="col-span-2 py-5 bg-slate-900 text-amber-500 font-black rounded-2xl mt-4 uppercase">
                 {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Confirm Save'}
               </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}